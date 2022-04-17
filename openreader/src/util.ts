import {toCamelCase, toPlural, toSnakeCase} from "@subsquid/util"
import assert from "assert"


export function toQueryListField(entityName: string): string {
    return toPlural(toCamelCase(entityName))
}


export function toColumn(gqlFieldName: string): string {
    return toSnakeCase(gqlFieldName)
}


export function toFkColumn(gqlFieldName: string): string {
    return toSnakeCase(gqlFieldName) + '_id'
}


export function toTable(entityName: string): string {
    return toSnakeCase(entityName)
}


export function ensureArray<T>(item: T | T[]): T[] {
    return Array.isArray(item) ? item : [item]
}


export function unsupportedCase(value: string): Error {
    return new Error(`Unsupported case: ${value}`)
}


export function toInt(val: number | string): number {
    let i = parseInt(val as string)
    assert(!isNaN(i) && isFinite(i))
    return i
}


export function invalidFormat(type: string, value: string): Error {
    return new TypeError(`Not a ${type}: ${value}`)
}
