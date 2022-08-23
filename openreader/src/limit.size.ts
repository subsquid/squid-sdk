import {unexpectedCase} from '@subsquid/util-internal'
import {RelayConnectionRequest} from './ir/connection'
import {FieldRequest} from './ir/fields'
import {Model} from './model'
import {getEntity} from './model.tools'


export function getSize(model: Model, fields: FieldRequest[]): number {
    let total = 0
    for (let req of fields) {
        let size = getFieldSize(model, req)
        if (Number.isFinite(size)) {
            total += size * req.aliases.length
        } else {
            return Infinity
        }
    }
    return total
}


function getFieldSize(model: Model, req: FieldRequest): number {
    switch(req.kind) {
        case "scalar":
        case "list":
            return req.prop.byteWeight || 1
        case "enum":
            return 1
        case "object":
        case "fk":
        case "lookup":
        case "union":
            return getSize(model, req.children) + 1
        case "list-lookup":
            return getEntityListSize(
                model,
                req.type.entity,
                req.children,
                Math.min(req.args?.limit ?? Infinity, req.prop.cardinality ?? Infinity)
            ) + 1
        default:
            throw unexpectedCase()
    }
}


export function getEntityListSize(
    model: Model,
    entityName: string,
    fields: FieldRequest[],
    limit?: number
): number {
    let cardinality = Math.min(
        getEntityCardinality(model, entityName),
        limit ?? Infinity
    )
    if (Number.isFinite(cardinality)) {
        return cardinality * Math.max(getSize(model, fields), 1)
    } else {
        return Infinity
    }
}


export function getRelaySize(model: Model, entityName: string, req: RelayConnectionRequest): number {
    let total = 0
    let limit = Math.min(getEntityCardinality(model, entityName), req.first ?? 100)
    if (req.edgeNode) {
        total += limit * Math.max(getSize(model, req.edgeNode), 1)
    }
    if (req.edgeCursor) {
        total += limit
    }
    if (req.pageInfo) {
        total += 4
    }
    if (req.totalCount) {
        total += 1
    }
    return total
}


function getEntityCardinality(model: Model, entityName: string): number {
    return getEntity(model, entityName).cardinality ?? Infinity
}
