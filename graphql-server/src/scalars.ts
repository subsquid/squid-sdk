import {customScalars} from "@subsquid/openreader/lib/scalars"
import {GraphQLFloat, GraphQLID, GraphQLInt} from "graphql"


export const ID = GraphQLID
export const Int = GraphQLInt
export const Float = GraphQLFloat
export const DateTime = customScalars.DateTime
export const BigInteger = customScalars.BigInt
export const BigDecimalScalar = customScalars.BigDecimal
export const Bytes = customScalars.Bytes
export const Json = customScalars.JSON
