import type {IFieldResolver, IResolvers} from "@graphql-tools/utils"
import {toCamelCase} from "@subsquid/util"
import {UserInputError} from "apollo-server-core"
import assert from "assert"
import type {GraphQLResolveInfo} from "graphql"
import type {Database, Transaction} from "./db"
import type {Entity, JsonObject, Model} from "./model"
import {QueryBuilder} from "./queryBuilder"
import {
    ConnectionArgs as RelayConnectionArgs,
    ConnectionEdge,
    ConnectionResponse as RelayConnectionResponse,
    decodeConnectionArgs,
    encodeCursor,
    PageInfo
} from "./relayConnection"
import {connectionRequestedFields, ftsRequestedFields, requestedFields} from "./requestedFields"
import {getScalarResolvers} from "./scalars"
import {ensureArray, toQueryListField, unsupportedCase} from "./util"


export interface ResolverContext {
    openReaderTransaction: Transaction
}


export function buildResolvers(model: Model): IResolvers<unknown, ResolverContext> {
    let Query: Record<string, IFieldResolver<unknown, ResolverContext>> = {}
    let resolvers: IResolvers = {Query, ...getScalarResolvers()}

    for (let name in model) {
        let item = model[name]
        switch(item.kind) {
            case 'entity':
                Query[toQueryListField(name)] = async (source, args, context, info) => {
                    let fields = requestedFields(model, name, info)
                    let db = await context.openReaderTransaction.get()
                    return new QueryBuilder(model, db).executeSelect(name, args, fields)
                }
                Query[toQueryListField(name) + 'Connection'] = async (source, args, context, info) => {
                    let db = await context.openReaderTransaction.get()
                    return resolveEntityConnection(model, name, args, info, db)
                }
                Query[`${toCamelCase(name)}ById`] = async (source, args, context, info) => {
                    let fields = requestedFields(model, name, info)
                    let db = await context.openReaderTransaction.get()
                    let result = await new QueryBuilder(model, db)
                        .executeSelect(name, {where: {id_eq: args.id}}, fields)
                    assert(result.length < 2)
                    return result[0]
                }
                Query[`${toCamelCase(name)}ByUniqueInput`] = async (source, args, context, info) => {
                    let fields = requestedFields(model, name, info)
                    let db = await context.openReaderTransaction.get()
                    let result = await new QueryBuilder(model, db)
                        .executeSelect(name, {where: {id_eq: args.where.id}}, fields)
                    assert(result.length < 2)
                    return result[0]
                }
                installFieldResolvers(name, item)
                break
            case 'object':
                installFieldResolvers(name, item)
                break
            case 'union':
                resolvers[name] = {
                    __resolveType: resolveUnionType
                }
                break
            case 'fts':
                Query[name] = async (source, args, context, info) => {
                    let fields = ftsRequestedFields(model, name, info)
                    let db = await context.openReaderTransaction.get()
                    return new QueryBuilder(model, db).executeFulltextSearch(name, args, fields)
                }
                resolvers[`${name}_Item`] = {
                    __resolveType: resolveUnionType
                }
                break
        }
    }

    function installFieldResolvers(name: string, object: Entity | JsonObject): void {
        let fields: Record<string, IFieldResolver<any, any>> = {}
        for (let key in object.properties) {
            let kind = object.properties[key].type.kind
            switch(kind) {
                case 'object':
                case 'union':
                case 'fk':
                case 'lookup':
                case 'list-lookup':
                    fields[key] = aliasResolver
                    break
                case 'scalar':
                case 'enum':
                case 'list':
                    break
                default:
                    throw unsupportedCase(kind)
            }
        }
        resolvers[name] = fields
    }

    return resolvers
}


function resolveUnionType(source: any): string {
    return source.isTypeOf
}


function aliasResolver(source: any, args: unknown, ctx: unknown, info: GraphQLResolveInfo): any {
    return source[info.path.key]
}


interface ConnectionArgs extends RelayConnectionArgs {
    orderBy?: string[]
    where?: any
}


interface ConnectionResponse extends RelayConnectionResponse<any> {
    totalCount?: number
}


async function resolveEntityConnection(
    model: Model,
    entityName: string,
    args: ConnectionArgs,
    info: GraphQLResolveInfo,
    db: Database
): Promise<ConnectionResponse> {
    let response: ConnectionResponse = {}

    let orderBy = args.orderBy && ensureArray(args.orderBy)
    if (!orderBy?.length) {
        throw new UserInputError('orderBy argument is required for connection')
    }

    let {offset, limit} = decodeConnectionArgs(args)
    let listArgs = {
        where: args.where,
        orderBy,
        offset,
        limit: limit + 1
    }

    // https://relay.dev/assets/files/connections-932f4f2cdffd79724ac76373deb30dc8.htm#sec-undefined.PageInfo.Fields
    function pageInfo(listLength: number): PageInfo {
        return {
            hasNextPage: listLength > limit,
            hasPreviousPage: listLength > 0 && offset > 0,
            startCursor: listLength > 0 ? encodeCursor(offset + 1) : '',
            endCursor: listLength > 0 ? encodeCursor(offset + Math.min(limit, listLength)) : ''
        }
    }

    let fields = connectionRequestedFields(model, entityName, info)
    if (fields.edges?.node) {
        let nodes = await new QueryBuilder(model, db).executeSelect(entityName, listArgs, fields.edges.node)
        let edges: ConnectionEdge<any>[] = new Array(Math.min(limit, nodes.length))
        for (let i = 0; i < edges.length; i++) {
            edges[i] = {
                node: nodes[i],
                cursor: encodeCursor(offset + i + 1)
            }
        }
        response.edges = edges
        response.pageInfo = pageInfo(nodes.length)
        if (nodes.length > 0 && nodes.length <= limit) {
            response.totalCount = offset + nodes.length
        }
    } else if (fields.edges?.cursor || fields.pageInfo) {
        let listLength = await new QueryBuilder(model, db).executeListCount(entityName, listArgs)
        response.pageInfo = pageInfo(listLength)
        if (fields.edges?.cursor) {
            response.edges = []
            for (let i = 0; i < Math.min(limit, listLength); i++) {
                response.edges.push({
                    cursor: encodeCursor(offset + i + 1)
                })
            }
        }
        if (listLength > 0 && listLength <= limit) {
            response.totalCount = offset + listLength
        }
    }

    if (fields.totalCount && response.totalCount == null) {
        response.totalCount = await new QueryBuilder(model, db).executeSelectCount(entityName, listArgs.where)
    }

    return response
}
