import assert from "assert"
import type {Model} from "../model"
import {getUnionProps} from "../model.tools"
import {OrderBy} from "../ir/args"


/**
 * OpenCRUD orderBy enum value (e.g. foo_ASC)
 */
export type OpenCrudOrderByValue = string


/**
 * A mapping between OpenCRUD enum variants and OrderBy specs
 */
export type OpenCrud_OrderBy_Mapping = ReadonlyMap<OpenCrudOrderByValue, OrderBy>


const MAPPING_CACHE = new WeakMap<Model, Record<string, OpenCrud_OrderBy_Mapping>>()


export function getOrderByMapping(model: Model, entityName: string): OpenCrud_OrderBy_Mapping {
    let cache = MAPPING_CACHE.get(model)
    if (cache == null) {
        cache = {}
        MAPPING_CACHE.set(model, cache)
    }
    if (cache[entityName]) return cache[entityName]
    return cache[entityName] = buildOrderByMapping(model, entityName, 2)
}


function buildOrderByMapping(model: Model, typeName: string, depth: number): OpenCrud_OrderBy_Mapping {
    if (depth <= 0) return new Map()
    let object = model[typeName]
    if (object.kind == 'union') {
        object = getUnionProps(model, typeName)
    }
    assert(object.kind == 'entity' || object.kind == 'object')
    let m = new Map<string, OrderBy>()
    for (let key in object.properties) {
        let propType = object.properties[key].type
        switch(propType.kind) {
            case 'scalar':
            case 'enum':
                if (propType.name != 'JSON') {
                    m.set(key + '_ASC', {[key]: 'ASC'})
                    m.set(key + '_DESC', {[key]: 'DESC'})
                }
                break
            case 'object':
            case 'union':
                for (let [name, spec] of buildOrderByMapping(model, propType.name, depth - 1)) {
                    m.set(key + '_' + name, {[key]: spec})
                }
                break
            case 'fk':
                for (let [name, spec] of buildOrderByMapping(model, propType.foreignEntity, depth - 1)) {
                    m.set(key + '_' + name, {[key]: spec})
                }
                break
            case 'lookup':
                for (let [name, spec] of buildOrderByMapping(model, propType.entity, depth - 1)) {
                    m.set(key + '_' + name, {[key]: spec})
                }
                break
        }
    }
    return m
}


export function parseOrderBy(model: Model, entityName: string, input: OpenCrudOrderByValue[]): OrderBy {
    let mapping = getOrderByMapping(model, entityName)
    return mergeOrderBy(
        input.map(value => {
            let spec = mapping.get(value)
            assert(spec != null)
            return spec
        })
    )
}


export function mergeOrderBy(list: OrderBy[]): OrderBy {
    let result: OrderBy = {}
    list.forEach(item => {
        for (let key in item) {
            let current = result[key]
            if (current == null ) {
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
