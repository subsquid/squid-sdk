import {EntityMetadata, FindOptionsRelations, ObjectLiteral} from 'typeorm'
import {mergeRelataions} from './misc'
import {Logger} from '@subsquid/logger'

export type DeferData = {
    ids: Set<string>
    relations: FindOptionsRelations<any>
}

export class DeferList {
    private map: Map<EntityMetadata, DeferData> = new Map()
    private logger: Logger

    constructor(private opts: {logger: Logger}) {
        this.logger = this.opts.logger.child('defer')
    }

    add<E extends ObjectLiteral>(metadata: EntityMetadata, id: string, relations?: FindOptionsRelations<E>) {
        const data = this.getData(metadata)
        data.ids.add(id)

        this.logger.debug(`entity ${metadata.name} ${id} deferred`)

        if (relations != null) {
            data.relations = mergeRelataions(data.relations, relations)
        }
    }

    values(): Map<EntityMetadata, DeferData> {
        return new Map(this.map)
    }

    clear(): void {
        this.logger.debug(`cleared`)
        this.map.clear()
    }

    private getData(metadata: EntityMetadata) {
        let list = this.map.get(metadata)
        if (list == null) {
            list = {ids: new Set(), relations: {}}
            this.map.set(metadata, list)
        }

        return list
    }
}
