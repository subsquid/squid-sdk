import assert from 'assert'
import {
    EntityManager,
    EntityMetadata,
    FindOptionsOrder,
    FindOptionsRelations,
    FindOptionsWhere,
    ObjectLiteral,
} from 'typeorm'
import {EntityTarget} from 'typeorm/common/EntityTarget'
import {ChangeWriter} from './utils/changeWriter'
import {CacheMap} from './utils/cacheMap'
import {ChangeTracker, ChangeType} from './utils/changeTracker'
import {createLogger, Logger} from '@subsquid/logger'
import {createFuture, def, Future} from '@subsquid/util-internal'
import {copy} from './utils/misc'
import {ColumnMetadata} from 'typeorm/metadata/ColumnMetadata'

export {EntityTarget}

export interface EntityLiteral extends ObjectLiteral {
    id: string
}

export type ChangeSet = {
    metadata: EntityMetadata
    inserts: EntityLiteral[]
    upserts: EntityLiteral[]
    deletes: string[]
    extraUpserts: EntityLiteral[]
}

export interface GetOptions<E = any> {
    id: string
    relations?: FindOptionsRelations<E>
}

/**
 * Defines a special criteria to find specific entity.
 */
export interface FindOneOptions<Entity = any> {
    /**
     * Adds a comment with the supplied string in the generated query.  This is
     * helpful for debugging purposes, such as finding a specific query in the
     * database server's logs, or for categorization using an APM product.
     */
    comment?: string
    /**
     * Simple condition that should be applied to match entities.
     */
    where?: FindOptionsWhere<Entity>[] | FindOptionsWhere<Entity>
    /**
     * Indicates what relations of entity should be loaded (simplified left join form).
     */
    relations?: FindOptionsRelations<Entity>
    /**
     * Order, in which entities should be ordered.
     */
    order?: FindOptionsOrder<Entity>

    cache?: boolean
}

export interface FindManyOptions<Entity = any> extends FindOneOptions<Entity> {
    /**
     * Offset (paginated) where from entities should be taken.
     */
    skip?: number
    /**
     * Limit (paginated) - max number of entities should be taken.
     */
    take?: number

    cache?: boolean
}

/**
 * Restricted version of TypeORM entity manager for squid data handlers.
 */
export class Store {
    protected commitOrder: EntityMetadata[]
    protected tracker?: ChangeWriter
    protected changes: ChangeTracker
    protected cache: CacheMap
    protected logger: Logger

    protected pendingCommit?: Future<void>

    constructor(
        protected em: () => EntityManager,
        {
            commitOrder,
            tracker,
        }: {
            commitOrder: EntityMetadata[]
            tracker?: ChangeWriter
        }
    ) {
        this.logger = createLogger('sqd:typeorm-store')
        this.commitOrder = commitOrder
        this.tracker = tracker
        this.cache = new CacheMap({logger: this.logger})
        this.changes = new ChangeTracker({logger: this.logger})
    }

    /**
     * Alias for {@link Store.upsert}
     */
    async save<E extends EntityLiteral>(e: E | E[]): Promise<void> {
        return this.upsert(e)
    }

    /**
     * Upserts a given entity or entities into the database.
     *
     * It always executes a primitive operation without cascades, relations, etc.
     */
    async upsert<E extends EntityLiteral>(e: E | E[]): Promise<void> {
        await this.pendingCommit?.promise()

        let entities = Array.isArray(e) ? e : [e]
        if (entities.length == 0) return

        for (const entity of entities) {
            const md = this.getEntityMetadata(entity.constructor)

            const isNew = this.changes.isDeleted(md, entity.id)

            this.changes.trackUpsert(md, entity.id)
            this.cache.add(md, entity, isNew)
        }
    }

