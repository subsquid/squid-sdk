import {OrderBy, Where} from './args'


export interface RelayConnectionRequest<R> {
    orderBy: OrderBy
    where?: Where
    first?: number
    after?: string
    edgeNode?: R
    edgeCursor?: boolean
    pageInfo?: boolean
    totalCount?: boolean
}


export interface RelayConnectionResponse {
    edges?: RelayConnectionEdge[]
    pageInfo?: Partial<RelayConnectionPageInfo>
    totalCount?: number
}


export interface RelayConnectionEdge {
    node?: unknown
    cursor?: string
}


export interface RelayConnectionPageInfo {
    hasNextPage: boolean
    hasPreviousPage: boolean
    startCursor: string
    endCursor: string
}


export function decodeRelayConnectionCursor(cursor: string): number | undefined {
    if (!/^\d+$/.test(cursor)) return undefined
    let val = parseInt(cursor, 10)
    if (Number.isSafeInteger(val) && val > 0) return val
    return undefined
}


export function encodeRelayConnectionCursor(val: number): string {
    return '' + val
}
