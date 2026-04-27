import {assertNotNull} from '@subsquid/util-internal'
import type {DataSource, EntityManager, EntityMetadata} from 'typeorm'
import {ColumnMetadata} from 'typeorm/metadata/ColumnMetadata'
import {escapeIdentifier} from './misc'
import {Entity, EntityClass} from './store'


interface ChildCascade {
    meta: EntityMetadata
    column: string
}


const CASCADE_MAP_CACHE = new WeakMap<DataSource, Promise<Map<string, ChildCascade[]>>>()


async function buildCascadeMap(em: EntityManager): Promise<Map<string, ChildCascade[]>> {
    let metasByTable = new Map<string, EntityMetadata>()
    for (let meta of em.connection.entityMetadatas) {
        metasByTable.set(meta.tableName, meta)
    }

    // Discover ON DELETE CASCADE FKs from the live schema. Entity decorators
    // don't always carry onDelete (e.g. when the cascade clause lives only in
    // the SQL migration), so introspecting pg_catalog is the source of truth.
    let rows: {child_table: string; child_column: string; parent_table: string}[] = await em.query(
        `SELECT
            cl_child.relname AS child_table,
            att_child.attname AS child_column,
            cl_parent.relname AS parent_table
           FROM pg_constraint c
           JOIN pg_class cl_child ON cl_child.oid = c.conrelid
           JOIN pg_class cl_parent ON cl_parent.oid = c.confrelid
           JOIN pg_attribute att_child
             ON att_child.attrelid = c.conrelid AND att_child.attnum = c.conkey[1]
          WHERE c.contype = 'f' AND c.confdeltype = 'c'`
    )

    let map = new Map<string, ChildCascade[]>()
    for (let r of rows) {
        let childMeta = metasByTable.get(r.child_table)
        if (!childMeta) continue
        let bucket = map.get(r.parent_table)
        if (!bucket) {
            bucket = []
            map.set(r.parent_table, bucket)
        }
        bucket.push({meta: childMeta, column: r.child_column})
    }
    return map
}


export interface RowRef {
    table: string
    id: string
}


export interface InsertRecord extends RowRef {
    kind: 'insert'
    schema?: string
}


export interface DeleteRecord extends RowRef {
    kind: 'delete'
    fields: Record<string, any>
    schema?: string
}


export interface UpdateRecord extends RowRef {
    kind: 'update'
    fields: Record<string, any>
    schema?: string
}


export type ChangeRecord = InsertRecord | UpdateRecord | DeleteRecord


export interface ChangeRow {
    block_height: number
    index: number
    change: ChangeRecord
}


export class ChangeTracker {
    // index 0 is reserved for the per-block sentinel inserted by
    // database.ts:insertHotBlock; user-tracked changes start at 1.
    private index = 1

    constructor(
        private em: EntityManager,
        private statusSchema: string,
        private blockHeight: number
    ) {
        this.statusSchema = this.escape(this.statusSchema)
    }

    trackInsert(type: EntityClass<Entity>, entities: Entity[]): Promise<void> {
        let meta = this.getEntityMetadata(type)
        return this.writeChangeRows(entities.map(e => {
            return {
                kind: 'insert',
                table: meta.tableName,
                id: e.id
            }
        }))
    }

    async trackUpsert(type: EntityClass<Entity>, entities: Entity[]): Promise<void> {
        let meta = this.getEntityMetadata(type)

        let touchedRows = await this.fetchEntities(
            meta,
            entities.map(e => e.id)
        ).then(
            entities => new Map(
                entities.map(({id, ...fields}) => [id, fields])
            )
        )

        return this.writeChangeRows(entities.map(e => {
            let fields = touchedRows.get(e.id)
            if (fields) {
                return {
                    kind: 'update',
                    table: meta.tableName,
                    id: e.id,
                    fields
                }
            } else {
                return {
                    kind: 'insert',
                    table: meta.tableName,
                    id: e.id,
                }
            }
        }))
    }

    async trackDelete(type: EntityClass<Entity>, ids: string[]): Promise<void> {
        let meta = this.getEntityMetadata(type)
        let cascadeMap = await this.getCascadeMap()
        let changes: ChangeRecord[] = []
        await this.collectCascadeDeletes(meta, ids, cascadeMap, changes)
        return this.writeChangeRows(changes)
    }

    private async collectCascadeDeletes(
        meta: EntityMetadata,
        ids: string[],
        cascadeMap: Map<string, ChildCascade[]>,
        out: ChangeRecord[],
    ): Promise<void> {
        if (ids.length === 0) return

        let children = cascadeMap.get(meta.tableName) ?? []
        for (let child of children) {
            let childIds: string[] = (
                await this.em.query(
                    `SELECT id FROM ${this.escape(child.meta.tableName)} WHERE ${this.escape(child.column)} = ANY($1::text[])`,
                    [ids]
                )
            ).map((r: {id: string}) => r.id)
            if (childIds.length === 0) continue
            // Recurse so descendants land in `out` before this child level;
            // rollback iterates DESC, so the top-level parent is restored
            // first and grandchildren last — matching insert-order FK rules.
            await this.collectCascadeDeletes(child.meta, childIds, cascadeMap, out)
        }

        let parentRows = await this.fetchEntities(meta, ids)
        for (let row of parentRows) {
            let {id, ...fields} = row
            out.push({kind: 'delete', table: meta.tableName, id, fields})
        }
    }