    private getFkSignature(fk: ColumnMetadata[], entity: any): bigint {
        let sig = 0n
        for (let i = 0; i < fk.length; i++) {
            let bit = fk[i].getEntityValue(entity) === undefined ? 0n : 1n
            sig |= bit << BigInt(i)
        }
        return sig
    }

    private async _upsert(metadata: EntityMetadata, entities: EntityLiteral[]): Promise<void> {
        this.logger.debug(`upsert ${entities.length} ${metadata.name} entities`)
        await this.tracker?.writeUpsert(metadata, entities)

        let fk = metadata.columns.filter((c) => c.relationMetadata)
        if (fk.length == 0) return this.upsertMany(metadata.target, entities)
        let currentSignature = this.getFkSignature(fk, entities[0])
        let batch: EntityLiteral[] = []
        for (let e of entities) {
            let sig = this.getFkSignature(fk, e)
            if (sig === currentSignature) {
                batch.push(e)
            } else {
                await this.upsertMany(metadata.target, batch)
                currentSignature = sig
                batch = [e]
            }
        }
        if (batch.length) {
            await this.upsertMany(metadata.target, batch)
        }
    }

    private async upsertMany(target: EntityTarget<any>, entities: EntityLiteral[]) {
        for (let b of splitIntoBatches(entities, 1000)) {
            await this.em().upsert(target, b as any, ['id'])
        }
    }

    /**
     * Inserts a given entity or entities into the database.
     * Does not check if the entity(s) exist in the database and will fail if a duplicate is inserted.
     *
     * Executes a primitive INSERT operation without cascades, relations, etc.
     */
    async insert<E extends EntityLiteral>(e: E | E[]): Promise<void> {
        await this.pendingCommit?.promise()

        const entities = Array.isArray(e) ? e : [e]
        if (entities.length == 0) return

        for (const entity of entities) {
            const md = this.getEntityMetadata(entity.constructor)

            this.changes.trackInsert(md, entity.id)
            this.cache.add(md, entity, true)
        }
    }

    private async _insert(metadata: EntityMetadata, entities: EntityLiteral[]) {
        this.logger.debug(`insert ${entities.length} ${metadata.name} entities`)
        await this.tracker?.writeInsert(metadata, entities)
        await this.insertMany(metadata.target, entities)
    }

    private async insertMany(target: EntityTarget<any>, entities: EntityLiteral[]) {
        for (let b of splitIntoBatches(entities, 1000)) {
            await this.em().insert(target, b)
        }
    }

    /**
     * Deletes a given entity or entities from the database.
     *
     * Executes a primitive DELETE query without cascades, relations, etc.
     */
    async delete<E extends EntityLiteral>(e: E | E[] | EntityTarget<E>, id?: string | string[]): Promise<void> {
        await this.pendingCommit?.promise()

        if (id == null) {
            const entities = Array.isArray(e) ? e : [e as E]
            if (entities.length == 0) return

            for (const entity of entities) {
                const md = this.getEntityMetadata(entity.constructor)

                this.changes.trackDelete(md, entity.id)
                this.cache.delete(md, entity.id)
            }
        } else {
            const ids = Array.isArray(id) ? id : [id]
            if (ids.length == 0) return

            const md = this.getEntityMetadata(e as EntityTarget<E>)
            for (const id of ids) {
                this.changes.trackDelete(md, id)
                this.cache.delete(md, id)
            }
        }
    }

    private async _delete(metadata: EntityMetadata, ids: string[]) {
        this.logger.debug(`delete ${metadata.name} ${ids.length} entities`)
        await this.tracker?.writeDelete(metadata, ids)
        await this.em().delete(metadata.target, ids) // TODO: should be split by chunks too?
    }

    async count<E extends EntityLiteral>(target: EntityTarget<E>, options?: FindManyOptions<E>): Promise<number> {
        await this.commit()
        return await this.em().count(target, options)
    }

