import {assertNotNull, unexpectedCase} from '@subsquid/util-internal'
import assert from 'assert'
import {
    buildASTSchema,
    DocumentNode,
    extendSchema,
    GraphQLEnumType,
    GraphQLField,
    GraphQLInterfaceType,
    GraphQLList,
    GraphQLNamedType,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLOutputType,
    GraphQLScalarType,
    GraphQLSchema,
    GraphQLUnionType,
    parse,
    validateSchema
} from 'graphql'
import {Index, Model, Prop, PropType, Scalar} from './model'
import {validateModel} from './model.tools'
import {customScalars} from './scalars'


const baseSchema = buildASTSchema(parse(`
    directive @entity on OBJECT
    directive @query on INTERFACE
    directive @derivedFrom(field: String!) on FIELD_DEFINITION
    directive @unique on FIELD_DEFINITION
    directive @index(fields: [String!] unique: Boolean) on OBJECT | FIELD_DEFINITION
    directive @fulltext(query: String!) on FIELD_DEFINITION
    directive @cardinality(value: Int!) on OBJECT | FIELD_DEFINITION
    directive @byteWeight(value: Float!) on FIELD_DEFINITION
    directive @variant on OBJECT # legacy
    directive @jsonField on OBJECT # legacy
    scalar ID
    ${Object.keys(customScalars).map(name => 'scalar ' + name).join('\n')}
`))


export function buildSchema(doc: DocumentNode): GraphQLSchema {
    let schema = extendSchema(baseSchema, doc)
    let errors = validateSchema(schema).filter(err => !/query root/i.test(err.message))
    if (errors.length > 0) {
        throw errors[0]
    }
    return schema
}


export function buildModel(schema: GraphQLSchema): Model {
    let types = schema.getTypeMap()
    let model: Model = {}
    for (let key in types) {
        let type = types[key]
        if (isEntityType(type)) {
            addEntityOrJsonObjectOrInterface(model, type as GraphQLObjectType)
        }
    }
    validateModel(model)
    return model
}


function isEntityType(type: unknown): boolean {
    return type instanceof GraphQLObjectType && !!type.astNode?.directives?.some(d => d.name.value == 'entity')
}


