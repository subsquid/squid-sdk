import {Logger, LogLevel} from '@subsquid/logger'
import {RpcClient, SubscriptionHandle} from '@subsquid/rpc-client'
import {AsyncQueue, ensureError, maybeLast, partitionBy, Throttler, wait} from '@subsquid/util-internal'
import {
    assertIsValid,
    Batch,
    BlockConsistencyError,
    BlockRef,
    ChainHeads,
    HashAndHeight,
    HotProcessor,
    HotState,
    HotUpdate, isDataConsistencyError,
    coldIngest
} from '@subsquid/util-internal-ingest-tools'
import {
    assertRangeList,
    getRequestAt,
    RangeRequestList,
    splitRange,
    splitRangeByRequest
} from '@subsquid/util-internal-range'
import {addTimeout, TimeoutError} from '@subsquid/util-timeout'
import assert from 'assert'
import {Fetch1} from './fetch1'
import {BlockData, BlockHeader, DataRequest, Hash} from './interfaces'
import {Rpc} from './rpc'
import {RuntimeVersionTracker} from './runtimeVersionTracker'
import {qty2Int} from './util'


export interface RpcDataSourceOptions {
    rpc: RpcClient
    headPollInterval?: number
    newHeadTimeout?: number
    finalityConfirmation?: number
    log?: Logger
}


export class RpcDataSource {
    public readonly rpc: Rpc
    private headPollInterval: number
    private newHeadTimeout: number
    private finalityConfirmation?: number
    private log?: Logger

    constructor(options: RpcDataSourceOptions) {
        this.rpc = new Rpc(options.rpc)
        this.headPollInterval = options.headPollInterval ?? 5000
        this.newHeadTimeout = options.newHeadTimeout ?? 0
        this.finalityConfirmation = options.finalityConfirmation
        this.log = options.log
    }

    async getFinalizedHeight(): Promise<number> {
        if (this.finalityConfirmation == null) {
            let head = await this.rpc.getFinalizedHead()
            let header = await this.rpc.getBlockHeader(head)
            assert(header, 'finalized blocks must be always available')
            return qty2Int(header.number)
        } else {
            let header = await this.rpc.getBlockHeader()
            assert(header, 'the header of the latest block on the chain must be always available')
            return Math.max(0, qty2Int(header.number) - this.finalityConfirmation)
        }
    }

    async *getFinalizedBlocks(requests: RangeRequestList<DataRequest>, stopOnHead?: boolean): AsyncIterable<Batch<BlockData>> {
        assertRangeList(requests.map(req => req.range))

        let runtimeVersionTracker = new RuntimeVersionTracker()

        let stream = coldIngest({
            getFinalizedHeight: () => this.getFinalizedHeight(),
            getSplit: req => {
                let fetch = new Fetch1(this.rpc.withPriority(req.range.from))
                return fetch.getColdSplit(req.range.from, req.range.to, req.request)
            },
            requests,
            concurrency: Math.min(5, this.rpc.client.getConcurrency()),
            splitSize: 10,
            stopOnHead,
            headPollInterval: this.headPollInterval
        })

        for await (let batch of stream) {
            let request = getRequestAt(requests, batch.blocks[0].height)
            if (request?.runtimeVersion) {
                await runtimeVersionTracker.addRuntimeVersion(this.rpc, batch.blocks)
                assertIsValid(batch.blocks)
            }
            yield batch
        }
    }

    async processHotBlocks(
        requests: RangeRequestList<DataRequest>,
        state: HotState,
        cb: (upd: HotUpdate<BlockData>) => Promise<void>
    ): Promise<void> {
        let runtimeVersionTracker = new RuntimeVersionTracker()
        let rpc = this.rpc
        let fetch = new Fetch1(rpc)

        let proc = new HotProcessor<BlockData>(state, {
            process: async upd => {
                for (let pack of partitionBy(upd.blocks, b => !!getRequestAt(requests, b.height)?.runtimeVersion)) {
                    if (pack.value) {
                        await runtimeVersionTracker.addRuntimeVersion(rpc, pack.items)
                    }
                }
                assertIsValid(upd.blocks)
                await cb(upd)
            },
            async getBlock(ref: HashAndHeight): Promise<BlockData> {
                let blocks = await fetch.getColdSplit(ref.height, ref, {
                    ...getRequestAt(requests, ref.height),
                    runtimeVersion: false
                })
                return blocks[0]
            },
            async *getBlockRange(from: number, to: BlockRef): AsyncIterable<BlockData[]> {
                let top: number
                let headBlock: BlockData | undefined
                if (to.height == null) {
                    headBlock = await fetch.getBlock0(to.hash, getRequestAt(requests, from) || {})
                    if (headBlock == null) throw new BlockConsistencyError(to)
                    top = headBlock.height
                } else {
                    top = to.height
                }
                if (top <= proc.getFinalizedHeight()) return
                if (from > top) {
                    from = top
                }
                for (let split of splitRangeByRequest(requests, {from, to: top})) {
                    for (let range of splitRange(10, split.range)) {
                        let blocks = await fetch.getHotSplit(
                            range.from,
                            range.to === headBlock?.height ? headBlock : range.to,
                            split.request || {}
                        )
                        let lastBlock = maybeLast(blocks)?.height ?? range.from - 1
                        yield blocks
                        if (lastBlock < range.to) {
                            throw new BlockConsistencyError({height: lastBlock + 1})
                        }
                    }
                }
            },
            getHeader(block: BlockData) {
                return {
                    height: block.height,
                    hash: block.hash,
                    parentHash: block.block.block.header.parentHash
                }
            },
            async getFinalizedBlockHeight(hash: Hash): Promise<number> {
                let header = await rpc.getBlockHeader(hash)
                assert(header, 'finalized blocks must be always available')
                return qty2Int(header.number)
            }
        })

        function isEnd(): boolean {
            return proc.getFinalizedHeight() >= (maybeLast(requests)?.range.to ?? Infinity)
        }

        if (this.rpc.client.supportsNotifications()) {
            await this.subscription(heads => proc.goto(heads), isEnd)
        } else {
            await this.polling(heads => proc.goto(heads), isEnd)
        }
    }

