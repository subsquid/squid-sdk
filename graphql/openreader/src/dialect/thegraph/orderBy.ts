import assert from 'assert'
import type {Model} from '../../model'
import {getUniversalProperties} from '../../model.tools'
import {OrderBy, SortOrder} from '../../ir/args'
import {mergeOrderBy} from '../common'

export type TheGraphOrderByValue = string

export type TheGraph_OrderBy_List = ReadonlySet<TheGraphOrderByValue>

const MAPPING_CACHE = new WeakMap<Model, Record<string, TheGraph_OrderBy_List>>()

export function getOrderByList(model: Model, typeName: string): TheGraph_OrderBy_List {
    let cache = MAPPING_CACHE.get(model)
    if (cache == null) {
        cache = {}
        MAPPING_CACHE.set(model, cache)
    }
    if (cache[typeName]) return cache[typeName]
    return (cache[typeName] = buildOrderByList(model, typeName, 2))
}

function buildOrderByList(model: Model, typeName: string, depth: number): TheGraph_OrderBy_List {
    if (depth <= 0) return new Set()
    let properties = getUniversalProperties(model, typeName)
    let m = new Set<TheGraphOrderByValue>()
    for (let key in properties) {
        let propType = properties[key].type
        switch (propType.kind) {
            case 'scalar':
            case 'enum':
                if (propType.name != 'JSON') {
                    m.add(key)
                }
                break
            case 'object':
            case 'union':
                for (let name of buildOrderByList(model, propType.name, depth - 1)) {
                    m.add(key + '__' + name)
                }
                break
            case 'fk':
            case 'lookup':
                m.add(key)
                for (let name of buildOrderByList(model, propType.entity, depth - 1)) {
                    m.add(key + '__' + name)
                }
                break
        }
    }
    return m
}

export const ORDER_DIRECTIONS: Record<string, SortOrder> = {
    asc: 'ASC',
    asc_nulls_first: 'ASC NULLS FIRST',
    asc_nulls_last: 'ASC NULLS LAST',
    desc: 'DESC',
    desc_nulls_first: 'DESC NULLS FIRST',
    desc_nulls_last: 'DESC NULLS LAST',
}

export function parseOrderBy(model: Model, typeName: string, input: {orderBy: string; direction?: string}): OrderBy {
    let list = getOrderByList(model, typeName)
    assert(list.has(input.orderBy))

    const sortOrder = input.direction ? ORDER_DIRECTIONS[input.direction] : ORDER_DIRECTIONS['asc']
    assert(sortOrder)

    const keys = input.orderBy.split('__').reverse()
    const res = keys.reduce((res: OrderBy | null, key) => ({[key]: res ?? sortOrder}), null)
    assert(res)

    return res
}