    async countBy<E extends EntityLiteral>(
        target: EntityTarget<E>,
        where: FindOptionsWhere<E> | FindOptionsWhere<E>[]
    ): Promise<number> {
        await this.commit()
        return await this.em().countBy(target, where)
    }

    async find<E extends EntityLiteral>(target: EntityTarget<E>, options: FindManyOptions<E>): Promise<E[]> {
        await this.commit()

        const {cache, ...opts} = options
        const res = await this.em().find(target, opts)
        if (cache) this.cacheEntities(target, res, options?.relations)

        return res
    }

    async findBy<E extends EntityLiteral>(
        target: EntityTarget<E>,
        where: FindOptionsWhere<E> | FindOptionsWhere<E>[],
        cache?: boolean
    ): Promise<E[]> {
        await this.commit()

        const res = await this.em().findBy(target, where)
        if (cache) this.cacheEntities(target, res)

        return res
    }

    async findOne<E extends EntityLiteral>(
        target: EntityTarget<E>,
        options: FindOneOptions<E>
    ): Promise<E | undefined> {
        await this.commit()

        const {cache, ...opts} = options
        const res = await this.em().findOne(target, opts).then(noNull)
        if (res != null && cache) this.cacheEntities(target, res, options?.relations)

        return res
    }

    async findOneBy<E extends EntityLiteral>(
        target: EntityTarget<E>,
        where: FindOptionsWhere<E> | FindOptionsWhere<E>[],
        cache?: boolean
    ): Promise<E | undefined> {
        await this.commit()

        const res = await this.em().findOneBy(target, where).then(noNull)
        if (res != null && cache) this.cacheEntities(target, res)

        return res
    }

    async findOneOrFail<E extends EntityLiteral>(target: EntityTarget<E>, options: FindOneOptions<E>): Promise<E> {
        await this.commit()

        const {cache, ...opts} = options
        const res = await this.em().findOneOrFail(target, opts)
        if (cache) this.cacheEntities(target, res, options?.relations)

        return res
    }

    async findOneByOrFail<E extends EntityLiteral>(
        target: EntityTarget<E>,
        where: FindOptionsWhere<E> | FindOptionsWhere<E>[],
        cache?: boolean
    ): Promise<E> {
        await this.commit()

        const res = await this.em().findOneByOrFail(target, where)
        if (cache) this.cacheEntities(target, res)

        return res
    }

    async get<E extends EntityLiteral>(entityClass: EntityTarget<E>, id: string): Promise<E | undefined>
    async get<E extends EntityLiteral>(entityClass: EntityTarget<E>, options: GetOptions<E>): Promise<E | undefined>
    async get<E extends EntityLiteral>(
        entityClass: EntityTarget<E>,
        idOrOptions: string | GetOptions<E>
    ): Promise<E | undefined> {
        const {id, relations} = parseGetOptions(idOrOptions)

        let entity = this.getFromCache<E>(entityClass, id, relations)
        if (entity !== undefined) return entity ?? undefined

        return await this.findOne(entityClass, {where: {id} as any, relations})
    }

    async getOrFail<E extends EntityLiteral>(entityClass: EntityTarget<E>, id: string): Promise<E>
    async getOrFail<E extends EntityLiteral>(entityClass: EntityTarget<E>, options: GetOptions<E>): Promise<E>
    async getOrFail<E extends EntityLiteral>(
        entityClass: EntityTarget<E>,
        idOrOptions: string | GetOptions<E>
    ): Promise<E> {
        const options = parseGetOptions(idOrOptions)
        let e = await this.get(entityClass, options)

        if (e == null) {
            const metadata = this.getEntityMetadata(entityClass)
            throw new Error(`Missing entity ${metadata.name} with id "${options.id}"`)
        }

        return e
    }

