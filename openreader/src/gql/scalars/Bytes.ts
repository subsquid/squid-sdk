import {decodeHex, isHex} from "@subsquid/util-internal-hex"
import {GraphQLScalarType} from "graphql"
import {invalidFormat} from "../../util"


export const BytesScalar = new GraphQLScalarType({
    name: 'Bytes',
    description: 'Binary data encoded as a hex string always prefixed with 0x',
    serialize(value: string | Buffer) {
        if (typeof value == 'string') {
            if (!isHex(value)) throw invalidFormat('Bytes', value)
            return value.toLowerCase()
        } else {
            return '0x' + value.toString('hex')
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
