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

const copiedObjects = new WeakMap()

export function copy<T>(obj: T): T {
    if (typeof obj !== 'object' || obj == null) {
        return obj
    }

    if (copiedObjects.has(obj)) {
        return copiedObjects.get(obj)
    } else if (obj instanceof Date) {
        return new Date(obj) as any
    } else if (Array.isArray(obj)) {
        const clone = obj.map((i) => copy(i))
        copiedObjects.set(obj, clone)
        return clone as any
    } else if (obj instanceof Map) {
        const clone = new Map(Array.from(obj).map((i) => copy(i)))
        copiedObjects.set(obj, clone)
        return clone as any
    } else if (obj instanceof Set) {
        const clone = new Set(Array.from(obj).map((i) => copy(i)))
        copiedObjects.set(obj, clone)
        return clone as any
    } else if (ArrayBuffer.isView(obj)) {
        return copyBuffer(obj)
    } else {
        const clone = Object.create(Object.getPrototypeOf(obj))
        copiedObjects.set(obj, clone)

        for (const k in obj) {
            if (obj.hasOwnProperty(k)) {
                clone[k] = copy(obj[k])
            }
        }

        return clone
    }
}

function copyBuffer(buf: any) {
    if (buf instanceof Buffer) {
        return Buffer.from(buf)
    } else {
        return new buf.constructor(buf.buffer.slice(), buf.byteOffset, buf.length)
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

export function traverseEntity({
    metadata,
    entity,
    relationMask,
    cb,
}: {
    metadata: EntityMetadata
    entity: EntityLiteral
    relationMask: FindOptionsRelations<any> | null
    cb: (e: EntityLiteral, metadata: EntityMetadata) => void
}) {
    if (relationMask != null) {
        for (const relation of metadata.relations) {
            const inverseRelationMask = relationMask[relation.propertyName]
            if (!inverseRelationMask) continue

            const inverseEntity = relation.getEntityValue(entity)
            if (inverseEntity == null) continue

            if (relation.isOneToMany || relation.isManyToMany) {
                if (!Array.isArray(inverseEntity)) continue
                for (const ie of inverseEntity) {
                    traverseEntity({
                        metadata: relation.inverseEntityMetadata,
                        entity: ie,
                        relationMask: inverseRelationMask === true ? null : inverseRelationMask,
                        cb,
                    })
                }
            } else {
                traverseEntity({
                    metadata: relation.inverseEntityMetadata,
                    entity: inverseEntity,
                    relationMask: inverseRelationMask === true ? null : inverseRelationMask,
                    cb,
                })
            }
        }
    }

    cb(entity, metadata)
}

export function noNull<T>(val: null | undefined | T): T | undefined {
    return val == null ? undefined : val
}