function addEntityOrJsonObjectOrInterface(model: Model, type: GraphQLObjectType | GraphQLInterfaceType): void {
    if (model[type.name]) return

    let kind: 'entity' | 'object' | 'interface' = isEntityType(type)
        ? 'entity'
        :  type instanceof GraphQLInterfaceType ? 'interface' : 'object'

    let properties: Record<string, Prop> = {}
    let interfaces: string[] = []
    let indexes: Index[] = type instanceof GraphQLObjectType ? checkEntityIndexes(type) : []
    let cardinality = checkEntityCardinality(type)
    let description = type.description || undefined

    switch(kind) {
        case 'entity':
            model[type.name] = {kind, properties, description, interfaces, indexes, ...cardinality}
            break
        case 'object':
            model[type.name] = {kind, properties, description, interfaces}
            break
        case 'interface':
            model[type.name] = {kind, properties, description, queryable: isQueryableInterface(type)}
            break
        default:
            throw unexpectedCase(kind)
    }

    let fields = type.getFields()
    if (kind == 'entity') {
        if (fields.id == null) {
            properties.id = {
                type: {kind: 'scalar', name: 'ID'},
                nullable: false
            }
        } else {
            let correctIdType = fields.id.type instanceof GraphQLNonNull
                && fields.id.type.ofType instanceof GraphQLScalarType
                && fields.id.type.ofType.name === 'ID'
            if (!correctIdType) {
                throw unsupportedFieldTypeError(type.name + '.id')
            }
        }
    }

    for (let key in fields) {
        let f: GraphQLField<any, any> = fields[key]

        handleFulltextDirective(model, type, f)

        let propName = `${type.name}.${f.name}`
        let fieldType = f.type
        let nullable = true
        let description = f.description || undefined
        let derivedFrom = checkDerivedFrom(type, f)
        let index = checkFieldIndex(type, f)
        let unique = index?.unique || false
        let limits = {
            ...checkByteWeightDirective(type, f),
            ...checkCardinalityLimitDirective(type, f)
        }

        if (index) {
            indexes.push(index)
        }

        if (fieldType instanceof GraphQLNonNull) {
            nullable = false
            fieldType = fieldType.ofType
        }

        let list = unwrapList(fieldType)
        fieldType = list.item

        if (fieldType instanceof GraphQLScalarType) {
            properties[key] = {
                type: wrapWithList(list.nulls, {
                    kind: 'scalar',
                    name: fieldType.name as Scalar
                }),
                nullable,
                description,
                ...limits
            }
        } else if (fieldType instanceof GraphQLEnumType) {
            addEnum(model, fieldType)
            properties[key] = {
                type: wrapWithList(list.nulls, {
                    kind: 'enum',
                    name: fieldType.name
                }),
                nullable,
                description,
                ...limits
            }
        } else if (fieldType instanceof GraphQLUnionType) {
            addUnion(model, fieldType)
            properties[key] = {
                type: wrapWithList(list.nulls, {
                    kind: 'union',
                    name: fieldType.name
                }),
                nullable,
                description,
                ...limits
            }
        } else if (fieldType instanceof GraphQLObjectType) {
            if (isEntityType(fieldType) && kind != 'interface') {
                switch(list.nulls.length) {
                    case 0:
                        if (derivedFrom) {
                            if (!nullable) {
                                throw new SchemaError(`Property ${propName} must be nullable`)
                            }
                            properties[key] = {
                                type: {
                                    kind: 'lookup',
                                    entity: fieldType.name,
                                    field: derivedFrom.field
                                },
                                nullable,
                                description
                            }
                        } else {
                            if (unique && nullable) {
                                throw new SchemaError(`Unique property ${propName} must be non-nullable`)
                            }
                            properties[key] = {
                                type: {
                                    kind: 'fk',
                                    entity: fieldType.name
                                },
                                nullable,
                                unique,
                                description
                            }
                        }
                        break
                    case 1:
                        if (derivedFrom == null) {
                            throw new SchemaError(`@derivedFrom directive is required on ${propName} declaration`)
                        }
                        properties[key] = {
                            type: {
                                kind: 'list-lookup',
                                entity: fieldType.name,
                                field: derivedFrom.field
                            },
                            nullable: false,
                            description,
                            ...limits
                        }
                        break
                    default:
                        throw unsupportedFieldTypeError(propName)
                }
            } else {
                addEntityOrJsonObjectOrInterface(model, fieldType)
                properties[key] = {
                    type: wrapWithList(list.nulls, {
                        kind: 'object',
                        name: fieldType.name
                    }),
                    nullable,
                    description,
                    ...limits
                }
            }
        } else {
            throw unsupportedFieldTypeError(propName)
        }
    }

    if (kind != 'interface') {
        type.getInterfaces().forEach(i => {
            addEntityOrJsonObjectOrInterface(model, i)
            interfaces.push(i.name)
        })
    }
}


function addUnion(model: Model, type: GraphQLUnionType): void {
    if (model[type.name]) return
    let variants: string[] = []

    model[type.name] = {
        kind: 'union',
        variants,
        description: type.description || undefined
    }

    type.getTypes().forEach(obj => {
        if (isEntityType(obj)) {
            throw new Error(`union ${type.name} has entity ${obj.name} as a variant. Entities in union types are not supported`)
        }
        addEntityOrJsonObjectOrInterface(model, obj)
        variants.push(obj.name)
    })
}


function addEnum(model: Model, type: GraphQLEnumType): void {
    if (model[type.name]) return
    let values: Record<string, {}> = {}

    model[type.name] = {
        kind: 'enum',
        values,
        description: type.description || undefined
    }

    type.getValues().forEach(item => {
        values[item.name] = {}
    })
}


