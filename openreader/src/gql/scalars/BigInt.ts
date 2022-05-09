import {GraphQLScalarType} from "graphql"
import {invalidFormat} from "../../util"


export const BigIntScalar = new GraphQLScalarType<bigint | null, string>({
    name: 'BigInt',
    description: 'Big number integer',
    serialize(value) {
        return ''+value
    },
    parseValue(value) {
        if (!isBigInt(value as string)) throw invalidFormat('BigInt', value as string)
        return BigInt(value as bigint)
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
