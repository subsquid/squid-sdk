import assert from "assert"
import type { Model } from "../../model"
import { getUniversalProperties } from '../../model.tools'
import { OrderBy } from "../../ir/args"
import {mergeOrderBy} from '../common'


/**
 * OpenCRUD orderBy enum value (e.g. foo_ASC)
 */
export type OpenCrudOrderByValue = string


/**
 * A mapping between OpenCRUD enum variants and OrderBy specs
 */
export type OpenCrud_OrderBy_Mapping = ReadonlyMap<OpenCrudOrderByValue, OrderBy>


const MAPPING_CACHE = new WeakMap<Model, Record<string, OpenCrud_OrderBy_Mapping>>()


export function getOrderByMapping(model: Model, typeName: string): OpenCrud_OrderBy_Mapping {
    let cache = MAPPING_CACHE.get(model)
    if (cache == null) {
        cache = {}
        MAPPING_CACHE.set(model, cache)
    }
    if (cache[typeName]) return cache[typeName]
    return cache[typeName] = buildOrderByMapping(model, typeName, 2)
}


function buildOrderByMapping(model: Model, typeName: string, depth: number): OpenCrud_OrderBy_Mapping {
    if (depth <= 0) return new Map()
    let properties = getUniversalProperties(model, typeName)
    let m = new Map<string, OrderBy>()
    for (let key in properties) {
        let propType = properties[key].type
        switch (propType.kind) {
            case 'scalar':
            case 'enum':
                if (propType.name != 'JSON') {
                    m.set(key + '_ASC', { [key]: 'ASC' })
                    m.set(key + '_DESC', { [key]: 'DESC' })
                    m.set(key + '_ASC_NULLS_FIRST', { [key]: 'ASC NULLS FIRST' });
                    m.set(key + '_ASC_NULLS_LAST', { [key]: 'ASC NULLS LAST' });
                    m.set(key + '_DESC_NULLS_FIRST', { [key]: 'DESC NULLS FIRST' });
                    m.set(key + '_DESC_NULLS_LAST', { [key]: 'DESC NULLS LAST' });
                }
                break
            case 'object':
            case 'union':
                for (let [name, spec] of buildOrderByMapping(model, propType.name, depth - 1)) {
                    m.set(key + '_' + name, { [key]: spec })
                }
                break
            case 'fk':
            case 'lookup':
                for (let [name, spec] of buildOrderByMapping(model, propType.entity, depth - 1)) {
                    m.set(key + '_' + name, { [key]: spec })
                }
                break
        }
    }
    if (model[typeName].kind == 'interface') {
        m.set('_type_ASC', { _type: 'ASC' })
        m.set('_type_DESC', { _type: 'DESC' })
    }
    return m
}


export function parseOrderBy(model: Model, typeName: string, input: OpenCrudOrderByValue[]): OrderBy {
    let mapping = getOrderByMapping(model, typeName)
    return mergeOrderBy(
        input.map(value => {
            let spec = mapping.get(value)
            assert(spec != null)
            return spec
        })
    )
}