function handleFulltextDirective(model: Model, object: GraphQLNamedType, f: GraphQLField<any, any>): void {
    f.astNode?.directives?.forEach(d => {
        if (d.name.value != 'fulltext') return
        if (!isEntityType(object) || !isStringField(f)) {
            throw new Error(`@fulltext directive can be only applied to String entity fields, but was applied to ${object.name}.${f.name}`)
        }
        let queryArgument = d.arguments?.find(arg => arg.name.value == 'query')
        assert(queryArgument != null)
        assert(queryArgument.value.kind == 'StringValue')
        let queryName = queryArgument.value.value
        let query = model[queryName]
        if (query == null) {
            query = model[queryName] = {
                kind: 'fts',
                sources: []
            }
        }
        assert(query.kind == 'fts')
        let src = query.sources.find(s => s.entity == object.name)
        if (src == null) {
            query.sources.push({
                entity: object.name,
                fields: [f.name]
            })
        } else {
            src.fields.push(f.name)
        }
    })
}


function isStringField(f: GraphQLField<any, any>): boolean {
    return asScalarField(f)?.name == 'String'
}


function asScalarField(f: GraphQLField<any, any>): GraphQLScalarType | undefined {
    let type = asNonNull(f)
    return type instanceof GraphQLScalarType ? type : undefined
}


function asNonNull(f: GraphQLField<any, any>): GraphQLOutputType {
    let type = f.type
    if (type instanceof GraphQLNonNull) {
        type = type.ofType
    }
    return type
}


function unwrapList(type: GraphQLOutputType): DeepList {
    let nulls: boolean[] = []
    while (type instanceof GraphQLList) {
        type = type.ofType
        if (type instanceof GraphQLNonNull) {
            nulls.push(false)
            type = type.ofType
        } else {
            nulls.push(true)
        }
    }
    return {item: type, nulls}
}


interface DeepList {
    item: GraphQLOutputType
    nulls: boolean[]
}


function wrapWithList(nulls: boolean[], dataType: PropType): PropType {
    if (nulls.length == 0) return dataType
    return {
        kind: 'list',
        item: {
            type: wrapWithList(nulls.slice(1), dataType),
            nullable: nulls[0]
        }
    }
}


function checkFieldIndex(type: GraphQLNamedType, f: GraphQLField<any, any>): Index | undefined {
    let unique = false
    let index = false

    f.astNode?.directives?.forEach(d => {
        if (d.name.value == 'unique') {
            assertCanBeIndexed(type, f)
            index = true
            unique = true
        } else if (d.name.value == 'index') {
            assertCanBeIndexed(type, f)
            let fieldsArg = d.arguments?.find(arg => arg.name.value == 'fields')
            if (fieldsArg) throw new SchemaError(
                `@index(fields: ...) where applied to ${type.name}.${f.name}, but fields argument is not allowed when @index is applied to a field`
            )
            let uniqueArg = d.arguments?.find(arg => arg.name.value == 'unique')
            if (uniqueArg) {
                assert(uniqueArg.value.kind == 'BooleanValue')
                unique = uniqueArg.value.value
            }
            index = true
        }
    })

    if (!index) return undefined

    return {
        fields: [{name: f.name}],
        unique
    }
}


function assertCanBeIndexed(type: GraphQLNamedType, f: GraphQLField<any, any>): void {
    if (!isEntityType(type)) throw new SchemaError(
        `${type.name}.${f.name} can't be indexed, because ${type.name} is not an entity`
    )
    if (!canBeIndexed(f)) throw new SchemaError(
        `${type.name}.${f.name} can't be indexed, it is not a scalar, enum or foreign key`
    )
}


function canBeIndexed(f: GraphQLField<any, any>): boolean {
    let type = asNonNull(f)
    if (type instanceof GraphQLScalarType || type instanceof GraphQLEnumType) return true
    return isEntityType(type) && !f.astNode?.directives?.some(d => d.name.value == 'derivedFrom')
}


function checkEntityIndexes(type: GraphQLObjectType): Index[] {
    let indexes: Index[] = []
    type.astNode?.directives?.forEach(d => {
        if (d.name.value != 'index') return
        if (!isEntityType(type)) throw new SchemaError(
            `@index was applied to ${type.name}, but only entities can have indexes`
        )
        let fieldsArg = d.arguments?.find(arg => arg.name.value == 'fields')
        if (fieldsArg == null) throw new SchemaError(
            `@index was applied to ${type.name}, but no fields were specified`
        )
        assert(fieldsArg.value.kind == 'ListValue')
        if (fieldsArg.value.values.length == 0) throw new SchemaError(
            `@index was applied to ${type.name}, but no fields were specified`
        )
        let fields = fieldsArg.value.values.map(arg => {
            assert(arg.kind == 'StringValue')
            let name = arg.value
            let f = type.getFields()[name]
            if (f == null) throw new SchemaError(
                `Entity ${type.name} doesn't have a field '${name}', but it is a part of @index`
            )
            assertCanBeIndexed(type, f)
            return {name}
        })
        indexes.push({
            fields,
            unique: !!d.arguments?.find(arg => arg.name.value == 'unique')?.value
        })
    })
    return indexes
}


