import {GraphQLFieldConfigMap, GraphQLSchema} from 'graphql'
import {Model} from '../model'
import {Context} from '../context'
import {OrderBy, Where} from '../ir/args'
import assert from 'assert'

export enum Dialect {
    OpenCrud = 'opencrud',
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
