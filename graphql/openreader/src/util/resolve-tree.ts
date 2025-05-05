import {UserInputError} from "@subsquid/apollo-server-core"
import assert from "assert"
import {GraphQLResolveInfo, GraphQLSchema} from "graphql"
import {
    FieldsByTypeName,
    parseResolveInfo,
    ResolveTree,
    simplifyParsedResolveInfoFragmentWithType
} from "graphql-parse-resolve-info"


export type ResolveTreeFields = {
    [alias: string]: ResolveTree
}


export interface ResolveTreeWithFields extends ResolveTree {
    fields: ResolveTreeFields
}


export function simplifyResolveTree(schema: GraphQLSchema, tree: ResolveTree, typeName: string): ResolveTreeWithFields {
    let type = schema.getType(typeName)
    assert(type != null)
    return simplifyParsedResolveInfoFragmentWithType(tree, type)
}


export function getResolveTree(info: GraphQLResolveInfo): ResolveTree
export function getResolveTree(info: GraphQLResolveInfo, typeName: string): ResolveTreeWithFields
export function getResolveTree(info: GraphQLResolveInfo, typeName?: string): ResolveTree {
    let tree = parseResolveInfo(info)
    assert(isResolveTree(tree))
    if (typeName) {
        return simplifyResolveTree(info.schema, tree, typeName)
    } else {
        return tree
    }
}


function isResolveTree(resolveInfo: ResolveTree | FieldsByTypeName | null | undefined): resolveInfo is ResolveTree {
    return resolveInfo != null && resolveInfo.fieldsByTypeName != null
}


export function getTreeRequest(treeFields: ResolveTreeFields, fieldName: string): ResolveTree | undefined {
    let req: ResolveTree | undefined
    for (let alias in treeFields) {
        let e = treeFields[alias]
        if (e.name != fieldName) continue
        if (req != null) throw new UserInputError(`multiple aliases for field '${fieldName}' are not supported`)
        req = e
    }
    return req
}


export function hasTreeRequest(treeFields: ResolveTreeFields, fieldName: string): boolean {
    for (let alias in treeFields) {
        let e = treeFields[alias]
        if (e.name == fieldName) return true
    }
    return false
}