function checkDerivedFrom(type: GraphQLNamedType, f: GraphQLField<any, any>): {field: string} | undefined {
    let directives = f.astNode?.directives?.filter(d => d.name.value == 'derivedFrom') || []
    if (directives.length == 0) return undefined
    if (!isEntityType(type)) throw new SchemaError(
        `@derivedFrom where applied to ${type.name}.${f.name}, but only entities can have lookup fields`
    )
    if (directives.length > 1) throw new SchemaError(
        `Multiple @derivedFrom where applied to ${type.name}.${f.name}`
    )
    let d = directives[0]
    let fieldArg = assertNotNull(d.arguments?.find(arg => arg.name.value == 'field'))
    assert(fieldArg.value.kind == 'StringValue')
    return {field: fieldArg.value.value}
}


function checkEntityCardinality(type: GraphQLObjectType | GraphQLInterfaceType): {cardinality?: number} {
    let directives = type.astNode?.directives?.filter(d => d.name.value == 'cardinality') || []
    if (directives.length > 0 && !isEntityType(type)) {
        throw new SchemaError(`@cardinality directive can be only applied to entities, but were applied to ${type.name}`)
    }
    if (directives.length > 1) throw new SchemaError(
        `Multiple @cardinality directives where applied to ${type.name}`
    )
    if (directives.length == 0) return {}
    let arg = assertNotNull(directives[0].arguments?.find(arg => arg.name.value == 'value'))
    assert(arg.value.kind == 'IntValue')
    let cardinality = parseInt(arg.value.value, 10)
    if (cardinality < 0) throw new SchemaError(
        `Incorrect @cardinality where applied to ${type.name}. Cardinality value must be positive.`
    )
    return {cardinality}
}


function checkCardinalityLimitDirective(type: GraphQLNamedType, f: GraphQLField<any, any>): {cardinality?: number} {
    let directives = f.astNode?.directives?.filter(d => d.name.value == 'cardinality') || []
    if (directives.length > 1) throw new SchemaError(
        `Multiple @cardinality directives where applied to ${type.name}.${f.name}`
    )
    if (directives.length == 0) return {}
    let arg = assertNotNull(directives[0].arguments?.find(arg => arg.name.value == 'value'))
    assert(arg.value.kind == 'IntValue')
    let cardinality = parseInt(arg.value.value, 10)
    if (cardinality < 0) throw new SchemaError(
        `Incorrect @cardinality where applied to ${type.name}.${f.name}. Cardinality value must be positive.`
    )
    return {cardinality}
}


function checkByteWeightDirective(type: GraphQLNamedType, f: GraphQLField<any, any>): {byteWeight?: number} {
    let directives = f.astNode?.directives?.filter(d => d.name.value == 'byteWeight') || []
    if (directives.length > 1) throw new SchemaError(
        `Multiple @byteWeight directives where applied to ${type.name}.${f.name}`
    )
    if (directives.length == 0) return {}
    let arg = assertNotNull(directives[0].arguments?.find(arg => arg.name.value == 'value'))
    assert(arg.value.kind == 'FloatValue')
    let byteWeight = parseFloat(arg.value.value)
    if (byteWeight < 0) throw new SchemaError(
        `Incorrect @byteWeight where applied to ${type.name}.${f.name}. Byte weight value must be positive.`
    )
    return {byteWeight}
}


function isQueryableInterface(type: GraphQLOutputType): boolean {
    return type instanceof GraphQLInterfaceType
        && !!type.astNode?.directives?.find(d => d.name.value == 'query')
}


function unsupportedFieldTypeError(propName: string): Error {
    return new SchemaError(`Property ${propName} has unsupported type`)
}


export class SchemaError extends Error {}
