import {GraphQLFieldConfigMap, GraphQLSchema} from 'graphql'
import {Model} from '../model'
import {Context} from '../context'
import {OrderBy, Where} from '../ir/args'
import assert from 'assert'

export enum Dialect {
    OpenCRUD = 'opencrud',
    TheGraph = 'thegraph',
}

export interface SchemaBuilder {
    build(): GraphQLSchema
}

export interface SchemaOptions {
    model: Model
    subscriptions?: boolean
}

export type GqlFieldMap = GraphQLFieldConfigMap<unknown, Context>

export function mergeOrderBy(list: OrderBy[]): OrderBy {
    let result: OrderBy = {}
    list.forEach((item) => {
        for (let key in item) {
            let current = result[key]
            if (current == null) {
                result[key] = item[key]
            } else if (typeof current != 'string') {
                let it = item[key]
                assert(typeof it == 'object')
                result[key] = mergeOrderBy([current, it])
            }
        }
    })
    return result
}

export function toCondition(op: 'AND' | 'OR', operands: Where[]): Where | undefined {
    switch(operands.length) {
        case 0:
            return undefined
        case 1:
            return operands[0]
        default:
            return {op, args: operands}
    }
}


export function parseWhereKey(key: string): {op: Where['op'], field: string} {
    let m = WHERE_KEY_REGEX.exec(key)
    if (m) {
        return {op: m[2] as Where['op'], field: m[1]}
    } else {
        return {op: 'REF', field: key}
    }
}


const WHERE_KEY_REGEX = (() => {
    let ops: Where['op'][] = [
        "eq",
        "not_eq",
        "gt",
        "gte",
        "lt",
        "lte",
        "contains",
        "not_contains",
        "containsInsensitive",
        "not_containsInsensitive",
        "startsWith",
        "not_startsWith",
        "endsWith",
        "not_endsWith",
        "containsAll",
        "containsAny",
        "containsNone",
        "jsonContains",
        "jsonHasKey",
        "isNull",
        "some",
        "every",
        "none",
        "in",
        "not_in",
    ]
    return new RegExp(`^([^_]*)_(${ops.join('|')})$`)
})()