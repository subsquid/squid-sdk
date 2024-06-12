import {
    EntityManager,
    EntityMetadata,
    EntityNotFoundError,
    FindOptionsOrder,
    FindOptionsRelations,
    FindOptionsWhere,
} from 'typeorm'
import {EntityTarget} from 'typeorm/common/EntityTarget'
import {ChangeWriter} from './utils/changeWriter'
import {StateManager} from './utils/stateManager'
import {createLogger, Logger} from '@subsquid/logger'
import {createFuture, Future} from '@subsquid/util-internal'
import {EntityLiteral, noNull, splitIntoBatches, traverseEntity} from './utils/misc'
import {ColumnMetadata} from 'typeorm/metadata/ColumnMetadata'
import assert from 'assert'

export {EntityTarget}

export const enum FlushMode {

    /**
     * Send queries to the database transaction at every
     * direct database read (all read methods besides
     * .get()) and at the end of the batch.
     */
    AUTO,

    /**
     * Send queries to the database transaction strictly
     * at the end of the batch.
     */
    BATCH,

    /**
     * Send queries to the database transaction whenever
     * the data is read or written (including .get(),
     * .insert(), .upsert(), .delete())
     */
    ALWAYS
}

export const enum ResetMode {

    /**
     * Clear cache at the end of each batch or manually.
     */
    BATCH,

    /**
     * Clear cache only manually.
     */
    MANUAL,

    /**
     * Clear cache whenever any queries are sent to the
     * database transaction.
     */
    FLUSH
}

