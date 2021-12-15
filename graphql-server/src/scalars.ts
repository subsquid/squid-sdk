import {scalars} from "@subsquid/openreader/dist/scalars"
import {GraphQLFloat, GraphQLID, GraphQLInt} from "graphql"


export const ID = GraphQLID
export const Int = GraphQLInt
export const Float = GraphQLFloat
export const DateTime = scalars.DateTime.gql
export const BigInteger = scalars.BigInt.gql
export const Bytes = scalars.Bytes.gql