    async commit(): Promise<void> {
        await this.pendingCommit?.promise()

        this.pendingCommit = createFuture()
        try {
            const changeSets = this.computeChangeSets()

            for (const {metadata, upserts} of changeSets) {
                if (upserts.length === 0) continue
                await this._upsert(metadata, upserts)
            }

            for (const {metadata, inserts} of changeSets) {
                if (inserts.length === 0) continue
                await this._insert(metadata, inserts)
            }

            for (const {metadata, deletes} of [...changeSets].reverse()) {
                if (deletes.length === 0) continue
                await this._delete(metadata, deletes)
            }

            for (const {metadata, extraUpserts} of changeSets) {
                if (extraUpserts.length === 0) continue
                await this._upsert(metadata, extraUpserts)
            }
        } finally {
            this.pendingCommit.resolve()
            this.pendingCommit = undefined
        }
    }

    clear(): void {
        this.cache.clear()
        this.changes.clear()
    }

    async flush(): Promise<void> {
        await this.commit()
        this.clear()
    }

    private getFromCache<E extends EntityLiteral>(
        target: EntityTarget<E>,
        id: string,
        mask?: FindOptionsRelations<any>
    ): E | null | undefined {
        const metadata = this.getEntityMetadata(target)
        const cached = this.cache.get<E>(metadata, id)

        if (cached == null) {
            return undefined
        } else if (cached.value == null) {
            return null
        } else {
            const entity = cached.value

            const clonedEntity = metadata.create()

            for (const column of metadata.nonVirtualColumns) {
                const objectColumnValue = column.getEntityValue(entity)
                if (objectColumnValue !== undefined) {
                    column.setEntityValue(clonedEntity, copy(objectColumnValue))
                }
            }

            if (mask != null) {
                for (const relation of metadata.relations) {
                    const inverseMask = mask[relation.propertyName]
                    if (!inverseMask) continue

                    const inverseEntityMock = relation.getEntityValue(entity)

                    if (inverseEntityMock === undefined) {
                        return undefined // relation is missing, but required
                    } else if (inverseEntityMock === null) {
                        relation.setEntityValue(clonedEntity, null)
                    } else {
                        const cachedInverseEntity = this.getFromCache(
                            relation.inverseEntityMetadata.target,
                            inverseEntityMock.id,
                            typeof inverseMask === 'boolean' ? undefined : inverseMask
                        )

                        if (cachedInverseEntity === undefined) {
                            return undefined // unable to build whole relation chain
                        } else {
                            relation.setEntityValue(clonedEntity, cachedInverseEntity)
                        }
                    }
                }
            }

            return clonedEntity
        }
    }

    private cacheEntities<E extends EntityLiteral>(
        target: EntityTarget<E>,
        e: E | E[],
        mask?: FindOptionsRelations<any>
    ) {
        const metadata = this.getEntityMetadata(target)

        e = Array.isArray(e) ? e : [e]
        for (const entity of e) {
            traverseEntity({
                metadata,
                entity,
                mask: mask || null,
                cb: (e, md) => {
                    this.cache.add(md, e)
                },
            })
        }
    }

    private computeChangeSets() {
        const changes = this.changes.values()

        const changeSets: ChangeSet[] = []
        for (const metadata of this.commitOrder) {
            const entityChanges = changes.get(metadata)
            if (entityChanges == null) continue

            const changeSet = this.computeChangeSet(metadata, entityChanges)
            changeSets.push(changeSet)
        }

        this.changes.clear()

        return changeSets
    }