export const enum CacheMode {

    /**
     * Data from all database reads is cached.
     */
    ALL,

    /**
     * Only the data from flagged database reads is cached.
     */
    MANUAL
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

export interface StoreOptions {
    em: EntityManager
    state: StateManager
    changes?: ChangeWriter
    logger?: Logger
    flushMode: FlushMode
    resetMode: ResetMode
    cacheMode: CacheMode
}

/**
 * Restricted version of TypeORM entity manager for squid data handlers.
 */
export class Store {
    protected em: EntityManager
    protected state: StateManager
    protected changes?: ChangeWriter
    protected logger?: Logger

    protected flushMode: FlushMode
    protected resetMode: ResetMode
    protected cacheMode: CacheMode

    protected pendingCommit?: Future<void>
    protected isClosed = false

    constructor({em, changes, logger, state, flushMode, resetMode, cacheMode}: StoreOptions) {
        this.em = em
        this.changes = changes
        this.logger = logger?.child('store')
        this.state = state
        this.flushMode = flushMode
        this.resetMode = resetMode
        this.cacheMode = cacheMode
    }

    get _em() {
        return this.em
    }

    get _state() {
        return this.state
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
        return await this.performWrite(async () => {
            let entities = Array.isArray(e) ? e : [e]
            if (entities.length == 0) return

            for (const entity of entities) {
                const md = this.getEntityMetadata(entity.constructor)
                this.state.upsert(md, entity)
            }
        })
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
        this.logger?.debug(`upsert ${entities.length} ${metadata.name} entities`)
        await this.changes?.writeUpsert(metadata, entities)

        let fk = metadata.columns.filter(c => c.relationMetadata)
        if (fk.length == 0) return this.upsertMany(metadata.target, entities)
        let signatures = entities
            .map(e => ({entity: e, value: this.getFkSignature(fk, e)}))
            .sort((a, b) => (a.value > b.value ? -1 : b.value > a.value ? 1 : 0))
        let currentSignature = signatures[0].value
        let batch: EntityLiteral[] = []
        for (let s of signatures) {
            if (s.value === currentSignature) {
                batch.push(s.entity)
            } else {
                await this.upsertMany(metadata.target, batch)
                currentSignature = s.value
                batch = [s.entity]
            }
        }
        if (batch.length) {
            await this.upsertMany(metadata.target, batch)
        }
    }

    private async upsertMany(target: EntityTarget<any>, entities: EntityLiteral[]) {
        for (let b of splitIntoBatches(entities, 1000)) {
            await this.em.upsert(target, b as any, ['id'])
        }
    }

    /**
     * Inserts a given entity or entities into the database.
     * Does not check if the entity(s) exist in the database and will fail if a duplicate is inserted.
     *
     * Executes a primitive INSERT operation without cascades, relations, etc.
     */
    async insert<E extends EntityLiteral>(e: E | E[]): Promise<void> {
        return await this.performWrite(async () => {
            const entities = Array.isArray(e) ? e : [e]
            if (entities.length == 0) return

            for (const entity of entities) {
                const md = this.getEntityMetadata(entity.constructor)
                this.state.insert(md, entity)
            }
        })
    }

    private async _insert(metadata: EntityMetadata, entities: EntityLiteral[]) {
        this.logger?.debug(`insert ${entities.length} ${metadata.name} entities`)
        await this.changes?.writeInsert(metadata, entities)
        await this.insertMany(metadata.target, entities)
    }

    private async insertMany(target: EntityTarget<any>, entities: EntityLiteral[]) {
        for (let b of splitIntoBatches(entities, 1000)) {
            await this.em.insert(target, b)
        }
    }

    /**
     * Deletes a given entity or entities from the database.
     *
     * Executes a primitive DELETE query without cascades, relations, etc.
     */
    async delete<E extends EntityLiteral>(e: E | E[]): Promise<void>
    async delete<E extends EntityLiteral>(target: EntityTarget<E>, id: string | string[]): Promise<void>
    async delete<E extends EntityLiteral>(e: E | E[] | EntityTarget<E>, id?: string | string[]): Promise<void> {
        return await this.performWrite(async () => {
            if (id == null) {
                const entities = Array.isArray(e) ? e : [e as E]
                if (entities.length == 0) return

                for (const entity of entities) {
                    const md = this.getEntityMetadata(entity.constructor)

                    this.state.delete(md, entity.id)
                }
            } else {
                const ids = Array.isArray(id) ? id : [id]
                if (ids.length == 0) return

                const md = this.getEntityMetadata(e as EntityTarget<E>)
                for (const id of ids) {
                    this.state.delete(md, id)
                }
            }
        })
    }

    private async _delete(metadata: EntityMetadata, ids: string[]) {
        this.logger?.debug(`delete ${metadata.name} ${ids.length} entities`)
        await this.changes?.writeDelete(metadata, ids)
        await this.em.delete(metadata.target, ids) // NOTE: should be split by chunks too?
    }

    async count<E extends EntityLiteral>(target: EntityTarget<E>, options?: FindManyOptions<E>): Promise<number> {
        return await this.performRead(async () => {
            return await this.em.count(target, options)
        })
    }

    async countBy<E extends EntityLiteral>(
        target: EntityTarget<E>,
        where: FindOptionsWhere<E> | FindOptionsWhere<E>[]
    ): Promise<number> {
        return await this.count(target, {where})
    }

    async find<E extends EntityLiteral>(target: EntityTarget<E>, options: FindManyOptions<E>): Promise<E[]> {
        return await this.performRead(async () => {
            const {cache, ...opts} = options
            const res = await this.em.find(target, opts)
            if (cache ?? this.cacheMode === CacheMode.ALL) {
                const metadata = this.getEntityMetadata(target)
                for (const e of res) {
                    this.cacheEntity(metadata, e)
                }
            }
            return res
        })
    }

    async findBy<E extends EntityLiteral>(
        target: EntityTarget<E>,
        where: FindOptionsWhere<E> | FindOptionsWhere<E>[],
        cache?: boolean
    ): Promise<E[]> {
        return await this.find(target, {where, cache})
    }

    async findOne<E extends EntityLiteral>(
        target: EntityTarget<E>,
        options: FindOneOptions<E>
    ): Promise<E | undefined> {
        return await this.performRead(async () => {
            const {cache, ...opts} = options
            const res = await this.em.findOne(target, opts).then(noNull)
            if (cache ?? this.cacheMode === CacheMode.ALL) {
                const metadata = this.getEntityMetadata(target)
                const idOrEntity = res || getIdFromWhere(options.where)
                this.cacheEntity(metadata, idOrEntity)
            }
            return res
        })
    }

    async findOneBy<E extends EntityLiteral>(
        target: EntityTarget<E>,
        where: FindOptionsWhere<E> | FindOptionsWhere<E>[],
        cache?: boolean
    ): Promise<E | undefined> {
        return await this.findOne(target, {where, cache})
    }

    async findOneOrFail<E extends EntityLiteral>(target: EntityTarget<E>, options: FindOneOptions<E>): Promise<E> {
        const res = await this.findOne(target, options)
        if (res == null) throw new EntityNotFoundError(target, options.where)
        return res
    }

    async findOneByOrFail<E extends EntityLiteral>(
        target: EntityTarget<E>,
        where: FindOptionsWhere<E> | FindOptionsWhere<E>[],
        cache?: boolean
    ): Promise<E> {
        const res = await this.findOneBy(target, where, cache)
        if (res == null) throw new EntityNotFoundError(target, where)
        return res
    }

    /**
     * Get an entity by its id and put it in the cache.
     * Subsequent calls to .get() with the same id will return the entity from the memory cache.
     */
    async get<E extends EntityLiteral>(target: EntityTarget<E>, id: string): Promise<E | undefined>
    async get<E extends EntityLiteral>(target: EntityTarget<E>, options: GetOptions<E>): Promise<E | undefined>
    async get<E extends EntityLiteral>(
        target: EntityTarget<E>,
        idOrOptions: string | GetOptions<E>
    ): Promise<E | undefined> {
        const {id, relations} = parseGetOptions(idOrOptions)
        const metadata = this.getEntityMetadata(target)
        let entity = this.state.get<E>(metadata, id, relations)
        if (entity !== undefined) {
            return noNull(entity)
        }

        return await this.findOne(target, {where: {id} as any, relations, cache: true})
    }

    /**
     * Get an entity by its id and put it in the cache or throw an error.
     * Subsequent calls to .getOrFail() with the same id will return the entity from the memory cache.
     */
    async getOrFail<E extends EntityLiteral>(target: EntityTarget<E>, id: string): Promise<E>
    async getOrFail<E extends EntityLiteral>(target: EntityTarget<E>, options: GetOptions<E>): Promise<E>
    async getOrFail<E extends EntityLiteral>(target: EntityTarget<E>, idOrOptions: string | GetOptions<E>): Promise<E> {
        const options = parseGetOptions(idOrOptions)
        let e = await this.get(target, options)
        if (e == null) throw new EntityNotFoundError(target, options.id)
        return e
    }

    reset(): void {
        this.state.reset()
    }

    async flush(reset?: boolean): Promise<void> {
        await this.pendingCommit?.promise()

        this.pendingCommit = createFuture()
        try {
            await this.state.performUpdate(async ({upserts, inserts, deletes, extraUpserts}) => {
                for (const {metadata, entities} of upserts) {
                    await this._upsert(metadata, entities)
                }

                for (const {metadata, entities} of inserts) {
                    await this._insert(metadata, entities)
                }

                for (const {metadata, ids} of deletes) {
                    await this._delete(metadata, ids)
                }

                for (const {metadata, entities} of extraUpserts) {
                    await this._upsert(metadata, entities)
                }
            })

            if (reset ?? this.resetMode === ResetMode.FLUSH) {
                this.reset()
            }
        } finally {
            this.pendingCommit.resolve()
            this.pendingCommit = undefined
        }
    }

    private async performRead<T>(cb: () => Promise<T>): Promise<T> {
        this.assertNotClosed()
        if (this.flushMode === FlushMode.AUTO || this.flushMode === FlushMode.ALWAYS) {
            await this.flush()
        }
        return await cb()
    }

    private async performWrite(cb: () => Promise<void>): Promise<void> {
        this.assertNotClosed()
        await this.pendingCommit?.promise()
        await cb()
        if (this.flushMode === FlushMode.ALWAYS) {
            await this.flush()
        }
    }

    private assertNotClosed() {
        assert(!this.isClosed, `too late to perform db updates, make sure you haven't forgot to await on db query`)
    }

    private cacheEntity<E extends EntityLiteral>(metadata: EntityMetadata, entityOrId?: E | string) {
        if (entityOrId == null) {
            return
        } else if (typeof entityOrId === 'string') {
            this.state.settle(metadata, entityOrId)
        } else {
            traverseEntity(metadata, entityOrId, (e, md) => this.state.persist(md, e))
        }
    }

    private getEntityMetadata(target: EntityTarget<any>) {
        return this.em.connection.getMetadata(target)
    }
}

function parseGetOptions<E>(idOrOptions: string | GetOptions<E>): GetOptions<E> {
    if (typeof idOrOptions === 'string') {
        return {id: idOrOptions}
    } else {
        return idOrOptions
    }
}

function getIdFromWhere(where?: FindOptionsWhere<EntityLiteral>) {
    return typeof where?.id === 'string' ? where.id : undefined
}