    private async polling(cb: (heads: ChainHeads) => Promise<void>, isEnd: () => boolean): Promise<void> {
        let headSrc = new Throttler(() => this.rpc.getHead(), this.headPollInterval)
        let prev = ''
        while (!isEnd()) {
            let head = await headSrc.call()
            if (head === prev) continue

            let finalizedHead: string | null = null
            if (this.finalityConfirmation == null) {
                finalizedHead = await this.rpc.getFinalizedHead()
            } else {
                let attempt = 0
                while (attempt < 5) {
                    let header = await this.rpc.getBlockHeader(head)
                    if (header != null) {
                        let finalizedHeight = qty2Int(header.number) - this.finalityConfirmation
                        finalizedHead = await this.rpc.getBlockHash(finalizedHeight)
                        if (finalizedHead != null) break
                    }

                    head = await this.rpc.getHead()
                    attempt += 1
                }
                assert(finalizedHead != null, `failed to get finalized head after ${attempt} attempts`)
            }
            await this.handleNewHeads({
                best: {hash: head},
                finalized: {hash: finalizedHead}
            }, cb)
        }
    }

    private async subscription(cb: (heads: ChainHeads) => Promise<void>, isEnd: () => boolean): Promise<void> {
        let finalityConfirmation = this.finalityConfirmation
        let queue = new AsyncQueue<number | Error>(1)
        let finalizedHeight = 0
        let prevHeight = 0

        let finalizedHeadsHandle: SubscriptionHandle | undefined
        if (finalityConfirmation == null) {
            finalizedHeadsHandle = this.rpc.client.subscribe<BlockHeader>({
                method: 'chain_subscribeFinalizedHeads',
                unsubscribe: 'chain_unsubscribeFinalizedHeads',
                notification: 'chain_finalizedHead',
                onMessage(head: BlockHeader) {
                    try {
                        let height = qty2Int(head.number)
                        finalizedHeight = Math.max(finalizedHeight, height)
                    } catch(err: any) {
                        close(err)
                    }
                },
                onError(err: Error) {
                    close(ensureError(err))
                },
                resubscribeOnConnectionLoss: true
            })
        }

        let newHeadsHandle = this.rpc.client.subscribe<BlockHeader>({
            method: 'chain_subscribeNewHeads',
            unsubscribe: 'chain_unsubscribeNewHeads',
            notification: 'chain_newHead',
            onMessage(head: BlockHeader) {
                try {
                    let height = qty2Int(head.number)
                    if (height >= prevHeight) {
                        prevHeight = height
                        if (finalityConfirmation != null) {
                            finalizedHeight = Math.max(0, height - finalityConfirmation)
                        }
                        queue.forcePut(height)
                    }
                } catch(err: any) {
                    close(err)
                }
            },
            onError(err: Error) {
                close(ensureError(err))
            },
            resubscribeOnConnectionLoss: true
        })

        function close(err?: Error) {
            newHeadsHandle.close()
            finalizedHeadsHandle?.close()
            if (err) {
                queue.forcePut(err)
            }
            queue.close()
        }

        try {
            while (!isEnd()) {
                let height = await addTimeout(queue.take(), this.newHeadTimeout).catch(ensureError)
                if (height instanceof TimeoutError) {
                    this.log?.warn(`resetting RPC connection, because we haven't seen a new head for ${this.newHeadTimeout} ms`)
                    this.rpc.client.reset()
                } else if (height instanceof Error) {
                    throw height
                } else {
                    assert(height != null)
                    let hash = await this.rpc.getBlockHash(height)
                    if (hash) {
                        await this.handleNewHeads({
                            best: {height, hash},
                            finalized: {height: finalizedHeight}
                        }, cb)
                    }
                }
            }
        } finally {
            close()
        }
    }

    private async handleNewHeads(heads: ChainHeads, cb: (heads: ChainHeads) => Promise<void>): Promise<void> {
        for (let i = 0; i < 3; i++) {
            try {
                return await cb(heads)
            } catch(err: any) {
                if (isDataConsistencyError(err)) {
                    this.log?.write(
                        i > 0 ? LogLevel.WARN : LogLevel.DEBUG,
                        err.message
                    )
                    await wait(100)
                } else {
                    throw err
                }
            }
        }
    }
}
