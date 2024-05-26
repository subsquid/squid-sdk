import {Logger} from '@subsquid/logger'
import {EntityMetadata} from 'typeorm'

export enum ChangeType {
    Insert = 'insert',
    Upsert = 'upsert',
    Delete = 'delete',
}

export class ChangeTracker {
    private map: Map<EntityMetadata, Map<string, ChangeType>> = new Map()
    private logger: Logger

    constructor(private opts: {logger: Logger}) {
        this.logger = this.opts.logger.child('changes')
    }

    trackInsert(metadata: EntityMetadata, id: string): void {
        const prevType = this.get(metadata, id)
        switch (prevType) {
            case undefined:
                this.set(metadata, id, ChangeType.Insert)
                this.logger.debug(`entity ${metadata.name} ${id} already marked as ${ChangeType.Insert}`)
                break
            case ChangeType.Delete:
                this.set(metadata, id, ChangeType.Upsert)
                break
            case ChangeType.Insert:
            case ChangeType.Upsert:
                throw new Error(
                    `${metadata.name} ${id} is already marked as ${ChangeType.Insert} or ${ChangeType.Upsert}`
                )
        }
    }

    trackUpsert(metadata: EntityMetadata, id: string): void {
        const prevType = this.get(metadata, id)
        switch (prevType) {
            case ChangeType.Insert:
                this.logger.debug(`entity ${metadata.name} ${id} already marked as ${ChangeType.Insert}`)
                break
            case ChangeType.Upsert:
                this.logger.debug(`entity ${metadata.name} ${id} already marked as ${ChangeType.Upsert}`)
                break
            default:
                this.set(metadata, id, ChangeType.Upsert)
                break
        }
    }

    trackDelete(metadata: EntityMetadata, id: string): void {
        const prevType = this.get(metadata, id)
        switch (prevType) {
            case ChangeType.Insert:
                this.getChanges(metadata).delete(id)
                break
            case ChangeType.Delete:
                this.logger.debug(`entity ${metadata.name} ${id} already marked as ${ChangeType.Delete}`)
                break
            default:
                this.set(metadata, id, ChangeType.Delete)
        }
    }

    isInserted(metadata: EntityMetadata, id: string) {
        return this.get(metadata, id) === ChangeType.Insert
    }

    isUpserted(metadata: EntityMetadata, id: string) {
        return this.get(metadata, id) === ChangeType.Upsert
    }

    isDeleted(metadata: EntityMetadata, id: string) {
        return this.get(metadata, id) === ChangeType.Delete
    }

    clear(): void {
        this.logger.debug(`cleared`)
        this.map.clear()
    }

    values(): Map<EntityMetadata, Map<string, ChangeType>> {
        return new Map(this.map)
    }

    private set(metadata: EntityMetadata, id: string, type: ChangeType): this {
        this.getChanges(metadata).set(id, type)
        this.logger.debug(`entity ${metadata.name} ${id} marked as ${type}`)
        return this
    }

    private get(metadata: EntityMetadata, id: string): ChangeType | undefined {
        return this.getChanges(metadata).get(id)
    }

    private getChanges(metadata: EntityMetadata): Map<string, ChangeType> {
        let map = this.map.get(metadata)
        if (map == null) {
            map = new Map()
            this.map.set(metadata, map)
        }

        return map
    }
}
