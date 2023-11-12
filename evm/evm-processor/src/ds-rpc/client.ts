import {Logger, LogLevel} from '@subsquid/logger'
import {RpcClient, RpcError} from '@subsquid/rpc-client'
import {AsyncQueue, ensureError, last, maybeLast, Throttler, wait} from '@subsquid/util-internal'
import {BlockHeader as Head, HashAndHeight, HotProcessor, rpcIngest} from '@subsquid/util-internal-ingest-tools'
import {Batch, HotDatabaseState, HotDataSource, HotUpdate} from '@subsquid/util-internal-processor-tools'
import {
    getRequestAt,
    RangeRequest,
    RangeRequestList,
    splitRange,
    splitRangeByRequest,
    SplitRequest
} from '@subsquid/util-internal-range'
import {addTimeout, TimeoutError} from '@subsquid/util-timeout'
import assert from 'assert'
import {Bytes32} from '../interfaces/base'
import {AllFields, BlockData} from '../interfaces/data'
import {DataRequest} from '../interfaces/data-request'
import {mapBlock, MappingRequest, toMappingRequest} from './mapping'
import {BlockConsistencyError, ConsistencyError, Rpc} from './rpc'
import {qty2Int} from './util'


type Block = BlockData<AllFields>


export interface EvmRpcDataSourceOptions {
    rpc: RpcClient
    finalityConfirmation: number
    newHeadTimeout?: number
    pollInterval?: number
    preferTraceApi?: boolean
    useDebugApiForStateDiffs?: boolean
    log?: Logger
}


export class EvmRpcDataSource implements HotDataSource<Block, DataRequest> {
    private rpc: Rpc
    private finalityConfirmation: number
    private pollInterval: number
    private newHeadTimeout: number
    private preferTraceApi?: boolean
    private useDebugApiForStateDiffs?: boolean
    private log?: Logger

    constructor(options: EvmRpcDataSourceOptions) {
        this.rpc = new Rpc(options.rpc)
        this.finalityConfirmation = options.finalityConfirmation
        this.pollInterval = options.pollInterval || 5_000
        this.newHeadTimeout = options.newHeadTimeout || 0
        this.preferTraceApi = options.preferTraceApi
        this.useDebugApiForStateDiffs = options.useDebugApiForStateDiffs
        this.log = options.log
    }

    async getFinalizedHeight(): Promise<number> {
        let height = await this.rpc.getHeight()
        return Math.max(0, height - this.finalityConfirmation)
    }

    getBlockHash(height: number): Promise<Bytes32 | undefined> {
        return this.rpc.getBlockHash(height)
    }

    getFinalizedBlocks(
        requests: RangeRequest<DataRequest>[],
        stopOnHead?: boolean
    ): AsyncIterable<Batch<Block>> {
        return rpcIngest({
            api: this,
            requests,
            strideSize: 10,
            concurrency: Math.min(5, this.rpc.client.getConcurrency()),
            stopOnHead,
            heightPollInterval: this.pollInterval
        })
    }

    async getSplit(req: SplitRequest<DataRequest>): Promise<Block[]> {
        let request = this.toRpcDataRequest(req.request)
        let rpc = this.rpc.withPriority(req.range.from)
        let blocks = await rpc.fetchSplit({range: req.range, request})
        return blocks.map(b => mapBlock(b, request.transactionList || false))
    }

    private toRpcDataRequest(req?: DataRequest): MappingRequest {
        let r = toMappingRequest(req)
        r.preferTraceApi = this.preferTraceApi
        r.useDebugApiForStateDiffs = this.useDebugApiForStateDiffs
        return r
    }

