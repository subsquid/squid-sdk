import {GraphQLScalarType} from "graphql"
import {invalidFormat} from "../util/util"


export const DateTimeScalar = new GraphQLScalarType({
    name: 'DateTime',
    description:
        'A date-time string in simplified extended ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
    serialize(value: Date | string) {
        if (value instanceof Date) {
            return value.toISOString()
        } else {
            if (!isIsoDateTimeString(value)) throw invalidFormat('DateTime', value)
            return value
        }
    },
    parseValue(value: string) {
        return parseDateTime(value)
    },
    parseLiteral(ast) {
        switch(ast.kind) {
            case "StringValue":
                return parseDateTime(ast.value)
            default:
                return null
        }
    }
})


// credit - https://github.com/Urigo/graphql-scalars/blob/91b4ea8df891be8af7904cf84751930cc0c6613d/src/scalars/iso-date/validator.ts#L122
const RFC_3339_REGEX = /^(\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60))(\.\d{1,})?([Z])$/


function isIsoDateTimeString(s: string): boolean {
    return RFC_3339_REGEX.test(s)
}


function parseDateTime(s: string): Date {
    if (!isIsoDateTimeString(s)) throw invalidFormat('DateTime', s)
    let timestamp = Date.parse(s)
    if (isNaN(timestamp)) throw invalidFormat('DateTime', s)
    return new Date(timestamp)
}
