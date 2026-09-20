import type {RawBlock} from '@subsquid/evm-normalization'
import zlib from 'zlib'
import {type ComponentsRule, matchComponents} from './components'

export const RAW_LINE_SCHEMA = 'evm-raw-line-zstd/1'

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

/**
 * Message headers tell, whether the message is what was asked for and where the chain goes next.
 *
 * Nothing here is trusted: `readLine()` checks the payload against the headers,
 * and the payload itself is only as good as the header hash recomputed from it.
 */
export function readHeaders(
    msg: StreamMessage,
    expected: BlockLink,
    rule: ComponentsRule,
): {parent: BlockLink} | {miss: MissReason} {
    if (msg.headers.get('schema') !== RAW_LINE_SCHEMA) return {miss: 'schema'}

    let components = msg.headers.get('components')
    if (components == null || !matchComponents(components, rule)) return {miss: 'components'}

    let hash = msg.headers.get('hash')
    if (hash !== expected.hash) return {miss: 'link'}

    let parentHash = msg.headers.get('parent_hash')
    if (parentHash == null || !isHash(parentHash)) return {miss: 'link'}

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

export function readLine(
    msg: StreamMessage,
    expected: BlockLink,
    parentHash: string,
    maxLineSize = MAX_LINE_SIZE,
): {block: RawBlock; size: number} | {miss: MissReason} {
    if (msg.headers.get('payload_crc32') !== getPayloadCrc(msg.data)) return {miss: 'crc'}

    let block: RawBlock
    let size: number
    try {
        let line = zlib.zstdDecompressSync(msg.data, {maxOutputLength: maxLineSize})
        size = line.length
        block = JSON.parse(line.toString('utf-8'))
    } catch (err: any) {
        return {miss: 'parse'}
    }

    if (block == null || typeof block != 'object') return {miss: 'parse'}

    if (block.hash !== expected.hash) return {miss: 'link'}
    if (typeof block.number != 'string' || Number(block.number) !== expected.number) return {miss: 'link'}
    if (block.parentHash !== parentHash) return {miss: 'link'}

    return {block, size}
}

export function getPayloadCrc(payload: Uint8Array): string {
    return zlib.crc32(payload).toString(16).padStart(8, '0')
}

function isHash(value: string): boolean {
    return /^0x[0-9a-f]+$/.test(value)
}
