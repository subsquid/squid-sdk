import {decodeHex, isHex, toHex} from "@subsquid/util-internal-hex"
import {GraphQLScalarType} from "graphql"
import {invalidFormat} from "../util/util"


export const BytesScalar = new GraphQLScalarType({
    name: 'Bytes',
    description: 'Binary data encoded as a hex string always prefixed with 0x',
    serialize(value: string | Uint8Array) {
        if (typeof value == 'string') {
            if (!isHex(value)) throw invalidFormat('Bytes', value)
            return value.toLowerCase()
        } else {
            return toHex(value)
        }
    },
    parseValue(value: string) {
        return decodeHex(value)
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