    private async getCascadeMap(): Promise<Map<string, ChildCascade[]>> {
        let connection = this.em.connection
        let cached = CASCADE_MAP_CACHE.get(connection)
        if (cached) return cached
        let promise = buildCascadeMap(this.em)
        CASCADE_MAP_CACHE.set(connection, promise)
        return promise
    }


    private async fetchEntities(meta: EntityMetadata, ids: string[]): Promise<Entity[]> {
        let entities = await this.em.query(
            `SELECT * FROM ${this.escape(meta.tableName)} WHERE id = ANY($1::text[])`,
            [ids]
        )

        // Here we transform the row object returned by the driver to its
        // JSON variant in such a way, that `driver.query('UPDATE entity SET field = $1', [json.field])`
        // would be always correctly handled.
        //
        // It would be better to handle it during change record serialization,
        // but it is just easier to do it here...
        for (let e of entities) {
            for (let key in e) {
                let value = e[key]
                if (value instanceof Uint8Array) {
                    value = Buffer.isBuffer(value)
                        ? value
                        : Buffer.from(value.buffer, value.byteOffset, value.byteLength)
                    e[key] = '\\x' + value.toString('hex').toUpperCase()
                } else if (Array.isArray(value) && isJsonProp(meta, key)) {
                    e[key] = JSON.stringify(value)
                }
            }
        }

        return entities
    }

    private writeChangeRows(changes: ChangeRecord[]): Promise<void> {
        let height = new Array(changes.length)
        let index = new Array(changes.length)
        let change = new Array(changes.length)

        height.fill(this.blockHeight)

        for (let i = 0; i < changes.length; i++) {
            index[i] = this.index++
            change[i] = JSON.stringify(changes[i])
        }

        let sql = `INSERT INTO ${this.statusSchema}.hot_change_log (block_height, index, change)`
        sql += ' SELECT block_height, index, change::jsonb'
        sql += ' FROM unnest($1::int[], $2::int[], $3::text[]) AS i(block_height, index, change)'

        return this.em.query(sql, [height, index, change]).then(() => {})
    }

    private getEntityMetadata(type: EntityClass<Entity>): EntityMetadata {
        return this.em.connection.getMetadata(type)
    }

    private escape(name: string): string {
        return escapeIdentifier(this.em, name)
    }
}


export async function rollbackBlock(
    statusSchema: string,
    em: EntityManager,
    blockHeight: number
): Promise<void> {
    let schema = escapeIdentifier(em, statusSchema)

    let changes: ChangeRow[] = await em.query(
        `SELECT block_height, index, change FROM ${schema}.hot_change_log WHERE block_height = $1 ORDER BY index DESC`,
        [blockHeight]
    )

    for (let rec of changes) {
        let ch = rec.change
        let {id} = ch
        switch (ch.kind) {
            case 'insert': {
                let fromTable = ch.schema
                    ? `${escapeIdentifier(em, ch.schema)}.${escapeIdentifier(em, ch.table)}`
                    : escapeIdentifier(em, ch.table)
                await em.query(`DELETE FROM ${fromTable} WHERE id = $1`, [id])
                break
            }
            case 'update': {
                let fromTable = ch.schema
                    ? `${escapeIdentifier(em, ch.schema)}.${escapeIdentifier(em, ch.table)}`
                    : escapeIdentifier(em, ch.table)
                let setPairs = Object.keys(ch.fields).map((column, idx) => {
                    return `${escapeIdentifier(em, column)} = $${idx + 1}`
                })
                if (setPairs.length) {
                    await em.query(
                        `UPDATE ${fromTable} SET ${setPairs.join(', ')} WHERE id = $${setPairs.length + 1}`,
                        [...Object.values(ch.fields), id]
                    )
                }
                break
            }
            case 'delete': {
                let fromTable = ch.schema
                    ? `${escapeIdentifier(em, ch.schema)}.${escapeIdentifier(em, ch.table)}`
                    : escapeIdentifier(em, ch.table)
                let columns = ['id', ...Object.keys(ch.fields)].map(col => escapeIdentifier(em, col))
                let values = columns.map((col, idx) => `$${idx + 1}`)
                await em.query(
                    `INSERT INTO ${fromTable} (${columns}) VALUES (${values.join(', ')})`,
                    [id, ...Object.values(ch.fields)]
                )
                break
            }
        }
    }

    await em.query(`DELETE FROM ${schema}.template_registry WHERE height = $1`, [blockHeight])
    await em.query(`DELETE FROM ${schema}.hot_block WHERE height = $1`, [blockHeight])
}


const ENTITY_COLUMNS = new WeakMap<EntityMetadata, Map<string, ColumnMetadata>>()


function getColumn(meta: EntityMetadata, fieldName: string): ColumnMetadata {
    let columns = ENTITY_COLUMNS.get(meta)
    if (columns == null) {
        columns = new Map()
        ENTITY_COLUMNS.set(meta, columns)
    }
    let col = columns.get(fieldName)
    if (col == null) {
        col = assertNotNull(meta.findColumnWithDatabaseName(fieldName))
        columns.set(fieldName, col)
    }
    return col
}


function isJsonProp(meta: EntityMetadata, fieldName: string): boolean {
    let col = getColumn(meta, fieldName)
    switch(col.type) {
        case 'jsonb':
        case 'json':
            return true
        default:
            return false
    }
}
