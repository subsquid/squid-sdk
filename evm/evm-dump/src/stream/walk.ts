import type {RawBlock} from '@subsquid/evm-normalization'
import assert from 'assert'
import type {ComponentsRule} from './components'
import {type BlockLink, type MissReason, readHeaders, readLine, type StreamMessage} from './message'
import type {LineVerifier} from './verify'

/**
 * Fetches a block body by its number and hash. Resolves to `undefined`, when the stream has no such block.
 *
 * A rejection named `TimeoutError` is a timeout, any other is a transport failure.
 */
export type DirectGet = (block: BlockLink) => Promise<StreamMessage | undefined>

export interface WalkRequest {
    get: DirectGet
    rule: ComponentsRule
    verify: LineVerifier
    /**
     * The block to start from, its hash is the only one trusted upfront
     */
    top: BlockLink
    /**
     * The lowest block to take
     */
    from: number
    /**
     * How many bytes of decompressed lines to keep parsed. Above that only the compressed payload is kept.
     */
    parsedBudget: number
    /**
     * How many bytes of compressed payloads to hold before the walk stops short of its bottom.
     * A walk is held whole, so this is the only bound on what it costs in memory.
     */
    payloadBudget: number
}

export class WalkedBlock {
    constructor(
        public readonly number: number,
        public readonly hash: string,
        public readonly parentHash: string,
        private msg: StreamMessage,
        private block?: RawBlock,
    ) {}

    getBlock(): RawBlock {
        if (this.block) return this.block

        let line = readLine(this.msg, this, this.parentHash)
        assert('block' in line, 'an already verified payload must stay readable')
        return line.block
    }
}

export interface WalkResult {
    /**
     * Verified blocks in ascending order, always ending at the top of the walk
     */
    blocks: WalkedBlock[]
    /**
     * Where and why the walk has stopped before reaching its bottom
     */
    miss?: WalkMiss
    /**
     * Bytes of compressed payloads the returned blocks hold
     */
    bytes: number
}

export interface WalkMiss {
    number: number
    reason: MissReason
    /**
     * What a failed check has found
     */
    details?: string
    /**
     * What the transport has failed with
     */
    error?: unknown
}

type GetResult = {msg: StreamMessage} | {miss: MissReason; error?: unknown}

/**
 * Takes blocks from `req.top` down the parent links to `req.from`.
 *
 * A block is taken only when its header hashes to the hash it was asked by, which makes its parent hash
 * as trusted as its own. The walk stops at the first block that is absent or fails a check,
 * and short of its bottom when the payloads it holds fill `req.payloadBudget`.
 * Whether the bottom block links to what lies below the range is for the caller to check.
 */
export async function walk(req: WalkRequest): Promise<WalkResult> {
    let descending: WalkedBlock[] = []
    let miss: WalkResult['miss']
    let parsedSize = 0
    let payloadSize = 0

    let expected = req.top
    let pending = getMessage(req.get, expected)

    while (true) {
        let res = await pending
        if ('miss' in res) {
            miss = {number: expected.number, reason: res.miss, error: res.error}
            break
        }

        let headers = readHeaders(res.msg, expected, req.rule)
        if ('miss' in headers) {
            miss = {number: expected.number, reason: headers.miss}
            break
        }

        let parent = headers.parent
        let isBottom = expected.number <= req.from

        // The parent link is confirmed only by the checks below,
        // asking for the parent already lets the request fly while the line is being checked.
        if (!isBottom) {
            pending = getMessage(req.get, parent)
        }

        let line = readLine(res.msg, expected, parent.hash)
        if ('miss' in line) {
            miss = {number: expected.number, reason: line.miss}
            break
        }

        let defect = await req.verify(line.block, expected)
        if (defect) {
            miss = {number: expected.number, ...defect}
            break
        }

        let keepParsed = parsedSize + line.size <= req.parsedBudget
        if (keepParsed) {
            parsedSize += line.size
        }

        payloadSize += res.msg.data.length

        descending.push(
            new WalkedBlock(expected.number, expected.hash, parent.hash, res.msg, keepParsed ? line.block : undefined),
        )

        let isBudgetSpent = payloadSize >= req.payloadBudget
        if (isBottom || isBudgetSpent) break

        expected = parent
    }

    return {
        blocks: descending.reverse(),
        miss,
        bytes: payloadSize,
    }
}

// Never rejects, so an abandoned request can't end up as an unhandled rejection
async function getMessage(get: DirectGet, block: BlockLink): Promise<GetResult> {
    try {
        let msg = await get(block)
        return msg == null ? {miss: 'not_found'} : {msg}
    } catch (err: any) {
        let reason: MissReason = err?.name == 'TimeoutError' ? 'timeout' : 'error'
        return {miss: reason, error: err}
    }
}
