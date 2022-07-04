import {toCamelCase} from "@subsquid/util-naming"
import {
    GraphQLBoolean,
    GraphQLFloat,
    GraphQLID,
    GraphQLInt,
    GraphQLList,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLOutputType,
    GraphQLScalarType,
    GraphQLSchema,
    GraphQLString
} from "graphql"
import type {Entity, Model, Name, Prop} from "../model"
import {toQueryListField} from "../util"
import {customScalars} from "./scalars"


type TypeMap = Map<Name, GraphQLOutputType>


const getSchema = (model: Model): GraphQLSchema => {
  const entities = Object.entries(model).filter(
    ([name, { kind }]) => kind === "entity"
  ) as [string, Entity][]
  const typeMap: TypeMap = new Map()
  hydrateScalars(customScalars, typeMap)
  generateObjects(entities, typeMap)
  const queryRootType = getUniversalRootType(entities, typeMap)
  const subscriptonRootType = getUniversalRootType(entities, typeMap, true)
  const schema = new GraphQLSchema({
    query: queryRootType,
    subscription: subscriptonRootType,
  })
  return schema
}

const generateObjects = (entities: [string, Entity][], typeMap: TypeMap) => {
  for (const [name, entity] of entities) {
    typeMap.set(
      name,
      new GraphQLObjectType({
        name,
        description: entity.description,
        fields: () => generateFields(entity.properties, typeMap),
      })
    )
  }
}

const getUniversalRootType = (
  entities: [string, Entity][],
  typeMap: TypeMap,
  isSubscription?: boolean
): GraphQLObjectType => {
  const result = new GraphQLObjectType({
    name: isSubscription ? "subscriptionRoot" : "queryRoot",
    fields: () => {
      const fields: any = {}
      for (const [name, entity] of entities) {
        fields[`${toCamelCase(name)}ById`] = {
          type: typeMap.get(name)!,
          args: {
            id: {
              description: 'Entity primary ID',
              type: new GraphQLNonNull(GraphQLID)
            }
          },
          resolve: () => ({ id: "test", wallet: "kek" }),
          ...isSubscription && {
            subscribe: subscribeToString
          }
        }
        fields[toQueryListField(name)] = {
          type: new GraphQLList(typeMap.get(name)!),
          resolve: () => [{ id: "test", wallet: "kek" }],
          subscribe: subscribeToString
        }
      }
      return fields
    },
  })
  return result
}

const generateFields = (properties: Entity["properties"], typeMap: TypeMap) => {
  const fields: any = {}
  for (const name in properties) {
    const entity = properties[name]
    fields[name] = {
      description: entity.description,
      type: fromProp(entity, typeMap)
    }
  }
  return fields
}

async function* subscribeToString() {
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    yield {
      id: 'kek'
    }
  }
}

const fromProp = (prop: Prop, typeMap: TypeMap): GraphQLOutputType => {
  const result = getTypeFromProp(prop, typeMap)
  return prop.nullable
    ? result
    : new GraphQLNonNull(result)
}

const getTypeFromProp = (prop: Prop, typeMap: TypeMap): GraphQLOutputType => {
  switch (prop.type.kind) {
    case 'list':
      return new GraphQLList(fromProp(prop.type.item, typeMap))
    case 'fk':
      return typeMap.get(prop.type.foreignEntity)!
    case 'lookup':
      return typeMap.get(prop.type.entity)!
    case 'list-lookup':
      return new GraphQLList(typeMap.get(prop.type.entity)!)
    default:
      return typeMap.get(prop.type.name)!
  }
}

const hydrateScalars = (customScalars: Record<string, GraphQLScalarType>, typeMap: TypeMap) => {
  const defaultScalars = {
    Int: GraphQLInt,
    Float: GraphQLFloat,
    String: GraphQLString,
    Boolean: GraphQLBoolean,
    ID: GraphQLID,
  }
  const scalars = {
    ...defaultScalars,
    ...customScalars
  }
  Object.entries(scalars)
    .forEach(([key, value]) => typeMap.set(key, value))
}

export default getSchema
