import {unexpectedCase} from "@subsquid/util-internal"
import assert from "assert"
import {GraphQLSchema} from "graphql"
import {ResolveTree} from "graphql-parse-resolve-info"
import {EntityListArguments} from "../ir/args"
import {FieldRequest, OpaqueRequest} from "../ir/fields"
import {Model} from "../model"
import {simplifyResolveTree} from "../util/resolve-tree"
import {ensureArray} from "../util/util"
import {parseOrderBy} from "./orderBy"
import {parseWhere} from "./where"


export function parseResolveTree(
    model: Model,
    objectName: string,
    schema: GraphQLSchema,
    tree: ResolveTree
): FieldRequest[] {

    let requests: FieldRequest[] = []
    let requestedScalars: Record<string, true> = {}
    let object = model[objectName]
    assert(object.kind == "entity" || object.kind == "object")

    let fields = simplifyResolveTree(schema, tree, objectName).fields
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
                    index: 0,
                    children: parseResolveTree(model, prop.type.name, schema, f)
                })
                break
            case "union": {
                let union = model[prop.type.name]
                assert(union.kind == "union")
                let children: FieldRequest[] = []
                for (let variant of union.variants) {
                    for (let req of parseResolveTree(model, variant, schema, f)) {
                        req.ifType = variant
                        children.push(req)
                    }
                }
                requests.push({
                    field: f.name,
                    aliases: [f.alias],
                    kind: prop.type.kind,
                    type: prop.type,
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
                    index: 0,
                    children: parseResolveTree(model, prop.type.foreignEntity, schema, f)
                })
                break
            case "lookup":
                requests.push({
                    field: f.name,
                    aliases: [f.alias],
                    kind: prop.type.kind,
                    type: prop.type,
                    index: 0,
                    children: parseResolveTree(model, prop.type.entity, schema, f)
                })
                break
            case "list-lookup":
                requests.push({
                    field: f.name,
                    aliases: [f.alias],
                    kind: prop.type.kind,
                    type: prop.type,
                    index: 0,
                    args: parseEntityListArguments(model, prop.type.entity, f),
                    children: parseResolveTree(model, prop.type.entity, schema, f)
                })
                break
            default:
                throw unexpectedCase()
        }
    }

    return requests
}


export function parseEntityListArguments(model: Model, entityName: string, tree: ResolveTree): EntityListArguments {
    let args: EntityListArguments = {}

    let where = parseWhere(tree.args.where)
    if (where) {
        args.where = where
    }

    if (tree.args.orderBy) {
        args.orderBy = parseOrderBy(model, entityName, ensureArray(tree.args.orderBy))
    }

    if (tree.args.offset) {
        assert(typeof tree.args.offset == "number")
        args.offset = tree.args.offset
    }

    if (tree.args.limit != null) {
        assert(typeof tree.args.limit == "number")
        args.limit = tree.args.limit
    }

    return args
}
