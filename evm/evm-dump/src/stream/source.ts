import type {RawBlock} from '@subsquid/evm-normalization'
import type {Logger} from '@subsquid/logger'
import {last, wait} from '@subsquid/util-internal'
import {checkShorHashMatch, type Range} from '@subsquid/util-internal-dump-cli'
import type {ComponentsRule} from './components'
import type {BlockLink, MissReason, StreamMessage} from './message'
import type {LineVerifier} from './verify'
import {type DirectGet, walk, type WalkedBlock, type WalkMiss} from './walk'

const FULL_HASH_LENGTH = 66
const PUBLICATION_POLL_INTERVAL = 1000
export const DEFAULT_STREAM_WAIT_TIMEOUT = 600_000

export interface RpcBatch {
    blocks: RawBlock[]
    /**
     * Number of the finalized head at the time the batch was fetched
     */
    finalizedHead?: number
}

export interface RpcSource {
    getFinalizedHead(): Promise<BlockLink>
    /**
     * Hash of a finalized block
     */
    getBlockHash(number: number): Promise<string | undefined>
    /**
     * Finalized blocks of the range. An open ended range follows the finalized head and never ends.
     */
    getBlocks(range: {from: number; to?: number}, parentHash?: string): AsyncIterable<RpcBatch>
}

export interface StreamConnection {
    get: DirectGet
    isClosed(): boolean
    close(): Promise<void>
}

export interface StreamMetrics {
    blocks(source: 'stream' | 'rpc', count: number): void
    miss(reason: MissReason): void
}

export interface RawStreamSourceOptions {
    rpc: RpcSource
    /**
     * Must give up on its own, the source puts no timeout on it
     */
    connect: () => Promise<StreamConnection>
    rule: ComponentsRule
    /**
     * Called once per walk
     */
    getVerifier: () => Promise<LineVerifier>
    headPollInterval: number
    /**
     * Max number of blocks taken by a single walk
     */
    walkSize?: number
    /**
     * Max number of bytes of decompressed lines a walk keeps parsed
     */
    parsedBudget?: number
    /**
     * Max number of bytes of compressed payloads a walk holds. Walks are sized to fit it.
     */
    payloadBudget?: number
    batchSize?: number
    /**
     * How long to leave the stream alone after it has failed to give a block, in ms
     */
    retryInterval?: number
    /**
     * How long to wait for a missing finalized head to be published, in ms. Zero disables waiting.
     */
    waitTimeout?: number
    metrics?: StreamMetrics
    log?: Logger
}

interface Cursor {
    next: number
    /**
     * Hash of the block below `next`. Only the one given at the start can be short.
     */
    parentHash?: string
}

/**
 * Takes finalized blocks from a stream of raw blocks and everything the stream can't give from RPC.
 *
 * The stream is a cache nobody vouches for. The only thing trusted is the finalized head from RPC,
 * a block is taken from the stream when it is proven to be an ancestor of that head.
 */
export class RawStreamSource {
    private rpc: RpcSource
    private connect: () => Promise<StreamConnection>
    private rule: ComponentsRule
    private getVerifier: () => Promise<LineVerifier>
    private headPollInterval: number
    private walkSize: number
    private parsedBudget: number
    private payloadBudget: number
    private payloadPerBlock?: number
    private batchSize: number
    private retryInterval: number
    private waitTimeout: number
    private retryAt = 0
    private metrics?: StreamMetrics
    private log?: Logger
    private connection?: StreamConnection
    private isStreamDown = false
    private reportedDistrust = new Set<MissReason>()

    constructor(options: RawStreamSourceOptions) {
        this.rpc = options.rpc
        this.connect = options.connect
        this.rule = options.rule
        this.getVerifier = options.getVerifier
        this.headPollInterval = options.headPollInterval
        this.walkSize = Math.max(1, options.walkSize ?? 256)
        this.parsedBudget = options.parsedBudget ?? 134_217_728 // 128 MiB
        this.payloadBudget = Math.max(1, options.payloadBudget ?? 67_108_864) // 64 MiB
        this.batchSize = Math.max(1, options.batchSize ?? 10)
        this.retryInterval = options.retryInterval ?? 10_000
        this.waitTimeout = Math.max(0, options.waitTimeout ?? DEFAULT_STREAM_WAIT_TIMEOUT)
        this.metrics = options.metrics
        this.log = options.log
    }

