import {toSnakeCase} from "@subsquid/util-naming"
import assert from "assert"
import {Prop} from "../model"


/**
 * PostgreSQL truncates any identifier longer than `NAMEDATALEN - 1` (63 bytes on
 * a default build) when it is stored in the catalog. `@subsquid/typeorm-codegen`
 * prunes over-long table names to this limit when generating the schema, so the
 * physical table is created with at most this many bytes.
 *
 * We must apply the *same* truncation when building queries, otherwise on a
 * server whose `NAMEDATALEN` is larger than the default we would emit the full,
 * untruncated name — which Postgres would not truncate — and it would miss the
 * (already-pruned) table. Truncating here makes the generated SQL target the
 * right table regardless of the server's `NAMEDATALEN`.
 *
 * GraphQL type names are restricted to ASCII letters, digits and underscores,
 * and `toSnakeCase` keeps them ASCII, so `name.length` below equals the byte
 * length — the unit PostgreSQL's limit is actually measured in.
 *
 * Keep this value in sync with `typeorm-codegen`'s `POSTGRES_MAX_IDENTIFIER_LENGTH`.
 */
export const POSTGRES_MAX_IDENTIFIER_LENGTH = 63


function truncateIdentifier(name: string): string {
    return name.length > POSTGRES_MAX_IDENTIFIER_LENGTH
        ? name.slice(0, POSTGRES_MAX_IDENTIFIER_LENGTH)
        : name
}


export function toColumn(gqlFieldName: string): string {
    return toSnakeCase(gqlFieldName)
}


export function toFkColumn(gqlFieldName: string): string {
    return toSnakeCase(gqlFieldName) + '_id'
}


export function toTable(entityName: string): string {
    return truncateIdentifier(toSnakeCase(entityName))
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
