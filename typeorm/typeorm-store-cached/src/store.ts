import {createLogger, Logger} from '@subsquid/logger'
import {
    Entity,
    EntityClass,
    FindManyOptions as FindManyOptions_,
    FindOneOptions as FindOneOptions_,
    Store,
} from '@subsquid/typeorm-store'
import {ChangeTracker} from '@subsquid/typeorm-store/lib/hot'
import assert from 'assert'
import {Mutex} from 'async-mutex'
import {
    EntityManager,
    EntityMetadata,
    EntityTarget,
    FindOptionsRelations,
    FindOptionsWhere,
    In,
    ObjectLiteral,
} from 'typeorm'
import {ColumnMetadata} from 'typeorm/metadata/ColumnMetadata'
import {CacheMap} from './utils/cacheMap'
import {DeferList} from './utils/deferList'
import {ChangeMap, ChangeType} from './utils/changeMap'
import {copy, splitIntoBatches} from './utils/misc'

export {Entity, EntityClass}

export interface EntityType extends ObjectLiteral {
    id: string
}

export type ChangeSet = {
    metadata: EntityMetadata
    inserts: EntityType[]
    upserts: EntityType[]
    removes: string[]
    extraUpserts: EntityType[]
}

export interface GetOptions<E = any> {
    id: string
    relations?: FindOptionsRelations<E>
}

export interface FindOneOptions<E> extends FindOneOptions_<E> {
    cache?: boolean
}

export interface FindManyOptions<E> extends FindManyOptions_<E> {
    cache?: boolean
}

// @ts-ignore
export class StoreWithCache extends Store {
    private commitOrder: EntityMetadata[]
    private updates: ChangeMap
    private defers: DeferList
    private cache: CacheMap
    private logger: Logger

    private currentCommit = new Mutex()
    private currentLoad = new Mutex()

    constructor(private em: () => EntityManager, opts: {changeTracker?: ChangeTracker; commitOrder: EntityMetadata[]}) {
        super(em, opts.changeTracker)
        this.commitOrder = opts.commitOrder
        this.logger = createLogger('sqd:store')
        this.cache = new CacheMap({logger: this.logger})
        this.updates = new ChangeMap({logger: this.logger})
        this.defers = new DeferList({logger: this.logger})
    }

    async insert<E extends EntityType>(entity: E): Promise<void>
    async insert<E extends EntityType>(entities: E[]): Promise<void>
    async insert<E extends EntityType>(e: E | E[]): Promise<void> {
        await this.currentCommit.waitForUnlock()

        const entities = Array.isArray(e) ? e : [e]
        if (entities.length == 0) return

        for (const entity of entities) {
            const md = this.getEntityMetadata(entity.constructor)

            this.updates.insert(md, entity.id)
            this.cache.add(md, entity, true)
        }
    }

    async upsert<E extends EntityType>(entity: E): Promise<void>
    async upsert<E extends EntityType>(entities: E[]): Promise<void>
    async upsert<E extends EntityType>(e: E | E[]): Promise<void> {
        await this.currentCommit.waitForUnlock()

        let entities = Array.isArray(e) ? e : [e]
        if (entities.length == 0) return

        for (const entity of entities) {
            const md = this.getEntityMetadata(entity.constructor)

            const isNew = this.updates.get(md, entity.id) === ChangeType.Remove

            this.updates.upsert(md, entity.id)
            this.cache.add(md, entity, isNew)
        }
    }

    async save<E extends EntityType>(entity: E): Promise<void>
    async save<E extends EntityType>(entities: E[]): Promise<void>
    async save<E extends EntityType>(e: E | E[]): Promise<void> {
        return await this.upsert(e as any)
    }