    async *getBlocks(range: Range, prevHash?: string): AsyncIterable<RawBlock[]> {
        let end = range.to ?? Number.POSITIVE_INFINITY

        let cursor: Cursor = {
            next: range.from,
            parentHash: prevHash?.toLowerCase(),
        }

        try {
            while (cursor.next <= end) {
                let isLeftAlone = Date.now() < this.retryAt
                if (isLeftAlone) {
                    this.miss({number: cursor.next, reason: 'error', details: 'the stream has failed recently'})
                    yield* this.rpcBlocks(cursor, range.to, true)
                    continue
                }

                let head = await this.rpc.getFinalizedHead()
                if (head.number < cursor.next) {
                    await wait(this.headPollInterval)
                    continue
                }

                let top = Math.min(head.number, end, cursor.next + this.getWalkSize() - 1)
                let walked = await this.walk(cursor.next, top, head)

                if (walked.length == 0) {
                    yield* this.rpcBlocks(cursor, range.to, true)
                    continue
                }

                let streamFrom = walked[0].number
                if (cursor.next < streamFrom) {
                    yield* this.rpcBlocks(cursor, streamFrom - 1, false)
                }

                // Covers both the block archived before this run and the seam with the blocks RPC has just given
                let isLinked = cursor.parentHash == null || checkShorHashMatch(walked[0].parentHash, cursor.parentHash)
                if (isLinked) {
                    yield* this.streamBlocks(cursor, walked)
                } else {
                    this.miss({number: streamFrom, reason: 'link'})
                    yield* this.rpcBlocks(cursor, range.to, true)
                }
            }
        } finally {
            this.dropConnection()
        }
    }

    /**
     * With `untilStreamIsBack` RPC is left once it has caught up with the finalized head and the stream
     * is seen to have the block RPC has just given. Until then it is a single RPC stream:
     * every new one fetches up to the head on its own and what it has fetched ahead is lost when it is left.
     */
    private async *rpcBlocks(
        cursor: Cursor,
        to: number | undefined,
        untilStreamIsBack: boolean,
    ): AsyncIterable<RawBlock[]> {
        if (untilStreamIsBack) {
            this.retryAt = Math.max(this.retryAt, Date.now() + this.retryInterval)
        }

        let isFullHash = cursor.parentHash?.length == FULL_HASH_LENGTH
        let parentHash = isFullHash ? cursor.parentHash : undefined

        let batches = this.rpc.getBlocks({from: cursor.next, to}, parentHash)[Symbol.asyncIterator]()
        try {
            while (true) {
                let res = await batches.next()
                if (res.done) return

                let {blocks, finalizedHead} = res.value
                if (blocks.length == 0) continue

                let head = last(blocks)
                let headNumber = Number(head.number)

                cursor.next = headNumber + 1
                cursor.parentHash = head.hash

                this.metrics?.blocks('rpc', blocks.length)
                yield blocks

                let isCaughtUp = finalizedHead != null && headNumber >= finalizedHead
                let isRangeOver = to != null && headNumber >= to
                let isStreamLeftAlone = Date.now() < this.retryAt
                let isProbeDue = untilStreamIsBack && isCaughtUp && !isRangeOver && !isStreamLeftAlone
                if (!isProbeDue) continue

                // The ask can wait for the block to be published, so blocks already in hand go out first.
                // What RPC fetches ahead meanwhile is lost when it is left, which is the cheaper loss.
                let isStreamBack = await this.hasBlock({number: headNumber, hash: head.hash})
                if (isStreamBack) return
            }
        } finally {
            await batches.return?.()
        }
    }

    private *streamBlocks(cursor: Cursor, walked: WalkedBlock[]): Iterable<RawBlock[]> {
        for (let i = 0; i < walked.length; i += this.batchSize) {
            let batch = walked.slice(i, i + this.batchSize)
            let blocks = batch.map((b) => b.getBlock())

            this.metrics?.blocks('stream', blocks.length)
            yield blocks

            let head = last(batch)
            cursor.next = head.number + 1
            cursor.parentHash = head.hash
        }
    }

