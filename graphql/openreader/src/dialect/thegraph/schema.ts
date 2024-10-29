import {def, unexpectedCase} from '@subsquid/util-internal'
import {toCamelCase} from '@subsquid/util-naming'
import assert from 'assert'
import {
    GraphQLBoolean,
    GraphQLEnumType,
    GraphQLError,
    GraphQLFieldConfig,
    GraphQLFloat,
    GraphQLInputObjectType,
    GraphQLInputType,
    GraphQLInt,
    GraphQLInterfaceType,
    GraphQLList,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLOutputType,
    GraphQLResolveInfo,
    GraphQLScalarType,
    GraphQLSchema,
    GraphQLString,
    GraphQLUnionType,
    Kind,
} from 'graphql'
import {
    GraphQLEnumValueConfigMap,
    GraphQLFieldConfigArgumentMap,
    GraphQLFieldConfigMap,
    GraphQLInputFieldConfigMap,
} from 'graphql/type/definition'
import {Context} from '../../context'
import {getListSize, getObjectSize} from '../../limit.size'
import {Entity, Interface, JsonObject, Model, Prop} from '../../model'
import {getEntity, getObject, getUniversalProperties} from '../../model.tools'
import {customScalars} from '../../scalars'
import {EntityByIdQuery, ListQuery} from '../../sql/query'
import {Limit} from '../../util/limit'
import {getResolveTree} from '../../util/resolve-tree'
import {identity} from '../../util/util'
import {getOrderByList, ORDER_DIRECTIONS} from './orderBy'
import {parseAnyTree, parseObjectTree, parseSqlArguments} from './tree'
import {GqlFieldMap, SchemaOptions} from '../common'
import {toPlural} from './locale'

const GraphQLID = new GraphQLScalarType({
    name: 'ID',
    serialize: GraphQLString.serialize,
    parseValue: GraphQLString.parseValue,
    parseLiteral: function parseLiteral(valueNode) {
        if (valueNode.kind !== Kind.STRING) {
            throw new GraphQLError('ID cannot represent a non-string value: ' + valueNode, valueNode)
        }

        return valueNode.value
    },
})


export class SchemaBuilder {
    private model: Model
    private types = new Map<string, GraphQLOutputType>()
    private where = new Map<string, GraphQLInputType>()
    private orderBy = new Map<string, GraphQLInputType>()

    constructor(private options: SchemaOptions) {
        this.model = options.model
    }

    private get(name: string): GraphQLOutputType
    private get<T extends GraphQLOutputType>(name: string, kind: Type<T>): T
    private get(name: string, kind?: Type<any>): GraphQLOutputType {
        switch (name) {
            case 'ID':
                return GraphQLID
            case 'String':
                return GraphQLString
            case 'Int':
                return GraphQLInt
            case 'Boolean':
                return GraphQLBoolean
            case 'Float':
                return GraphQLFloat
            case 'DateTime':
                return customScalars.DateTime
            case 'BigInt':
                return customScalars.BigInt
            case 'BigDecimal':
                return customScalars.BigDecimal
            case 'Bytes':
                return customScalars.Bytes
            case 'JSON':
                return customScalars.JSON
        }

        let type = this.types.get(name)
        if (type == null) {
            type = this.buildType(name)
            this.types.set(name, type)
        }
        if (kind) {
            assert(type instanceof kind)
        }
        return type
    }

    private buildType(name: string): GraphQLOutputType {
        const item = this.model[name]
        switch (item.kind) {
            case 'entity':
            case 'object':
                return new GraphQLObjectType({
                    name,
                    description: item.description,
                    interfaces: () => item.interfaces?.map((name) => this.get(name, GraphQLInterfaceType)),
                    fields: () => this.buildObjectFields(item),
                })
            case 'interface':
                return new GraphQLInterfaceType({
                    name,
                    description: item.description,
                    fields: () => this.buildObjectFields(item),
                    resolveType: item.queryable ? (value: any) => value._isTypeOf : undefined,
                })
            case 'enum':
                return new GraphQLEnumType({
                    name,
                    description: item.description,
                    values: Object.keys(item.values).reduce((values, variant) => {
                        values[variant] = {}
                        return values
                    }, {} as GraphQLEnumValueConfigMap),
                })
            case 'union':
                return new GraphQLUnionType({
                    name,
                    description: item.description,
                    types: () => item.variants.map((variant) => this.get(variant, GraphQLObjectType)),
                    resolveType(value: any) {
                        return value.isTypeOf
                    },
                })
            default:
                throw unexpectedCase()
        }
    }

