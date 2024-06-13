import {Logger} from '@subsquid/logger'
import {EntityManager, EntityMetadata, FindOptionsRelations} from 'typeorm'
import {CacheMap} from './cacheMap'
import assert from 'assert'
import {copy, EntityLiteral} from './misc'
import {sortMetadatasInCommitOrder} from './commitOrder'
import {unexpectedCase} from '@subsquid/util-internal'

export enum ChangeType {
    Insert = 'insert',
    Upsert = 'upsert',
    Delete = 'delete',
}

export type ChangeSets = {
    upserts: {metadata: EntityMetadata; entities: EntityLiteral[]}[]
    inserts: {metadata: EntityMetadata; entities: EntityLiteral[]}[]
    deletes: {metadata: EntityMetadata; ids: string[]}[]
    extraUpserts: {metadata: EntityMetadata; entities: EntityLiteral[]}[]
}

export class StateManager {
    protected cacheMap: CacheMap
    protected stateMap: Map<EntityMetadata, Map<string, ChangeType>>
    protected commitOrder: EntityMetadata[]
    protected logger?: Logger

    constructor({commitOrder, logger}: {commitOrder: EntityMetadata[]; logger?: Logger}) {
        this.cacheMap = new CacheMap(this.logger)
        this.stateMap = new Map()
        this.commitOrder = commitOrder
        this.logger = logger?.child('state')
    }