    async remove<E extends EntityType>(entity: E): Promise<void>
    async remove<E extends EntityType>(entities: E[]): Promise<void>
    async remove<E extends EntityType>(entityClass: EntityTarget<E>, id: string | string[]): Promise<void>
    async remove<E extends EntityType>(e: E | E[] | EntityTarget<E>, id?: string | string[]): Promise<void> {
        await this.currentCommit.waitForUnlock()

        if (id == null) {
            const entities = Array.isArray(e) ? e : [e as E]
            if (entities.length == 0) return

            for (const entity of entities) {
                const md = this.getEntityMetadata(entity.constructor)

                this.updates.remove(md, entity.id)
                this.cache.delete(md, entity.id)
            }
        } else {
            const ids = Array.isArray(id) ? id : [id]
            if (ids.length == 0) return

            const md = this.getEntityMetadata(e as EntityTarget<E>)
            for (const id of ids) {
                this.updates.remove(md, id)
                this.cache.delete(md, id)
            }
        }
    }

    async count<E extends EntityType>(entityClass: EntityTarget<E>, options?: FindManyOptions<E>): Promise<number> {
        await this.commit()
        return await super.count(entityClass as EntityClass<E>, options)
    }

    async countBy<E extends EntityType>(
      entityClass: EntityTarget<E>,
      where: FindOptionsWhere<E> | FindOptionsWhere<E>[]
    ): Promise<number> {
        await this.commit()
        return await super.countBy(entityClass as EntityClass<E>, where)
    }

    async find<E extends EntityType>(entityClass: EntityTarget<E>, options: FindManyOptions<E>): Promise<E[]> {
        await this.commit()

        const {cache, ...opts} = options
        const res = await super.find(entityClass as EntityClass<E>, opts)

        if (cache ?? true) {
            for (const entity of res) {
                this.traverseEntity(entity, opts.relations || null, (e) => {
                    const md = this.getEntityMetadata(e.constructor)
                    this.cache.add(md, e)
                })
            }
        }

        return res
    }

    async findBy<E extends EntityType>(
      entityClass: EntityTarget<E>,
      where: FindOptionsWhere<E> | FindOptionsWhere<E>[],
      cache?: boolean
    ): Promise<E[]> {
        await this.commit()
        const res = await super.findBy(entityClass as EntityClass<E>, where)

        if (cache ?? true) {
            for (const entity of res) {
                this.traverseEntity(entity, null, (e) => {
                    const md = this.getEntityMetadata(entityClass)
                    this.cache.add(md, e)
                })
            }
        }

        return res
    }

    async findOne<E extends EntityType>(
      entityClass: EntityTarget<E>,
      options: FindOneOptions<E>
    ): Promise<E | undefined> {
        await this.commit()

        const {cache, ...opts} = options
        const res = await super.findOne(entityClass as EntityClass<E>, opts)

        if (cache ?? true) {
            if (res != null) {
                this.traverseEntity(res, opts.relations || null, (e) => {
                    const md = this.getEntityMetadata(e.constructor)
                    this.cache.add(md, e)
                })
            }
        }

        return res
    }

    async findOneOrFail<E extends EntityType>(entityClass: EntityTarget<E>, options: FindOneOptions<E>): Promise<E> {
        await this.commit()

        const {cache, ...opts} = options
        const res = await super.findOneOrFail(entityClass as EntityClass<E>, opts)

        if (cache ?? true) {
            this.traverseEntity(res, opts.relations || null, (e) => {
                const md = this.getEntityMetadata(e.constructor)
                this.cache.add(md, e)
            })
        }

        return res
    }

    async findOneBy<E extends EntityType>(
      entityClass: EntityTarget<E>,
      where: FindOptionsWhere<E> | FindOptionsWhere<E>[],
      cache?: boolean
    ): Promise<E | undefined> {
        await this.commit()

        const res = await super.findOneBy(entityClass as EntityClass<E>, where)

        if (cache ?? true) {
            this.traverseEntity(res, null, (e) => {
                const md = this.getEntityMetadata(e.constructor)
                this.cache.add(md, e)
            })
        }

        return res
    }

    async findOneByOrFail<E extends EntityType>(
      entityClass: EntityTarget<E>,
      where: FindOptionsWhere<E> | FindOptionsWhere<E>[],
      cache?: boolean
    ): Promise<E> {
        await this.commit()

        const res = await super.findOneByOrFail(entityClass as EntityClass<E>, where)

        if (cache ?? true) {
            this.traverseEntity(res, null, (e) => {
                const md = this.getEntityMetadata(e.constructor)
                this.cache.add(md, e)
            })
        }

        return res
    }

