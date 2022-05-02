import {GraphQLScalarType} from "graphql"


export const JSONScalar = new GraphQLScalarType({
    name: 'JSON',
    description: 'A scalar that can represent any JSON value',
})
