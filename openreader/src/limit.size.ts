import {unexpectedCase} from '@subsquid/util-internal'
import {Where} from './ir/args'
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
                Math.min(req.args?.limit ?? Infinity, req.prop.cardinality ?? Infinity),
                req.args?.where
            ) + 1
        default:
            throw unexpectedCase()
    }
}


export function getEntityListSize(
    model: Model,
    entityName: string,
    fields: FieldRequest[],
    limit?: number,
    where?: Where
): number {
    let cardinality = Math.min(
        getEntityCardinality(model, entityName),
        limit ?? Infinity,
        getWhereCardinality(where)
    )
    if (Number.isFinite(cardinality)) {
        return cardinality * Math.max(getSize(model, fields), 1)
    } else {
        return Infinity
    }
}


function getWhereCardinality(where?: Where): number {
    if (where == null) return Infinity
    switch(where.op) {
        case 'AND': {
            let min = Infinity
            for (let co of where.args) {
                min = Math.min(min, getWhereCardinality(co))
            }
            return min
        }
        case 'OR': {
            if (where.args.length == 0) return Infinity
            let max = 0
            for (let co of where.args) {
                max = Math.max(max, getWhereCardinality(co))
            }
            return max
        }
        case 'eq':
            if (where.field == 'id') {
                return 1
            } else {
                return Infinity
            }
        case 'in':
            if (where.field == 'id') {
                return where.values.length
            } else {
                return Infinity
            }
        default:
            return Infinity
    }
}


export function getRelaySize(model: Model, entityName: string, req: RelayConnectionRequest): number {
    let total = 0
    let limit = Math.min(
        getEntityCardinality(model, entityName),
        req.first ?? 100,
        getWhereCardinality(req.where)
    )
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
