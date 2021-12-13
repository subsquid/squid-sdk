import assert from "assert"
import {Entity, FTS_Query, JsonObject, Model, Prop, PropType} from "./model"


const UNION_MAPS = new WeakMap<Model, Record<string, JsonObject>>()


export function getUnionProps(model: Model, unionName: string): JsonObject {
    let map = UNION_MAPS.get(model)
    if (map == null) {
        map = {}
        UNION_MAPS.set(model, map)
    }
    if (map[unionName]) return map[unionName]
    return map[unionName] = buildUnionProps(model, unionName)
}


export function buildUnionProps(model: Model, unionName: string): JsonObject {
    let union = model[unionName]
    assert(union.kind == 'union')
    let properties: Record<string, Prop> = {}
    for (let i = 0; i < union.variants.length; i++) {
        let objectName = union.variants[i]
        let object = model[objectName]
        assert(object.kind == 'object')
        Object.assign(properties, object.properties)
    }
    properties.isTypeOf = {
        type: {kind: 'scalar', name: 'String'},
        nullable: false
    }
    return {kind: 'object', properties}
}


export function validateModel(model: Model) {
    // TODO: check all invariants we assume
    validateNames(model)
    validateUnionTypes(model)
    validateLookups(model)
}


const TYPE_NAME_REGEX = /^[A-Z][a-zA-Z0-9]*$/
const PROP_NAME_REGEX = /^[a-z][a-zA-Z0-9]*$/


export function validateNames(model: Model) {
    for (let name in model) {
        let item = model[name]
        if (item.kind == 'fts') {
            if (!PROP_NAME_REGEX.test(name)) {
                throw new Error(`Invalid fulltext search name: ${name}. It must match ${PROP_NAME_REGEX}.`)
            }
        } else {
            if (!TYPE_NAME_REGEX.test(name)) {
                throw new Error(`Invalid ${item.kind} name: ${name}. It must match ${TYPE_NAME_REGEX}`)
            }
        }
        switch(item.kind) {
            case 'entity':
            case 'object':
            case 'interface':
                for (let prop in item.properties) {
                    if (!PROP_NAME_REGEX.test(prop)) {
                        throw new Error(`Type ${name} has a property with invalid name: ${prop}. It must match ${PROP_NAME_REGEX}.`)
                    }
                }
                break
        }
    }
}


export function validateUnionTypes(model: Model): void {
    for (let key in model) {
        let item = model[key]
        if (item.kind != 'union') continue
        let properties: Record<string, { objectName: string, type: PropType }> = {}
        item.variants.forEach(objectName => {
            let object = model[objectName]
            assert(object.kind == 'object')
            for (let propName in object.properties) {
                let rec = properties[propName]
                if (rec && !propTypeEquals(rec.type, object.properties[propName].type)) {
                    throw new Error(
                        `${rec.objectName} and ${objectName} variants of union ${key} both have property '${propName}', but types of ${rec.objectName}.${propName} and ${objectName}.${propName} are different.`
                    )
                } else {
                    properties[propName] = {objectName, type: object.properties[propName].type}
                }
            }
        })
    }
}


export function validateLookups(model: Model): void {
    for (let name in model) {
        let item = model[name]
        switch(item.kind) {
            case 'object':
            case 'interface':
                for (let key in item.properties) {
                    let prop = item.properties[key]
                    if (prop.type.kind == 'lookup' || prop.type.kind == 'list-lookup') {
                        throw invalidProperty(name, key, `lookups are only supported on entity types`)
                    }
                }
                break
            case 'entity':
                for (let key in item.properties) {
                    let prop = item.properties[key]
                    if (prop.type.kind == 'lookup' && !prop.nullable) {
                        throw invalidProperty(name, key, 'one-to-one lookups must be nullable')
                    }
                    if (prop.type.kind == 'lookup' || prop.type.kind == 'list-lookup') {
                        let lookupEntity = getEntity(model, prop.type.entity)
                        let lookupProperty = lookupEntity.properties[prop.type.field]
                        if (lookupProperty?.type.kind != 'fk' || lookupProperty.type.foreignEntity != name) {
                            throw invalidProperty(name, key, `${prop.type.entity}.${prop.type.field} is not a foreign key pointing to ${name}`)
                        }
                        if (prop.type.kind == 'lookup' && !lookupProperty.unique) {
                            throw invalidProperty(name, key, `${prop.type.entity}.${prop.type.field} is not @unique`)
                        }
                    }
                }
                break
        }
    }
}


function invalidProperty(item: string, key: string, msg: string): Error {
    return new Error(`Invalid property ${item}.${key}: ${msg}`)
}


export function propTypeEquals(a: PropType, b: PropType): boolean {
    if (a.kind != b.kind) return false
    if (a.kind == 'list') return propTypeEquals(a.item.type, (b as typeof a).item.type)
    switch(a.kind) {
        case 'fk':
            return a.foreignEntity == (b as typeof a).foreignEntity
        case 'lookup':
        case 'list-lookup':
            return a.entity == (b as typeof a).entity && a.field == (b as typeof a).field
        default:
            return a.name == (b as typeof a).name
    }
}


export function getEntity(model: Model, name: string): Entity {
    let entity = model[name]
    assert(entity.kind == 'entity', `${name} expected to be an entity`)
    return entity
}


export function getObject(model: Model, name: string): JsonObject {
    let object = model[name]
    assert(object.kind == 'object', `${name} expected to be an object`)
    return object
}


export function getFtsQuery(model: Model, name: string): FTS_Query {
    let query = model[name]
    assert(query.kind == 'fts', `${name} expected to be FTS query`)
    return query
}
