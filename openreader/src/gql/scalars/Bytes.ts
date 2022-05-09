import {decodeHex, isHex} from "@subsquid/util"
import {GraphQLScalarType} from "graphql"
import {invalidFormat} from "../../util"


export const BytesScalar = new GraphQLScalarType({
    name: 'Bytes',
    description: 'Binary data encoded as a hex string always prefixed with 0x',
    serialize(value) {
        if (typeof value == 'string') {
            if (!isHex(value)) throw invalidFormat('Bytes', value)
            return value.toLowerCase()
        } else {
            return '0x' + (value as Buffer).toString('hex')
        }
    },
    parseValue(value) {
        return decodeHex(value as string)
    },
    parseLiteral(ast) {
        switch(ast.kind) {
            case "StringValue":
                return decodeHex(ast.value)
            default:
                return null
        }
    }
})
