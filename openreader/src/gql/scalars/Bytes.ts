import {GraphQLScalarType} from "graphql"
import {invalidFormat} from "../../util"


export const BytesScalar = new GraphQLScalarType({
    name: 'Bytes',
    description: 'Binary data encoded as a hex string always prefixed with 0x',
    serialize(value: string | Buffer) {
        if (typeof value == 'string') {
            if (!isBytesString(value)) throw invalidFormat('Bytes', value)
            return value.toLowerCase()
        } else {
            return '0x' + value.toString('hex')
        }
    },
    parseValue(value: string) {
        return parseBytes(value)
    },
    parseLiteral(ast) {
        switch(ast.kind) {
            case "StringValue":
                return parseBytes(ast.value)
            default:
                return null
        }
    }
})


function isBytesString(s: string): boolean {
    return s.length % 2 == 0 && /^0x[a-f0-9]*$/i.test(s)
}


function parseBytes(s: string): Buffer {
    if (!isBytesString(s)) throw invalidFormat('Bytes', s)
    return Buffer.from(s.slice(2), 'hex')
}
