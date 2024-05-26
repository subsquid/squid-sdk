import {EntityMetadata, ObjectLiteral} from 'typeorm'
import {copy} from './misc'
import {Logger} from '@subsquid/logger'

export class CachedEntity<E extends ObjectLiteral = ObjectLiteral> {
    constructor(public value: E | null = null) {}
}

export class CacheMap {
    private map: Map<EntityMetadata, Map<string, CachedEntity>> = new Map()
    private logger: Logger

    constructor(private opts: {logger: Logger}) {
        this.logger = this.opts.logger.child('cache')
    }

    exist(metadata: EntityMetadata, id: string): boolean {
        const cacheMap = this.getEntityCache(metadata)
        const cachedEntity = cacheMap.get(id)
        return !!cachedEntity?.value
    }

    get<E extends ObjectLiteral>(metadata: EntityMetadata, id: string): CachedEntity<E> | undefined {
        const cacheMap = this.getEntityCache<E>(metadata)
        return cacheMap.get(id)
    }

    ensure(metadata: EntityMetadata, id: string): void {
        const cacheMap = this.getEntityCache(metadata)

        if (cacheMap.has(id)) return

        cacheMap.set(id, new CachedEntity())
        this.logger.debug(`added empty entity ${metadata.name} ${id}`)
    }

    delete(metadata: EntityMetadata, id: string): void {
        const cacheMap = this.getEntityCache(metadata)
        cacheMap.set(id, new CachedEntity())
        this.logger.debug(`deleted entity ${metadata.name} ${id}`)
    }

    clear(): void {
        this.logger.debug(`cleared`)
        this.map.clear()
    }

    add<E extends ObjectLiteral>(metadata: EntityMetadata, entity: E, isNew = false): void {
        const cacheMap = this.getEntityCache(metadata)

        let cached = cacheMap.get(entity.id)
        if (cached == null) {
            cached = new CachedEntity()
            cacheMap.set(entity.id, cached)
        }

        let cachedEntity = cached.value
        if (cachedEntity == null) {
            cachedEntity = cached.value = metadata.create() as E
            cachedEntity.id = entity.id
            this.logger.debug(`added entity ${metadata.name} ${entity.id}`)
        }

        for (const column of metadata.nonVirtualColumns) {
            const objectColumnValue = column.getEntityValue(entity)
            if (isNew || objectColumnValue !== undefined) {
                column.setEntityValue(cachedEntity, copy(objectColumnValue ?? null))
            }
        }

        for (const relation of metadata.relations) {
            if (!relation.isOwning) continue

            const inverseEntity = relation.getEntityValue(entity) as ObjectLiteral | null | undefined
            const inverseMetadata = relation.inverseEntityMetadata

            if (inverseEntity != null) {
                const mockEntity = inverseMetadata.create()
                Object.assign(mockEntity, {id: inverseEntity.id})

                relation.setEntityValue(cachedEntity, mockEntity)
            } else if (isNew || inverseEntity === null) {
                relation.setEntityValue(cachedEntity, null)
            }
        }
    }

    values(): Map<EntityMetadata, Map<string, CachedEntity<ObjectLiteral>>> {
        return new Map(this.map)
    }

    private getEntityCache<E extends ObjectLiteral>(metadata: EntityMetadata): Map<string, CachedEntity<E>> {
        let map = this.map.get(metadata)
        if (map == null) {
            map = new Map()
            this.map.set(metadata, map)
        }

        return map as Map<string, CachedEntity<E>>
    }
}
