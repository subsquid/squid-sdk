import assert from "assert"
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
} from "graphql"
import {Model, Prop, PropType} from "../model"
import {validateModel} from "../model.tools"
import {scalars_list} from "../scalars"


const baseSchema = buildASTSchema(parse(`
    directive @entity on OBJECT
    directive @derivedFrom(field: String!) on FIELD_DEFINITION
    directive @unique on FIELD_DEFINITION
    directive @fulltext(query: String!) on FIELD_DEFINITION
    directive @variant on OBJECT # legacy
    directive @jsonField on OBJECT # legacy
    ${scalars_list.map(name => 'scalar ' + name).join('\n')}
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


function isEntityType(type: GraphQLNamedType): boolean {
    return type instanceof GraphQLObjectType && !!type.astNode?.directives?.some(d => d.name.value == 'entity')
}


function addEntityOrJsonObjectOrInterface(model: Model, type: GraphQLObjectType | GraphQLInterfaceType): void {
    if (model[type.name]) return

    let kind: 'entity' | 'object' | 'interface' = isEntityType(type)
        ? 'entity'
        :  type instanceof GraphQLInterfaceType ? 'interface' : 'object'

    let properties: Record<string, Prop> = {}
    let interfaces: string[] = []
    let description = type.description || undefined

    if (kind != 'interface') {
        model[type.name] = {kind, properties, interfaces, description}
    } else {
        model[type.name] = {kind, properties, description}
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
        let fieldType = f.type
        let nullable = true
        let description = f.description || undefined
        let propName = `${type.name}.${f.name}`
        let unique = f.astNode?.directives?.some(d => d.name.value == 'unique')
        handleFulltextDirective(model, type, f)
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
                    name: fieldType.name
                }),
                nullable,
                description
            }
        } else if (fieldType instanceof GraphQLEnumType) {
            addEnum(model, fieldType)
            properties[key] = {
                type: wrapWithList(list.nulls, {
                    kind: 'enum',
                    name: fieldType.name
                }),
                nullable,
                description
            }
        } else if (fieldType instanceof GraphQLUnionType) {
            addUnion(model, fieldType)
            properties[key] = {
                type: wrapWithList(list.nulls, {
                    kind: 'union',
                    name: fieldType.name
                }),
                nullable,
                description
            }
        } else if (fieldType instanceof GraphQLObjectType) {
            if (isEntityType(fieldType)) {
                let derivedFrom = f.astNode?.directives?.filter(d => d.name.value == 'derivedFrom').map(d => {
                    let valueNode = d.arguments?.[0].value
                    assert(valueNode != null)
                    assert(valueNode.kind == 'StringValue')
                    return valueNode.value
                })[0]

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
                                    field: derivedFrom
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
                                    foreignEntity: fieldType.name
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
                                field: derivedFrom
                            },
                            nullable: false,
                            description
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
                    description
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
    let type = f.type
    if (type instanceof GraphQLNonNull) {
        type = type.ofType
    }
    return type instanceof GraphQLScalarType && type.name == 'String'
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


function unsupportedFieldTypeError(propName: string): Error {
    return new SchemaError(`Property ${propName} has unsupported type`)
}


export class SchemaError extends Error {}