    async get<E extends EntityType>(entityClass: EntityTarget<E>, id: string): Promise<E | undefined>
    async get<E extends EntityType>(entityClass: EntityTarget<E>, options: GetOptions<E>): Promise<E | undefined>
    async get<E extends EntityType>(
      entityClass: EntityTarget<E>,
      idOrOptions: string | GetOptions<E>
    ): Promise<E | undefined> {
        const {id, ...options} = parseGetOptions(idOrOptions)

        const metadata = this.getEntityMetadata(entityClass)

        let entity = this.getCached<E>(metadata, id, options.relations)
        if (entity !== undefined) return entity ?? undefined

        await this.load()

        entity = this.getCached(metadata, id, options.relations)
        if (entity !== undefined) return entity ?? undefined

        return await this.findOne(entityClass, {where: {id} as any, relations: options.relations})
    }

    async getOrFail<E extends EntityType>(entityClass: EntityTarget<E>, id: string): Promise<E>
    async getOrFail<E extends EntityType>(entityClass: EntityTarget<E>, options: GetOptions<E>): Promise<E>
    async getOrFail<E extends EntityType>(
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

    async getOrInsert<E extends EntityType>(
      entityClass: EntityTarget<E>,
      id: string,
      create: (id: string) => E | Promise<E>
    ): Promise<E>
    async getOrInsert<E extends EntityType>(
      entityClass: EntityTarget<E>,
      options: GetOptions<E>,
      create: (id: string) => E | Promise<E>
    ): Promise<E>
    async getOrInsert<E extends EntityType>(
      entityClass: EntityTarget<E>,
      idOrOptions: string | GetOptions<E>,
      create: (id: string) => E | Promise<E>
    ): Promise<E> {
        const options = parseGetOptions(idOrOptions)
        let e = await this.get(entityClass, options)

        if (e == null) {
            e = await create(options.id)
            await this.insert(e)
        }

        return e
    }

    /**
     * @deprecated use {@link getOrInsert} instead
     */
    async getOrCreate<E extends EntityType>(
      entityClass: EntityTarget<E>,
      idOrOptions: string | GetOptions<E>,
      create: (id: string) => E | Promise<E>
    ) {
        return this.getOrInsert(entityClass, idOrOptions as any, create)
    }

    defer<E extends EntityType>(entityClass: EntityTarget<E>, id: string): DeferredEntity<E>
    defer<E extends EntityType>(entityClass: EntityTarget<E>, options: GetOptions<E>): DeferredEntity<E>
    defer<E extends EntityType>(entityClass: EntityTarget<E>, idOrOptions: string | GetOptions<E>): DeferredEntity<E> {
        const md = this.getEntityMetadata(entityClass)

        const options = parseGetOptions(idOrOptions)
        this.defers.add(md, options.id, options.relations)

        return new DeferredEntity({
            get: async () => this.get(entityClass, options),
            getOrFail: async () => this.getOrFail(entityClass, options),
            getOrInsert: async (create) => this.getOrInsert(entityClass, options, create),
        })
    }

    async commit(): Promise<void> {
        await this.currentCommit.runExclusive(async () => {
            const log = this.logger.child('commit')

            const changeSets = this.computeChangeSets()

            for (const {metadata, inserts, upserts} of changeSets) {
                if (upserts.length > 0) {
                    log.debug(`commit upserts for ${metadata.name} (${upserts.length})`)
                    await super.upsert(upserts)
                }

                if (inserts.length > 0) {
                    log.debug(`commit inserts for ${metadata.name} (${inserts.length})`)
                    await super.insert(inserts)
                }
            }

            const changeSetsReversed = [...changeSets].reverse()
            for (const {metadata, removes} of changeSetsReversed) {
                if (removes.length > 0) {
                    log.debug(`commit removes for ${metadata.name} (${removes.length})`)
                    await super.remove(metadata.target as any, removes)
                }
            }

            for (const {metadata, extraUpserts} of changeSets) {
                if (extraUpserts.length > 0) {
                    log.debug(`commit extra upserts for ${metadata.name} (${extraUpserts.length})`)
                    await super.upsert(extraUpserts)
                }
            }
        })
    }

    clear(): void {
        this.cache.clear()
        this.updates.clear()
    }

    async flush(): Promise<void> {
        await this.commit()
        this.clear()
    }

    private computeChangeSets() {
        const changes = this.updates.values()

        const changeSets: ChangeSet[] = []
        for (const metadata of this.commitOrder) {
            const entityChanges = changes.get(metadata)
            if (entityChanges == null) continue

            const changeSet = this.computeChangeSet(metadata, entityChanges)
            changeSets.push(changeSet)
        }

        this.updates.clear()

        return changeSets
    }

    private computeChangeSet(metadata: EntityMetadata, changes: Map<string, ChangeType>): ChangeSet {
        const inserts: EntityType[] = []
        const upserts: EntityType[] = []
        const removes: string[] = []
        const extraUpserts: EntityType[] = []

        for (const [id, type] of changes) {
            const cached = this.cache.get<EntityType>(metadata, id)

            switch (type) {
                case ChangeType.Insert: {
                    assert(cached?.value != null, `unable to insert entity ${metadata.name} ${id}`)

                    inserts.push(cached.value)

                    const extraUpsert = this.extractExtraUpsert(cached.value)
                    if (extraUpsert != null) {
                        extraUpserts.push(extraUpsert)
                    }

                    break
                }
                case ChangeType.Upsert: {
                    assert(cached?.value != null, `unable to upsert entity ${metadata.name} ${id}`)

                    upserts.push(cached.value)

                    const extraUpsert = this.extractExtraUpsert(cached.value)
                    if (extraUpsert != null) {
                        extraUpserts.push(extraUpsert)
                    }

                    break
                }
                case ChangeType.Remove: {
                    removes.push(id)
                    break
                }
            }
        }

        return {metadata, inserts, upserts, extraUpserts, removes}
    }

    private async load(): Promise<void> {
        await this.currentLoad.runExclusive(async () => {
            const defers = this.defers.values()

            for (const [metadata, data] of defers) {
                const ids = Array.from(data.ids)

                for (let batch of splitIntoBatches(ids, 30000)) {
                    if (batch.length == 0) continue
                    await this.find<any>(metadata.target, {where: {id: In(batch)}, relations: data.relations})
                }

                for (const id of ids) {
                    this.cache.ensure(metadata, id)
                }
            }

            this.defers.clear()
        })
    }

    private getCached<E extends EntityType>(
      metadata: EntityMetadata,
      id: string,
      mask?: FindOptionsRelations<any>
    ): E | null | undefined {
        const cached = this.cache.get<E>(metadata, id)

        if (cached == null) {
            return undefined
        } else if (cached.value == null) {
            return null
        } else {
            return this.cloneEntity(cached.value, mask)
        }
    }

    private extractExtraUpsert<E extends EntityType>(entity: E) {
        const metadata = this.getEntityMetadata(entity.constructor)

        const commitOrderIndex = this.getCommitOrderIndex(metadata)

        let extraUpsert: E | undefined
        for (const relation of metadata.relations) {
            if (relation.foreignKeys.length == 0) continue

            const inverseEntity = relation.getEntityValue(entity)
            if (inverseEntity == null) continue

            const inverseMetadata = relation.inverseEntityMetadata
            if (metadata === inverseMetadata && inverseEntity.id === entity.id) continue

            const invCommitOrderIndex = this.getCommitOrderIndex(inverseMetadata)
            if (invCommitOrderIndex < commitOrderIndex) continue

            assert(relation.isNullable)

            const invUpdateType = this.updates.get(inverseMetadata, inverseEntity.id)
            if (invUpdateType === ChangeType.Insert) {
                if (extraUpsert == null) {
                    extraUpsert = metadata.create() as E
                    extraUpsert.id = entity.id
                    Object.assign(extraUpsert, entity)
                }

                relation.setEntityValue(entity, undefined)
            }
        }

        return extraUpsert
    }

    private commitOrderIndexes: Map<EntityMetadata, number> | undefined
    private getCommitOrderIndex(metadata: EntityMetadata) {
        if (this.commitOrderIndexes == null) {
            this.commitOrderIndexes = new Map(this.commitOrder.map((m, i) => [m, i]))
        }

        const index = this.commitOrderIndexes.get(metadata)
        assert(index != null)

        return index
    }

    private cloneEntity<E extends EntityType>(entity: E, mask?: FindOptionsRelations<any>): E | undefined {
        const metadata = this.getEntityMetadata(entity.constructor)

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
                    const cachedInverseEntity = this.getCached(
                      relation.inverseEntityMetadata,
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

    private traverseEntity(
      entity: ObjectLiteral | null | undefined,
      mask: FindOptionsRelations<any> | null,
      fn: (e: ObjectLiteral) => void
    ) {
        if (entity == null) return

        if (mask != null) {
            const metadata = this.getEntityMetadata(entity.constructor)
            for (const relation of metadata.relations) {
                const inverseMask = mask[relation.propertyName]
                if (!inverseMask) continue

                const inverseEntity = relation.getEntityValue(entity)
                if (relation.isOneToMany || relation.isManyToMany) {
                    if (!Array.isArray(inverseEntity)) continue
                    for (const entity of inverseEntity) {
                        this.traverseEntity(entity, inverseMask === true ? null : inverseMask, fn)
                    }
                } else {
                    this.traverseEntity(inverseEntity, inverseMask === true ? null : inverseMask, fn)
                }
            }
        }

        fn(entity)
    }

    private getEntityMetadata(entityClass: EntityTarget<any>) {
        const em = this.em()
        return em.connection.getMetadata(entityClass)
    }

    private getEntityPkHash(metadata: EntityMetadata, entity: ObjectLiteral) {
        const columns = metadata.primaryColumns

        if (columns.length === 1) {
            const pk = columns[0].getEntityValue(entity)
            assert(pk != null)
            return String(pk)
        } else {
            return columns
              .map((c) => {
                  const pk = c.getEntityValue(entity)
                  assert(pk != null)
                  return String(pk)
              })
              .join(':')
        }
    }

    // @ts-ignore
    private async saveMany(entityClass: EntityClass<any>, entities: any[]): Promise<void> {
        assert(entities.length > 0)
        let em = this.em()
        let metadata = em.connection.getMetadata(entityClass)
        let fk = metadata.columns.filter((c) => c.relationMetadata)
        if (fk.length == 0) {
            return this.upsertMany(em, entityClass, entities)
        }
        let signatures = entities
          .map((e) => ({entity: e, value: this.getFkSignature(fk, e)}))
          .sort((a, b) => (a.value > b.value ? -1 : b.value > a.value ? 1 : 0))
        let currentSignature = signatures[0].value
        let batch = []
        for (let s of signatures) {
            if (s.value === currentSignature) {
                batch.push(s.entity)
            } else {
                await this.upsertMany(em, entityClass, batch)
                currentSignature = s.value
                batch = [s.entity]
            }
        }
        if (batch.length) {
            await this.upsertMany(em, entityClass, batch)
        }
    }

    private getFkSignature(fk: ColumnMetadata[], entity: any): bigint {
        return super['getFkSignature'](fk, entity)
    }

    private async upsertMany(em: EntityManager, entityClass: EntityClass<any>, entities: any[]): Promise<void> {
        return super['upsertMany'](em, entityClass, entities)
    }
}

export class DeferredEntity<E extends EntityType> {
    constructor(
      private opts: {
          get: () => Promise<E | undefined>
          getOrFail: () => Promise<E>
          getOrInsert: (create: (id: string) => E | Promise<E>) => Promise<E>
      }
    ) {}

    async get(): Promise<E | undefined> {
        return this.opts.get()
    }

    async getOrFail(): Promise<E> {
        return this.opts.getOrFail()
    }

    async getOrInsert(create: (id: string) => E | Promise<E>): Promise<E> {
        return this.opts.getOrInsert(create)
    }

    /**
     * @deprecated use {@link getOrInsert} instead
     */
    async getOrCreate(create: (id: string) => E | Promise<E>): Promise<E> {
        return this.getOrInsert(create)
    }
}

function parseGetOptions<E>(idOrOptions: string | GetOptions<E>): GetOptions<E> {
    if (typeof idOrOptions === 'string') {
        return {id: idOrOptions}
    } else {
        return idOrOptions
    }
}