    async *getHotBlocks(requests: RangeRequestList<DataRequest>, state: HotDatabaseState): AsyncIterable<HotUpdate<Block>> {
        if (requests.length == 0) return

        let lastBlock = last(requests).range.to ?? Infinity

        let queue = new AsyncQueue<HotUpdate<Block> | Error>(2)
        let self = this

        let proc = new HotProcessor<Block>(state, {
            process: upd => queue.put(upd),
            getBlock: async ref => {
                let req = this.toRpcDataRequest(getRequestAt(requests, ref.height))
                let block = await this.rpc.fetchBlock(ref.hash, req, proc.getFinalizedHeight())
                return mapBlock(block, req.transactionList || false)
            },
            async *getBlockRange(from: number, to: Partial<HashAndHeight>): AsyncIterable<Block[]> {
                assert(to.height != null)
                if (from > to.height) {
                    from = to.height
                }
                for (let split of splitRangeByRequest(requests, {from, to: to.height})) {
                    let request = self.toRpcDataRequest(split.request)
                    for (let range of splitRange(10, split.range)) {
                        let rpcBlocks = await self.rpc.fetchHotSplit({
                            range,
                            request,
                            finalizedHeight: proc.getFinalizedHeight()
                        })
                        let blocks = rpcBlocks.map(b => mapBlock(b, request.transactionList || false))
                        let lastBlock = maybeLast(blocks)?.header.height ?? range.from - 1
                        yield blocks
                        if (lastBlock < range.to) {
                            throw new BlockConsistencyError(lastBlock + 1)
                        }
                    }
                }
            },
            getHeader(block) {
                return block.header
            }
        })

        this.ingest(head => {
            return proc.goto({
                best: head,
                finalized: {
                    height: Math.max(head.height - this.finalityConfirmation, 0)
                }
            })
        }).then(() => {
            assert(false, 'unexpected end of data ingestion')
        }).catch((err: unknown) => {
            if (!queue.isClosed()) {
                queue.forcePut(ensureError(err))
            }
        })

        for await (let upd of queue.iterate()) {
            if (upd instanceof Error) {
                throw upd
            } else {
                yield upd
            }
            if (upd.finalizedHead.height >= lastBlock) return
        }
    }

    private ingest(cb: (head: {height: number, hash?: Bytes32}) => Promise<void>): Promise<void> {
        if (this.rpc.client.supportsNotifications()) {
            return this.subIngest(cb)
        } else {
            return this.pollIngest(cb)
        }
    }

    private async subIngest(cb: (head: HashAndHeight) => Promise<void>): Promise<void> {
        let lastHead: HashAndHeight = {height: -1, hash: '0x'}
        let heads = this.subscribeNewHeads()
        try {
            while (true) {
                let next = await addTimeout(heads.take(), this.newHeadTimeout).catch(ensureError)
                if (next == null) return
                if (next instanceof TimeoutError) {
                    this.log?.warn(`resetting RPC connection, because we haven't seen a new head for ${this.newHeadTimeout} ms`)
                    this.rpc.client.reset()
                } else if (next instanceof Error) {
                    throw next
                } else if (next.height >= lastHead.height) {
                    lastHead = next
                    for (let i = 0; i < 3; i++) {
                        try {
                            await cb(next)
                            break
                        } catch(err: any) {
                            if (this.isConsistencyError(err)) {
                                this.log?.write(
                                    i > 0 ? LogLevel.WARN : LogLevel.DEBUG,
                                    err.message
                                )
                                await wait(100)
                                if (heads.peek()) break
                            } else {
                                throw err
                            }
                        }
                    }
                }
            }
        } finally {
            heads.close()
        }
    }

    private async pollIngest(cb: (head: {height: number}) => Promise<void>): Promise<void> {
        let prev = -1
        let height = new Throttler(() => this.rpc.getHeight(), this.pollInterval)
        while (true) {
            let next = await height.call()
            if (next > prev) {
                prev = next
                for (let i = 0; i < 100; i++) {
                    try {
                        await cb({height: next})
                        break
                    } catch(err: any) {
                        if (this.isConsistencyError(err)) {
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
    }

    private isConsistencyError(err: unknown): boolean {
        if (err instanceof ConsistencyError) return true
        if (err instanceof RpcError) {
            // eth_gelBlockByNumber on Moonbeam reacts like that when block is not present
            if (/Expect block number from id/i.test(err.message)) return true
        }
        return false
    }

    private subscribeNewHeads(): AsyncQueue<Head | Error> {
        let queue = new AsyncQueue<Head | Error>(1)

        let handle = this.rpc.subscribeNewHeads({
            onNewHead: head => {
                try {
                    let height = qty2Int(head.number)
                    queue.forcePut({
                        height,
                        hash: head.hash,
                        parentHash: head.parentHash
                    })
                } catch(err: any) {
                    queue.forcePut(ensureError(err))
                    queue.close()
                }
            },
            onError: err => {
                queue.forcePut(ensureError(err))
                queue.close()
            }
        })

        queue.addCloseListener(() => handle.close())

        return queue
    }
}
