import {EntityMetadata, FindOptionsRelations, ObjectLiteral} from 'typeorm'

export interface EntityLiteral extends ObjectLiteral {
    id: string
}

export function* splitIntoBatches<T>(list: T[], maxBatchSize: number): Generator<T[]> {
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

export function mergeRelations<E extends ObjectLiteral>(
    a: FindOptionsRelations<E>,
    b: FindOptionsRelations<E>
): FindOptionsRelations<E> {
    const mergedObject: FindOptionsRelations<E> = {}

    for (const key in a) {
        mergedObject[key] = a[key]
    }

    for (const key in b) {
        const bValue = b[key]
        const value = mergedObject[key]
        if (typeof bValue === 'object') {
            mergedObject[key] = (
                typeof value === 'object' ? mergeRelations(value as any, bValue as any) : bValue
            ) as any
        } else {
            mergedObject[key] = value || bValue
        }
    }

    return mergedObject
}

export function traverseEntity(
    metadata: EntityMetadata,
    entity: EntityLiteral,
    cb: (e: EntityLiteral, metadata: EntityMetadata) => void
) {
    for (const relation of metadata.relations) {
        const inverseEntity = relation.getEntityValue(entity)
        if (inverseEntity == null) continue

        if (relation.isOneToMany || relation.isManyToMany) {
            for (const ie of inverseEntity) {
                traverseEntity(relation.inverseEntityMetadata, ie, cb)
            }
        } else {
            traverseEntity(relation.inverseEntityMetadata, inverseEntity, cb)
        }
    }

    cb(entity, metadata)
}

export function noNull<T>(val: null | undefined | T): T | undefined {
    return val == null ? undefined : val
}