    get<E extends EntityLiteral>(
        metadata: EntityMetadata,
        id: string,
        relationMask?: FindOptionsRelations<any>
    ): E | null | undefined {
        const cached = this.cacheMap.get(metadata, id)

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

            if (relationMask != null) {
                for (const relation of metadata.relations) {
                    const inverseMask = relationMask[relation.propertyName]
                    if (!inverseMask) continue

                    const inverseEntityMock = relation.getEntityValue(entity) as EntityLiteral

                    if (inverseEntityMock === null) {
                        relation.setEntityValue(clonedEntity, null)
                    } else {
                        const cachedInverseEntity =
                            inverseEntityMock != null
                                ? this.get(
                                      relation.inverseEntityMetadata,
                                      inverseEntityMock.id,
                                      typeof inverseMask === 'boolean' ? undefined : inverseMask
                                  )
                                : undefined

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

    insert(metadata: EntityMetadata, entity: EntityLiteral): void {
        const prevType = this.getState(metadata, entity.id)
        switch (prevType) {
            case undefined:
                this.setState(metadata, entity.id, ChangeType.Insert)
                this.cacheMap.add(metadata, entity, true)
                break
            case ChangeType.Insert:
            case ChangeType.Upsert:
                throw new Error(`Entity ${metadata.name} ${entity.id} is already marked as ${prevType}`)
            case ChangeType.Delete:
                this.setState(metadata, entity.id, ChangeType.Upsert)
                this.cacheMap.add(metadata, entity, true)
                break
            default:
                throw unexpectedCase(prevType)
        }
    }

    upsert(metadata: EntityMetadata, entity: EntityLiteral): void {
        const prevType = this.getState(metadata, entity.id)
        switch (prevType) {
            case undefined:
            case ChangeType.Insert:
            case ChangeType.Upsert:
                this.setState(metadata, entity.id, ChangeType.Upsert)
                this.cacheMap.add(metadata, entity)
                break
            case ChangeType.Delete:
                this.setState(metadata, entity.id, ChangeType.Upsert)
                this.cacheMap.add(metadata, entity, true)
                break
            default:
                throw unexpectedCase(prevType)
        }
    }

    delete(metadata: EntityMetadata, id: string): void {
        const prevType = this.getState(metadata, id)
        switch (prevType) {
            case undefined:
            case ChangeType.Upsert:
                this.setState(metadata, id, ChangeType.Delete)
                this.cacheMap.delete(metadata, id)
                break
            case ChangeType.Insert:
                this.getChanges(metadata).delete(id)
                this.cacheMap.delete(metadata, id)
                break
            case ChangeType.Delete:
                this.logger?.debug(`entity ${metadata.name} ${id} is already marked as ${ChangeType.Delete}`)
                break
            default:
                throw unexpectedCase(prevType)
        }
    }

    persist(metadata: EntityMetadata, entity: EntityLiteral) {
        this.getChanges(metadata).delete(entity.id) // reset state
        this.cacheMap.add(metadata, entity)
    }

    settle(metadata: EntityMetadata, id: string) {
        this.cacheMap.settle(metadata, id)
    }

    isInserted(metadata: EntityMetadata, id: string) {
        return this.getState(metadata, id) === ChangeType.Insert
    }

    isUpserted(metadata: EntityMetadata, id: string) {
        return this.getState(metadata, id) === ChangeType.Upsert
    }

    isDeleted(metadata: EntityMetadata, id: string) {
        return this.getState(metadata, id) === ChangeType.Delete
    }

    isExists(metadata: EntityMetadata, id: string) {
        return this.cacheMap.has(metadata, id)
    }

    reset(): void {
        this.logger?.debug(`reset`)
        this.stateMap.clear()
        this.cacheMap.clear()
    }

    async performUpdate(cb: (cs: ChangeSets) => Promise<void>) {
        const changeSets: ChangeSets = {
            inserts: [],
            upserts: [],
            deletes: [],
            extraUpserts: [],
        }

        for (const metadata of this.commitOrder) {
            const entityChanges = this.stateMap.get(metadata)
            if (entityChanges == null || entityChanges.size == 0) continue

            const inserts: EntityLiteral[] = []
            const upserts: EntityLiteral[] = []
            const deletes: string[] = []
            const extraUpserts: EntityLiteral[] = []

            for (const [id, type] of entityChanges) {
                const cached = this.cacheMap.get(metadata, id)

                switch (type) {
                    case ChangeType.Insert: {
                        assert(cached?.value != null, `unable to insert entity ${metadata.name} ${id}`)

                        const {entity, extraUpsert} = this.extractExtraUpsert(metadata, cached.value)
                        inserts.push(entity)
                        if (extraUpsert != null) {
                            extraUpserts.push(extraUpsert)
                        }

                        break
                    }
                    case ChangeType.Upsert: {
                        assert(cached?.value != null, `unable to upsert entity ${metadata.name} ${id}`)

                        
                        const {entity, extraUpsert} = this.extractExtraUpsert(metadata, cached.value)
                        upserts.push(entity)
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

            if (upserts.length) {
                changeSets.upserts.push({metadata, entities: upserts})
            }

            if (inserts.length) {
                changeSets.inserts.push({metadata, entities: inserts})
            }

            if (deletes.length) {
                changeSets.deletes.push({metadata, ids: deletes})
            }

            if (extraUpserts.length) {
                changeSets.extraUpserts.push({metadata, entities: extraUpserts})
            }
        }

        await cb(changeSets)

        this.stateMap.clear()
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

            const isInverseInserted = this.isInserted(inverseMetadata, inverseEntity.id)
            if (!isInverseInserted) continue

            if (extraUpsert == null) {
                extraUpsert = entity
                entity = metadata.create() as E
                Object.assign(entity, extraUpsert)
            }

            relation.setEntityValue(entity, undefined)
        }

        return {
            entity,
            extraUpsert
        }
    }

    private setState(metadata: EntityMetadata, id: string, type: ChangeType): this {
        this.getChanges(metadata).set(id, type)
        this.logger?.debug(`entity ${metadata.name} ${id} marked as ${type}`)
        return this
    }

    private getState(metadata: EntityMetadata, id: string): ChangeType | undefined {
        return this.getChanges(metadata).get(id)
    }

    private getChanges(metadata: EntityMetadata): Map<string, ChangeType> {
        let map = this.stateMap.get(metadata)
        if (map == null) {
            map = new Map()
            this.stateMap.set(metadata, map)
        }

        return map
    }
}
