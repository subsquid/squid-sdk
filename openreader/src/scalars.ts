/**
 * The current concept of custom scalars is as follows:
 *
 * Each custom scalar has a canonical string representation which is used almost everywhere:
 *    in JSON responses
 *    in graphql queries/schemas
 *    in jsonb database columns
 *    in database results
 *
 * Database must support 2 way coercion between underlying database type and canonical representation
 * of a corresponding scalar.
 *
 * We receive from database canonical strings and use them within our resolvers as is.
 *
 * GraphQL parsing procedures convert canonical string representation to corresponding js type.
 * This is for compatibility with possible extensions which would like to reuse our scalars.
 *
 * In GraphQL serialization procedures we accept both a canonical string representation
 * and corresponding js type.
 */

import {IResolvers} from "@graphql-tools/utils"
import {GraphQLScalarType} from "graphql"


export interface Scalar {
    gql: GraphQLScalarType
    fromStringCast: (sqlExp: string) => string
    toStringCast: (sqlExp: string) => string
    toStringArrayCast: (sqlExp: string) => string
}


export const scalars: Record<string, Scalar> = {
    BigInt: {
        gql: new GraphQLScalarType({
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
        }),
        fromStringCast(exp) {
            return `(${exp})::numeric`
        },
        toStringCast(exp) {
            return `(${exp})::text`
        },
        toStringArrayCast(exp) {
            return `(${exp})::text[]`
        }
    },
    DateTime: {
        gql: new GraphQLScalarType({
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
        }),
        fromStringCast(exp) {
            return `(${exp})::timestamptz`
        },
        toStringCast(exp) {
            return `to_char((${exp}) at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`
        },
        toStringArrayCast(exp) {
            return `array(select to_char(i at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') from unnest(${exp}) as i)`
        }
    },
    Bytes: {
        gql: new GraphQLScalarType({
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
        }),
        fromStringCast(exp) {
            return `decode(substr(${exp}, 3), 'hex')`
        },
        toStringCast(exp) {
            return `'0x' || encode(${exp}, 'hex')`
        },
        toStringArrayCast(exp) {
            return `array(select '0x' || encode(i, 'hex') from unnest(${exp}) as i)`
        }
    }
}


function isBigInt(s: string): boolean {
    return /^[+\-]?\d+$/.test(s)
}


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


function isBytesString(s: string): boolean {
    return s.length % 2 == 0 && /^0x[a-f0-9]+$/i.test(s)
}


function parseBytes(s: string): Buffer {
    if (!isBytesString(s)) throw invalidFormat('Bytes', s)
    return Buffer.from(s.slice(2), 'hex')
}


function invalidFormat(type: string, value: string): Error {
    return new TypeError(`Not a ${type}: ${value}`)
}


export const scalars_list = ['ID'].concat(Object.keys(scalars))


export function getScalarResolvers(): IResolvers {
    let resolvers: IResolvers = {}
    for (let type in scalars) {
        resolvers[type] = scalars[type].gql
    }
    return resolvers
}


export function toOutputCast(scalarType: string, sqlExp: string): string {
    let s = scalars[scalarType]
    if (s) {
        return s.toStringCast(sqlExp)
    } else {
        return sqlExp
    }
}


export function fromStringCast(scalarType: string, sqlExp: string): string {
    let s = scalars[scalarType]
    if (s) {
        return s.fromStringCast(sqlExp)
    } else {
        return sqlExp
    }
}


export function toOutputArrayCast(scalarType: string, sqlExp: string): string {
    let s = scalars[scalarType]
    if (s) {
        return s.toStringArrayCast(sqlExp)
    } else {
        return sqlExp
    }
}


export function fromJsonCast(scalarType: string, objSqlExp: string, prop: string): string {
    switch(scalarType) {
        case 'Int':
            return `(${objSqlExp}->'${prop}')::integer`
        case 'Float':
            return `(${objSqlExp}->'${prop}')::numeric`
        case 'Boolean':
            return `(${objSqlExp}->'${prop}')::bool`
        default:
            return fromStringCast(scalarType, `${objSqlExp}->>'${prop}'`)
    }
}


export function fromJsonToOutputCast(scalarType: string, objSqlExp: string, prop: string) {
    switch(scalarType) {
        case 'Int':
            return `(${objSqlExp}->'${prop}')::integer`
        case 'Float':
            return `(${objSqlExp}->'${prop}')::numeric`
        case 'Boolean':
            return `(${objSqlExp}->'${prop}')::bool`
        default:
            return `${objSqlExp}->>'${prop}'`
    }
}
