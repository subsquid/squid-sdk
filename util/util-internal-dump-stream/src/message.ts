import zlib from 'node:zlib'
import {type ComponentsRule, matchComponents} from './components'

// Payloads are limited to 8 MiB by the publisher and a line compresses up to 30 times.
// A bigger line is a decompression bomb, that would be inflated again on every attempt to take the block.
export const MAX_LINE_SIZE = 268_435_456 // 256 MiB

export interface StreamMessage {
    headers: {
        get(name: string): string | undefined
    }
    data: Uint8Array
}

export type MissReason =
    | 'not_found'
    | 'schema'
    | 'components'
    | 'crc'
    | 'link'
    | 'parse'
    | 'hash'
    | 'verify'
    | 'timeout'
    | 'error'

export const MISS_REASONS: readonly MissReason[] = [
    'not_found',
    'schema',
    'components',
    'crc',
    'link',
    'parse',
    'hash',
    'verify',
    'timeout',
    'error',
]

export interface BlockLink {
    number: number
    hash: string
}

export interface BlockRef extends BlockLink {
    parentHash: string
}

/**
 * What a chain tells about the lines of its stream
 */
export interface LineFormat<B> {
    /**
     * The `schema` header of the lines the dumper takes
     */
    schema: string
    rule: ComponentsRule
    /**
     * Whether a header value is a well formed block hash.
     * A parent hash goes into the subject of the next request, so a `.`, `*` or `>` must not pass.
     */
    isHash(value: string): boolean
    /**
     * Brings a hash given by RPC or by the archive to the form the stream uses. Hashes are taken as they are by default.
     */
    normalizeHash?(hash: string): string
    /**
     * Where a decoded line says it is, `undefined` when it does not say
     */
    getRef(block: B): BlockRef | undefined
}

/**
 * Message headers tell, whether the message is what was asked for and where the chain goes next.
 *
 * Nothing here is trusted: `readLine()` checks the payload against the headers,
 * and the payload itself is only as good as the header hash recomputed from it.
 */
export function readHeaders<B>(
    msg: StreamMessage,
    expected: BlockLink,
    format: LineFormat<B>,
): {parent: BlockLink} | {miss: MissReason} {
    if (msg.headers.get('schema') !== format.schema) return {miss: 'schema'}

    let components = msg.headers.get('components')
    if (components == null || !matchComponents(components, format.rule)) return {miss: 'components'}

    let hash = msg.headers.get('hash')
    if (hash !== expected.hash) return {miss: 'link'}

    let parentHash = msg.headers.get('parent_hash')
    if (parentHash == null || !format.isHash(parentHash)) return {miss: 'link'}

    let parentNumber = msg.headers.get('parent_number')
    let hasParent = expected.number > 0
    if (hasParent && parentNumber !== String(expected.number - 1)) return {miss: 'link'}

    return {
        parent: {
            number: expected.number - 1,
            hash: parentHash,
        },
    }
}

export function readLine<B>(
    msg: StreamMessage,
    expected: BlockLink,
    parentHash: string,
    format: LineFormat<B>,
    maxLineSize = MAX_LINE_SIZE,
): {block: B; size: number} | {miss: MissReason} {
    if (msg.headers.get('payload_crc32') !== getPayloadCrc(msg.data)) return {miss: 'crc'}

    let block: B
    let size: number
    try {
        let line = zlib.zstdDecompressSync(msg.data, {maxOutputLength: maxLineSize})
        size = line.length
        block = JSON.parse(line.toString('utf-8'))
    } catch (err: any) {
        return {miss: 'parse'}
    }

    if (block == null || typeof block != 'object') return {miss: 'parse'}

    let ref = format.getRef(block)
    if (ref == null) return {miss: 'link'}

    if (ref.hash !== expected.hash) return {miss: 'link'}
    if (ref.number !== expected.number) return {miss: 'link'}
    if (ref.parentHash !== parentHash) return {miss: 'link'}

    return {block, size}
}

export function getPayloadCrc(payload: Uint8Array): string {
    return zlib.crc32(payload).toString(16).padStart(8, '0')
}
