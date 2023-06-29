import type {EntityManager, EntityMetadata} from 'typeorm'
import {Entity, EntityClass} from './store'


export interface RowRef {
    table: string
    id: string
}


export interface InsertRecord extends RowRef {
    kind: 'insert'
}


export interface DeleteRecord extends RowRef {
    kind: 'delete'
    fields: Record<string, any>
}


export interface UpdateRecord extends RowRef {
    kind: 'update'
    fields: Record<string, any>
}


export type ChangeRecord = InsertRecord | UpdateRecord | DeleteRecord


export interface ChangeRow {
    block_height: number
    index: number
    change: ChangeRecord
}


export class ChangeTracker {
    private index = 0

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
            meta.tableName,
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
        let deletedEntities = await this.fetchEntities(meta.tableName, ids)
        return this.writeChangeRows(deletedEntities.map(e => {
            let {id, ...fields} = e
            return {
                kind: 'delete',
                table: meta.tableName,
                id: id,
                fields
            }
        }))
    }

    private async fetchEntities(table: string, ids: string[]): Promise<Entity[]> {
        let entities = await this.em.query(
            `SELECT * FROM ${this.escape(table)} WHERE id = ANY($1::text[])`,
            [ids]
        )

        // Use different representation for raw bytes.
        // That's because we can't serialize Buffer values in change records
        // via `JSON.stringify()` (even with replacement function).
        // It would be better to handle this issue during change record serialization,
        // but it is just easier to do it here...
        for (let e of entities) {
            for (let key in e) {
                let value = e[key]
                if (value instanceof Uint8Array) {
                    value = Buffer.isBuffer(value)
                        ? value
                        : Buffer.from(value.buffer, value.byteOffset, value.byteLength)
                    e[key] = '\\x' + value.toString('hex').toUpperCase()
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
        return escape(this.em, name)
    }
}


export async function rollbackBlock(
    statusSchema: string,
    em: EntityManager,
    blockHeight: number
): Promise<void> {
    let schema = escape(em, statusSchema)

    let changes: ChangeRow[] = await em.query(
        `SELECT block_height, index, change FROM ${schema}.hot_change_log WHERE block_height = $1 ORDER BY index DESC`,
        [blockHeight]
    )

    for (let rec of changes) {
        let {table, id} = rec.change
        table = escape(em, table)
        switch(rec.change.kind) {
            case 'insert':
                await em.query(`DELETE FROM ${table} WHERE id = $1`, [id])
                break
            case 'update': {
                let setPairs = Object.keys(rec.change.fields).map((column, idx) => {
                    return `${escape(em, column)} = $${idx + 1}`
                })
                if (setPairs.length) {
                    await em.query(
                        `UPDATE ${table} SET ${setPairs.join(', ')} WHERE id = $${setPairs.length + 1}`,
                        [...Object.values(rec.change.fields), id]
                    )
                }
                break
            }
            case 'delete': {
                let columns = ['id', ...Object.keys(rec.change.fields)].map(col => escape(em, col))
                let values = columns.map((col, idx) => `$${idx + 1}`)
                await em.query(
                    `INSERT INTO ${table} (${columns}) VALUES (${values.join(', ')})`,
                    [id, ...Object.values(rec.change.fields)]
                )
                break
            }
        }
    }

    await em.query(`DELETE FROM ${schema}.hot_block WHERE height = $1`, [blockHeight])
}


function escape(em: EntityManager, name: string): string {
    return em.connection.driver.escape(name)
}
