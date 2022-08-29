import {BigDecimal, BigDecimalSource} from "@subsquid/big-decimal"
import {GraphQLScalarType} from "graphql"
import {invalidFormat} from "../util/util"

export const BigDecimalScalar = new GraphQLScalarType({
    name: 'BigDecimal',
    description: 'Big number decimal',
    serialize(value: BigDecimalSource) {
        return BigDecimal(value).toString()
    },
    parseValue(value: string) {
        if (!isDecimal(value)) throw invalidFormat('BigDecimal', value)
        return BigDecimal(value)
    },
    parseLiteral(ast) {
        switch (ast.kind) {
            case "StringValue":
                if (isDecimal(ast.value)) {
                    return BigDecimal(ast.value)
                } else {
                    throw invalidFormat('BigDecimal', ast.value)
                }
            case "IntValue":
            case "FloatValue":
                return BigDecimal(ast.value)
            default:
                return null
        }
    }
})


function isDecimal(s: string): boolean {
    return /^[+\-]?\d+\.?(\d+)?(e-\d+)?$/.test(s)
}