    private computeChangeSet(metadata: EntityMetadata, changes: Map<string, ChangeType>): ChangeSet {
        const inserts: EntityLiteral[] = []
        const upserts: EntityLiteral[] = []
        const deletes: string[] = []
        const extraUpserts: EntityLiteral[] = []

        for (const [id, type] of changes) {
            const cached = this.cache.get<EntityLiteral>(metadata, id)

            switch (type) {
                case ChangeType.Insert: {
                    assert(cached?.value != null, `unable to insert entity ${metadata.name} ${id}`)

                    inserts.push(cached.value)

                    const extraUpsert = this.extractExtraUpsert(metadata, cached.value)
                    if (extraUpsert != null) {
                        extraUpserts.push(extraUpsert)
                    }

                    break
                }
                case ChangeType.Upsert: {
                    assert(cached?.value != null, `unable to upsert entity ${metadata.name} ${id}`)

                    upserts.push(cached.value)

                    const extraUpsert = this.extractExtraUpsert(metadata, cached.value)
                    if (extraUpsert != null) {
                        extraUpserts.push(extraUpsert)
                    }

                    break
                }
                case ChangeType.Delete: {
                    deletes.push(id)
                    break
                }
            }
        }

        return {metadata, inserts, upserts, extraUpserts, deletes}
    }

    private extractExtraUpsert<E extends EntityLiteral>(metadata: EntityMetadata, entity: E) {
        const commitOrderIndex = this.commitOrder.indexOf(metadata)

        let extraUpsert: E | undefined
        for (const relation of metadata.relations) {
            if (relation.foreignKeys.length == 0) continue

            const inverseEntity = relation.getEntityValue(entity)
            if (inverseEntity == null) continue

            const inverseMetadata = relation.inverseEntityMetadata
            if (metadata === inverseMetadata && inverseEntity.id === entity.id) continue

            const invCommitOrderIndex = this.commitOrder.indexOf(inverseMetadata)
            if (invCommitOrderIndex < commitOrderIndex) continue

            const isInverseInserted = this.changes.isInserted(inverseMetadata, inverseEntity.id)
            if (!isInverseInserted) continue

            if (extraUpsert == null) {
                extraUpsert = metadata.create() as E
                extraUpsert.id = entity.id
                Object.assign(extraUpsert, entity)
            }

            relation.setEntityValue(entity, undefined)
        }

        return extraUpsert
    }

    private getEntityMetadata(target: EntityTarget<any>) {
        const em = this.em()
        return em.connection.getMetadata(target)
    }

    @def
    private reverseCommitOrder() {
        return [...this.commitOrder].reverse()
    }
}

function traverseEntity({
    metadata,
    entity,
    mask,
    cb,
}: {
    metadata: EntityMetadata
    entity: EntityLiteral | null
    mask: FindOptionsRelations<any> | null
    cb: (e: EntityLiteral, metadata: EntityMetadata) => void
}) {
    if (entity == null) return

    if (mask != null) {
        for (const relation of metadata.relations) {
            const inverseMask = mask[relation.propertyName]
            if (!inverseMask) continue

            const inverseEntity = relation.getEntityValue(entity)
            if (relation.isOneToMany || relation.isManyToMany) {
                if (!Array.isArray(inverseEntity)) continue
                for (const ie of inverseEntity) {
                    traverseEntity({
                        metadata: relation.inverseEntityMetadata,
                        entity: ie,
                        mask: inverseMask === true ? null : inverseMask,
                        cb,
                    })
                }
            } else {
                traverseEntity({
                    metadata: relation.inverseEntityMetadata,
                    entity: inverseEntity,
                    mask: inverseMask === true ? null : inverseMask,
                    cb,
                })
            }
        }
    }

    cb(entity, metadata)
}

function* splitIntoBatches<T>(list: T[], maxBatchSize: number): Generator<T[]> {
    if (list.length <= maxBatchSize) {
        yield list
    } else {
        let offset = 0
        while (list.length - offset > maxBatchSize) {
            yield list.slice(offset, offset + maxBatchSize)
            offset += maxBatchSize
        }
        yield list.slice(offset)
    }
}

function noNull<T>(val: null | undefined | T): T | undefined {
    return val == null ? undefined : val
}

function parseGetOptions<E>(idOrOptions: string | GetOptions<E>): GetOptions<E> {
    if (typeof idOrOptions === 'string') {
        return {id: idOrOptions}
    } else {
        return idOrOptions
    }
}