    private async hasBlock(block: BlockLink): Promise<boolean> {
        let walked = await this.walk(block.number, block.number, block)

        let isThere = walked.length > 0
        if (!isThere) {
            this.retryAt = Date.now() + this.retryInterval
        }

        return isThere
    }

    /**
     * How many blocks the next walk may ask for, at the weight the last one has shown.
     * A walk that still comes out too heavy stops on its own budget.
     */
    private getWalkSize(): number {
        if (this.payloadPerBlock == null) return this.walkSize

        let fit = Math.floor(this.payloadBudget / this.payloadPerBlock)
        return Math.max(1, Math.min(this.walkSize, fit))
    }

    private async walk(from: number, top: number, head: BlockLink): Promise<WalkedBlock[]> {
        let connection = await this.getConnection()
        if (connection == null) return []

        let topHash = top == head.number ? head.hash : await this.rpc.getBlockHash(top)
        if (topHash == null) {
            this.miss({number: top, reason: 'error', details: 'RPC gave no hash to start from'})
            return []
        }

        let res = await walk({
            get: (block) =>
                block.number === head.number ? this.getPublishedBlock(connection.get, block) : connection.get(block),
            rule: this.rule,
            verify: await this.getVerifier(),
            top: {
                number: top,
                hash: topHash.toLowerCase(),
            },
            from,
            parsedBudget: this.parsedBudget,
            payloadBudget: this.payloadBudget,
        })

        if (res.blocks.length > 0) {
            this.payloadPerBlock = res.bytes / res.blocks.length
        }

        let isTransportFailure = res.miss?.reason == 'timeout' || res.miss?.reason == 'error'
        if (isTransportFailure) {
            this.markStreamDown(res.miss?.error)
            this.dropConnection()
            this.retryAt = Date.now() + this.retryInterval
        } else {
            // A connection alone proves nothing: a stream that is absent or has no direct access fails every request
            this.markStreamUp()
        }

        if (res.miss) {
            this.miss(res.miss)
        }

        return res.blocks
    }

    private async getPublishedBlock(get: DirectGet, block: BlockLink): Promise<StreamMessage | undefined> {
        let deadline = Date.now() + this.waitTimeout
        let message = await get(block)

        // Keep the same RPC anchor while the publisher catches up, even if the chain head advances.
        while (message === undefined) {
            let remaining = deadline - Date.now()
            if (remaining <= 0) break

            await wait(Math.min(PUBLICATION_POLL_INTERVAL, remaining))
            message = await get(block)
        }

        return message
    }

    private async getConnection(): Promise<StreamConnection | undefined> {
        if (this.connection?.isClosed()) {
            this.connection = undefined
        }

        if (this.connection) return this.connection

        try {
            this.connection = await this.connect()
        } catch (err: any) {
            this.metrics?.miss(err?.name == 'TimeoutError' ? 'timeout' : 'error')
            this.markStreamDown(err)
            return undefined
        }

        return this.connection
    }

    private dropConnection(): void {
        let connection = this.connection
        if (connection == null) return

        this.connection = undefined
        connection.close().catch((err) => this.log?.debug(err, 'failed to close the block stream connection'))
    }

    private markStreamDown(err: unknown): void {
        if (this.isStreamDown) return

        this.isStreamDown = true
        this.log?.warn(err as Error, 'block stream is not available, falling back to RPC')
    }

    private markStreamUp(): void {
        if (!this.isStreamDown) return

        this.isStreamDown = false
        this.log?.info('block stream is available again')
    }

    private miss(miss: WalkMiss): void {
        this.metrics?.miss(miss.reason)

        let details = miss.details == null ? '' : ` (${miss.details})`
        let message = `block ${miss.number} and what is below it go to RPC, stream miss: ${miss.reason}${details}`

        // A block that fails a check is either forged or of a chain this reader can't verify, both are worth knowing
        let isDistrusted = miss.reason == 'hash' || miss.reason == 'verify'
        if (isDistrusted && !this.reportedDistrust.has(miss.reason)) {
            this.reportedDistrust.add(miss.reason)
            this.log?.warn(`${message}. Further misses of this kind are logged at the debug level`)
        } else {
            this.log?.debug(message)
        }
    }
}
