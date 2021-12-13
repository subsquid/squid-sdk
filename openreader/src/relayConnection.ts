import {UserInputError} from "apollo-server-core"


export interface PageInfo {
    hasNextPage: boolean
    hasPreviousPage: boolean
    startCursor: string
    endCursor: string
}


export interface ConnectionEdge<T> {
    node?: T
    cursor?: string
}


export interface ConnectionResponse<T> {
    edges?: ConnectionEdge<T>[]
    pageInfo?: PageInfo
}


/**
 * Offset value for SQL query
 */
export type Cursor = number


export function encodeCursor(cursor: Cursor): string {
    return ''+cursor
}


export function decodeCursor(value: string): Cursor {
    let cursor = parseInt(value)
    if (isFinite(cursor) && cursor >= 0) {
        return cursor
    } else {
        throw new InvalidCursorValue(value)
    }
}


export class InvalidCursorValue extends UserInputError {
    constructor(value: string) {
        super(`invalid cursor value: ${value}`)
    }
}


export interface ConnectionArgs {
    first?: number
    after?: string
}


export interface ConnectionParams {
    offset: number
    limit: number
}


/**
 * https://relay.dev/assets/files/connections-932f4f2cdffd79724ac76373deb30dc8.htm#sec-Pagination-algorithm
 */
export function decodeConnectionArgs(args: ConnectionArgs): ConnectionParams {
    let offset = 0
    let limit = 100
    if (args.after) {
        offset = decodeCursor(args.after)
    }
    if (args.first != null) {
        if (args.first < 0) {
            throw new UserInputError("'first' argument of connection can't be less than 0")
        }
        limit = args.first
    }
    return {offset, limit}
}
