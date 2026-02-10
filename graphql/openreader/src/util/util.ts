import {toSnakeCase} from "@subsquid/util-naming"
import assert from "assert"
import {Prop} from "../model"


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


export function toFkIdField(fkFieldName: string): string {
    return fkFieldName + 'Id'
}


export function getFkPropByIdField(
    idFieldName: string,
    properties: Record<string, Prop>
): Prop | undefined {
    if (!idFieldName.endsWith('Id')) return undefined
    let fkProp = properties[idFieldName.slice(0, -2)]
    return fkProp?.type.kind == 'fk' ? fkProp : undefined
}
