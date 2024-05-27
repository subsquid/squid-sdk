import {EntityMetadata} from 'typeorm'
import {copy, EntityLiteral} from './misc'
import {Logger} from '@subsquid/logger'

export class CachedEntity<E extends EntityLiteral = EntityLiteral> {
    constructor(public value: E | null = null) {}
}

export class CacheMap {
    private map: Map<EntityMetadata, Map<string, CachedEntity>> = new Map()
    private logger?: Logger

    constructor(logger?: Logger) {
        this.logger = logger?.child('cache')
    }

    get(metadata: EntityMetadata, id: string) {
        return this.getEntityCache(metadata)?.get(id)
    }

    has(metadata: EntityMetadata, id: string): boolean {
        const cacheMap = this.getEntityCache(metadata)
        const cachedEntity = cacheMap.get(id)
        return !!cachedEntity?.value
    }

    settle(metadata: EntityMetadata, id: string): void {
        const cacheMap = this.getEntityCache(metadata)

        if (cacheMap.has(id)) return

        cacheMap.set(id, new CachedEntity())
        this.logger?.debug(`added empty entity ${metadata.name} ${id}`)
    }

    delete(metadata: EntityMetadata, id: string): void {
        const cacheMap = this.getEntityCache(metadata)
        cacheMap.set(id, new CachedEntity())
        this.logger?.debug(`deleted entity ${metadata.name} ${id}`)
    }

    clear(): void {
        this.logger?.debug(`cleared`)
        this.map.clear()
    }

    add<E extends EntityLiteral>(metadata: EntityMetadata, entity: E, isNew = false): void {
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
            this.logger?.debug(`added entity ${metadata.name} ${entity.id}`)
        }

        for (const column of metadata.nonVirtualColumns) {
            const objectColumnValue = column.getEntityValue(entity)
            if (isNew || objectColumnValue !== undefined) {
                column.setEntityValue(cachedEntity, copy(objectColumnValue ?? null))
            }
        }

        for (const relation of metadata.relations) {
            if (!relation.isOwning) continue

            const inverseEntity = relation.getEntityValue(entity) as EntityLiteral | null | undefined
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

    private getEntityCache<E extends EntityLiteral>(metadata: EntityMetadata): Map<string, CachedEntity<E>> {
        let map = this.map.get(metadata)
        if (map == null) {
            map = new Map()
            this.map.set(metadata, map)
        }

        return map as Map<string, CachedEntity<E>>
    }
}
