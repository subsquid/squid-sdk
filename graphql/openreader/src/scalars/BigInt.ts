import {GraphQLScalarType} from "graphql"
import {invalidFormat} from "../util/util"


export const BigIntScalar = new GraphQLScalarType({
    name: 'BigInt',
    description: 'Big number integer',
    serialize(value: number | string | bigint) {
        return ''+value
    },
    parseValue(value: string) {
        if (!isBigInt(value)) throw invalidFormat('BigInt', value)
        return BigInt(value)
    },
    parseLiteral(ast) {
        switch(ast.kind) {
            case "StringValue":
                if (isBigInt(ast.value)) {
                    return BigInt(ast.value)
                } else {
                    throw invalidFormat('BigInt', ast.value)
                }
            case "IntValue":
                return BigInt(ast.value)
            default:
                return null
        }
    }
})


function isBigInt(s: string): boolean {
    return /^[+\-]?\d+$/.test(s)
}