    private buildObjectFields(object: Entity | JsonObject | Interface): GraphQLFieldConfigMap<any, any> {
        let fields: GraphQLFieldConfigMap<any, any> = {}
        for (let key in object.properties) {
            let prop = object.properties[key]
            let field: GraphQLFieldConfig<any, any> = {
                description: prop.description,
                type: this.getPropType(prop),
            }
            if (prop.type.kind == 'list-lookup') {
                field.args = this.listArguments(prop.type.entity)
            }
            if (object.kind == 'entity' || object.kind == 'object') {
                switch (prop.type.kind) {
                    case 'object':
                    case 'union':
                    case 'fk':
                    case 'lookup':
                    case 'list-lookup':
                        field.resolve = (source, args, context, info) => source[info.path.key]
                        break
                }
            }
            fields[key] = field
        }
        return fields
    }

    private getPropType(prop: Prop): GraphQLOutputType {
        let type: GraphQLOutputType
        switch (prop.type.kind) {
            case 'list':
                type = new GraphQLList(this.getPropType(prop.type.item))
                break
            case 'fk':
                type = this.get(prop.type.entity)
                break
            case 'lookup':
                return this.get(prop.type.entity)
            case 'list-lookup':
                return new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(this.get(prop.type.entity))))
            default:
                type = this.get(prop.type.name)
        }
        if (!prop.nullable) {
            type = new GraphQLNonNull(type)
        }
        return type
    }

    private listArguments(typeName: string): GraphQLFieldConfigArgumentMap {
        return {
            where: {type: this.getWhere(typeName)},
            orderBy: {type: this.getOrderBy(typeName)},
            orderDirection: {type: this.getOrderDirection()},
            skip: {type: GraphQLInt},
            first: {type: GraphQLInt},
        }
    }

    private getWhere(typeName: string): GraphQLInputType {
        let where = this.where.get(typeName)
        if (where) return where

        let object = this.model[typeName]
        let properties = getUniversalProperties(this.model, typeName)

        where = new GraphQLInputObjectType({
            name: `${typeName}_filter`,
            fields: () => {
                let fields: GraphQLInputFieldConfigMap = {}

                for (let key in properties) {
                    this.buildPropWhereFilters(key, properties[key], fields)
                }

                if (object.kind == 'entity' || object.kind == 'interface') {
                    let whereList = new GraphQLList(new GraphQLNonNull(this.getWhere(typeName)))
                    fields['and'] = {
                        type: whereList,
                    }
                    fields['or'] = {
                        type: whereList,
                    }
                }

                return fields
            },
        })

        this.where.set(typeName, where)
        return where
    }

    private buildPropWhereFilters(key: string, prop: Prop, fields: GraphQLInputFieldConfigMap): void {
        switch (prop.type.kind) {
            case 'scalar': {
                let type = this.get(prop.type.name, GraphQLScalarType)
                let listType = new GraphQLList(new GraphQLNonNull(type))

                fields[`${key}_is_null`] = {type: GraphQLBoolean}
                fields[`${key}`] = {type}
                fields[`${key}_not`] = {type}

                switch (prop.type.name) {
                    case 'ID':
                    case 'String':
                    case 'Int':
                    case 'Float':
                    case 'DateTime':
                    case 'BigInt':
                    case 'BigDecimal':
                        fields[`${key}_gt`] = {type}
                        fields[`${key}_gte`] = {type}
                        fields[`${key}_lt`] = {type}
                        fields[`${key}_lte`] = {type}
                        fields[`${key}_in`] = {type: listType}
                        fields[`${key}_not_in`] = {type: listType}
                        break
                    case 'JSON':
                        fields[`${key}_json_contains`] = {type}
                        fields[`${key}_json_has_key`] = {type}
                        break
                }

                if (prop.type.name == 'ID' || prop.type.name == 'String') {
                    fields[`${key}_contains`] = {type}
                    fields[`${key}_not_contains`] = {type}
                    fields[`${key}_contains_nocase`] = {type}
                    fields[`${key}_not_contains_nocase`] = {type}
                    fields[`${key}_starts_with`] = {type}
                    fields[`${key}_starts_with_nocase`] = {type}
                    fields[`${key}_not_starts_with`] = {type}
                    fields[`${key}_not_starts_with_nocase`] = {type}
                    fields[`${key}_ends_with`] = {type}
                    fields[`${key}_ends_with_nocase`] = {type}
                    fields[`${key}_not_ends_with`] = {type}
                    fields[`${key}_not_ends_with_nocase`] = {type}
                }

                break
            }
            case 'enum': {
                let type = this.get(prop.type.name, GraphQLEnumType)
                let listType = new GraphQLList(new GraphQLNonNull(type))
                fields[`${key}_is_null`] = {type: GraphQLBoolean}
                fields[`${key}`] = {type}
                fields[`${key}_not`] = {type}
                fields[`${key}_in`] = {type: listType}
                fields[`${key}_not_in`] = {type: listType}
                break
            }
            case 'list':
                fields[`${key}_isNull`] = {type: GraphQLBoolean}
                if (prop.type.item.type.kind == 'scalar' || prop.type.item.type.kind == 'enum') {
                    let item = this.getPropType(prop.type.item)
                    let list = new GraphQLList(item)
                    fields[`${key}_contains_all`] = {type: list}
                    fields[`${key}_contains_any`] = {type: list}
                    fields[`${key}_contains_none`] = {type: list}
                }
                break
            case 'object':
                fields[`${key}_is_null`] = {type: GraphQLBoolean}
                if (this.hasFilters(getObject(this.model, prop.type.name))) {
                    fields[`${key}_`] = {type: this.getWhere(prop.type.name)}
                }
                break
            case 'union':
                fields[`${key}_is_null`] = {type: GraphQLBoolean}
                fields[key] = {type: this.getWhere(prop.type.name)}
                break
            case 'fk':
                // TODO: needs to be changed in case if we support non-string ids
                let type = GraphQLString
                let listType = new GraphQLList(new GraphQLNonNull(type))

                fields[`${key}`] = {type}
                fields[`${key}_not`] = {type}
                fields[`${key}_gt`] = {type}
                fields[`${key}_gte`] = {type}
                fields[`${key}_lt`] = {type}
                fields[`${key}_lte`] = {type}
                fields[`${key}_in`] = {type: listType}
                fields[`${key}_not_in`] = {type: listType}
                fields[`${key}_contains`] = {type}
                fields[`${key}_not_contains`] = {type}
                fields[`${key}_contains_nocase`] = {type}
                fields[`${key}_not_contains_nocase`] = {type}
                fields[`${key}_starts_with`] = {type}
                fields[`${key}_starts_with_nocase`] = {type}
                fields[`${key}_not_starts_with`] = {type}
                fields[`${key}_not_starts_with_nocase`] = {type}
                fields[`${key}_ends_with`] = {type}
                fields[`${key}_ends_with_nocase`] = {type}
                fields[`${key}_not_ends_with`] = {type}
                fields[`${key}_not_ends_with_nocase`] = {type}
                fields[`${key}_is_null`] = {type: GraphQLBoolean}
                fields[`${key}_`] = {type: this.getWhere(prop.type.entity)}
                break
            case 'lookup': {
                fields[`${key}_is_null`] = {type: GraphQLBoolean}
                fields[`${key}_`] = {type: this.getWhere(prop.type.entity)}
                break
            }
            case 'list-lookup':
                let where = this.getWhere(prop.type.entity)
                fields[`${key}_every`] = {type: where}
                fields[`${key}_some`] = {type: where}
                fields[`${key}_none`] = {type: where}
                break
        }
    }

    private hasFilters(obj: JsonObject): boolean {
        for (let key in obj.properties) {
            let propType = obj.properties[key].type
            switch (propType.kind) {
                case 'scalar':
                case 'enum':
                case 'union':
                    return true
                case 'object': {
                    let ref = getObject(this.model, propType.name)
                    if (ref !== obj && this.hasFilters(ref)) {
                        return true
                    }
                }
            }
        }
        return false
    }

    private getOrderBy(typeName: string): GraphQLInputType {
        let orderBy = this.orderBy.get(typeName)
        if (orderBy) return orderBy

        let values: GraphQLEnumValueConfigMap = {}
        for (let variant of getOrderByList(this.model, typeName)) {
            values[variant] = {}
        }

        orderBy = new GraphQLEnumType({
            name: `${typeName}_orderBy`,
            values,
        })
        this.orderBy.set(typeName, orderBy)
        return orderBy
    }

    @def
    private getOrderDirection(): GraphQLInputType {
        let values: GraphQLEnumValueConfigMap = {}
        for (let variant of Object.keys(ORDER_DIRECTIONS)) {
            values[variant] = {}
        }

        return new GraphQLEnumType({
            name: `OrderDirection`,
            values,
        })
    }

    @def
    build(): GraphQLSchema {
        let query: GqlFieldMap = {}
        let subscription: GqlFieldMap = {}

        for (let name in this.model) {
            let item = this.model[name]
            switch (item.kind) {
                case 'entity':
                    this.installEntityQuery(name, query, subscription)
                    this.installListQuery(name, query, subscription)
                    break
                case 'interface':
                    if (item.queryable) {
                        this.installListQuery(name, query, subscription)
                    }
                    break
            }
        }

        return new GraphQLSchema({
            query: new GraphQLObjectType({
                name: 'Query',
                fields: query,
            }),
            subscription: this.options.subscriptions
                ? new GraphQLObjectType({
                      name: 'Subscription',
                      fields: subscription,
                  })
                : undefined,
        })
    }

    private installListQuery(typeName: string, query: GqlFieldMap, subscription: GqlFieldMap): void {
        let model = this.model

        let entity = model[typeName]
        let queryName = (entity.kind === 'entity' && entity.listQueryName) || this.normalizeQueryName(typeName).plural
        let outputType = new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(this.get(typeName))))
        let argsType = this.listArguments(typeName)

        function createQuery(context: Context, info: GraphQLResolveInfo, limit?: Limit) {
            let tree = getResolveTree(info)
            let args = parseSqlArguments(model, typeName, tree.args)
            let fields = parseAnyTree(model, typeName, info.schema, tree)
            limit?.check(() => getListSize(model, typeName, fields, args.limit, args.where) + 1)
            return new ListQuery(model, context.openreader.dbType, typeName, fields, args)
        }

        query[queryName] = {
            type: outputType,
            args: argsType,
            resolve(source, args, context, info) {
                let q = createQuery(context, info, context.openreader.responseSizeLimit)
                return context.openreader.executeQuery(q)
            },
        }

        subscription[queryName] = {
            type: outputType,
            args: argsType,
            resolve: identity,
            subscribe(source, args, context, info) {
                let q = createQuery(context, info, context.openreader.subscriptionResponseSizeLimit)
                return context.openreader.subscription(q)
            },
        }
    }

    private installEntityQuery(entityName: string, query: GqlFieldMap, subscription: GqlFieldMap): void {
        let model = this.model

        let entity = model[entityName]
        let queryName = (entity.kind === 'entity' && entity.queryName) || this.normalizeQueryName(entityName).singular
        let argsType = {
            id: {type: new GraphQLNonNull(GraphQLString)},
        }

        function createQuery(context: Context, info: GraphQLResolveInfo, limit?: Limit) {
            let tree = getResolveTree(info)
            let fields = parseObjectTree(model, entityName, info.schema, tree)
            limit?.check(() => getObjectSize(model, fields) + 1)
            return new EntityByIdQuery(model, context.openreader.dbType, entityName, fields, tree.args.id as string)
        }

        query[queryName] = {
            type: this.get(entityName),
            args: argsType,
            async resolve(source, args, context, info) {
                let q = createQuery(context, info, context.openreader.responseSizeLimit)
                return context.openreader.executeQuery(q)
            },
        }

        subscription[queryName] = {
            type: this.get(entityName),
            args: argsType,
            resolve: identity,
            subscribe(source, args, context, info) {
                let q = createQuery(context, info, context.openreader.subscriptionResponseSizeLimit)
                return context.openreader.subscription(q)
            },
        }
    }

    private normalizeQueryName(typeName: string) {
        let singular = toCamelCase(typeName)
        let plural = toPlural(singular)
        if (singular === plural) {
            plural += '_collection'
        }

        return {singular, plural}
    }
}

interface Type<T> {
    new (...args: any[]): T
}
