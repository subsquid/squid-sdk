import {toSnakeCase} from "@subsquid/util-naming"
import assert from "assert"


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


export function toSafeInteger(s: number | string): number {
    let i = parseInt(s as string, 10)
    assert(Number.isSafeInteger(i))
    return i
}


export function invalidFormat(type: string, value: string): Error {
    return new TypeError(`Not a ${type}: ${value}`)
}


export function identity<T>(x: T): T {
    return x
}
