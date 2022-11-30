import {unexpectedCase} from '@subsquid/util-internal'
import assert from 'assert'
import {GraphQLSchema} from 'graphql'
import {ResolveTree} from 'graphql-parse-resolve-info'
import {SqlArguments} from '../ir/args'
import {AnyFields, FieldRequest, FieldsByEntity, OpaqueRequest} from '../ir/fields'
import {Model} from '../model'
import {getQueryableEntities} from '../model.tools'
import {simplifyResolveTree} from '../util/resolve-tree'
import {ensureArray} from '../util/util'
import {parseOrderBy} from './orderBy'
import {parseWhere} from './where'


export function parseObjectTree(
    model: Model,
    typeName: string,
    schema: GraphQLSchema,
    tree: ResolveTree
): FieldRequest[] {

    let requests: FieldRequest[] = []
    let requestedScalars: Record<string, true> = {}
    let object = model[typeName]
    assert(object.kind == "entity" || object.kind == "object")

    let fields = simplifyResolveTree(schema, tree, typeName).fields
    for (let alias in fields) {
        let f = fields[alias]
        let prop = object.properties[f.name]
        switch(prop.type.kind) {
            case "scalar":
            case "enum":
            case "list":
                if (requestedScalars[f.name] == null) {
                    requestedScalars[f.name] = true
                    requests.push({
                        field: f.name,
                        aliases: [f.name],
                        kind: prop.type.kind,
                        type: prop.type,
                        prop,
                        index: 0
                    } as OpaqueRequest)
                }
                break
            case "object":
                requests.push({
                    field: f.name,
                    aliases: [f.alias],
                    kind: prop.type.kind,
                    type: prop.type,
                    prop,
                    index: 0,
                    children: parseObjectTree(model, prop.type.name, schema, f)
                })
                break
            case "union": {
                let union = model[prop.type.name]
                assert(union.kind == "union")
                let children: FieldRequest[] = []
                for (let variant of union.variants) {
                    for (let req of parseObjectTree(model, variant, schema, f)) {
                        req.ifType = variant
                        children.push(req)
                    }
                }
                requests.push({
                    field: f.name,
                    aliases: [f.alias],
                    kind: prop.type.kind,
                    type: prop.type,
                    prop,
                    index: 0,
                    children
                })
                break
            }
            case "fk":
                requests.push({
                    field: f.name,
                    aliases: [f.alias],
                    kind: prop.type.kind,
                    type: prop.type,
                    prop,
                    index: 0,
                    children: parseObjectTree(model, prop.type.entity, schema, f)
                })
                break
            case "lookup":
                requests.push({
                    field: f.name,
                    aliases: [f.alias],
                    kind: prop.type.kind,
                    type: prop.type,
                    prop,
                    index: 0,
                    children: parseObjectTree(model, prop.type.entity, schema, f)
                })
                break
            case "list-lookup":
                requests.push({
                    field: f.name,
                    aliases: [f.alias],
                    kind: prop.type.kind,
                    type: prop.type,
                    prop,
                    index: 0,
                    args: parseSqlArguments(model, prop.type.entity, f.args),
                    children: parseObjectTree(model, prop.type.entity, schema, f)
                })
                break
            default:
                throw unexpectedCase()
        }
    }

    return requests
}


export function parseSqlArguments(model: Model, typeName: string, gqlArgs: any): SqlArguments {
    let args: SqlArguments = {}

    let where = parseWhere(gqlArgs.where)
    if (where) {
        args.where = where
    }

    if (gqlArgs.orderBy) {
        args.orderBy = parseOrderBy(model, typeName, ensureArray(gqlArgs.orderBy))
    }

    if (gqlArgs.offset) {
        assert(typeof gqlArgs.offset == "number")
        args.offset = gqlArgs.offset
    }

    if (gqlArgs.limit != null) {
        assert(typeof gqlArgs.limit == "number")
        args.limit = gqlArgs.limit
    }

    return args
}


export function parseQueryableTree(
    model: Model,
    queryableName: string,
    schema: GraphQLSchema,
    tree: ResolveTree
): FieldsByEntity {
    let fields: FieldsByEntity = {}
    for (let entity of getQueryableEntities(model, queryableName)) {
        fields[entity] = parseObjectTree(model, entity, schema, tree)
    }
    return fields
}


export function parseAnyTree(
    model: Model,
    typeName: string,
    schema: GraphQLSchema,
    tree: ResolveTree
): AnyFields {
    if (model[typeName].kind == 'interface') {
        return parseQueryableTree(model, typeName, schema, tree)
    } else {
        return parseObjectTree(model, typeName, schema, tree)
    }
}
