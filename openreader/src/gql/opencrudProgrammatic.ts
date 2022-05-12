import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLInterfaceType,
  GraphQLNonNull,
  GraphQLType,
  isOutputType,
  ThunkObjMap
} from "graphql"
import type { Model, Name } from "../model"

type ModelToGraphql = {
  [K in Model[Name]["kind"]]: (
    name: Name,
    model: Extract<Model[Name], { kind: K }>,
    typeMap: Map<Name, GraphQLType>
  ) => GraphQLType
}

const handlers: ModelToGraphql = {
  interface: (name, model, typeMap) => {
    const fields: ThunkObjMap<GraphQLFieldConfig<any, any, any>> = {}
    for (const key in model.properties) {
      const prop = model.properties[key]
      const type = typeMap.get(key)
      if (!isOutputType(type))
        throw new Error(`Type ${key} is invalid or not present in the schema`)
      fields[key] = {
        type: prop.nullable ? new GraphQLNonNull(type) : type,
        description: prop.description
      }
    }
    return new GraphQLInterfaceType({
      name,
      description: model.description,
      fields: () => fields
    })
  },

  enum: (name, model) =>
    new GraphQLEnumType({
      name,
      description: model.description,
      values: model.values
    })
}

export default handlers
