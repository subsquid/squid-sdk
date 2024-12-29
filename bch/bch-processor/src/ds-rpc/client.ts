import {Logger, LogLevel} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {AsyncQueue, ensureError, last, maybeLast, Throttler, wait} from '@subsquid/util-internal'
import {
    BlockConsistencyError,
    BlockHeader as Head,
    BlockRef,
    coldIngest,
    HashAndHeight,
    HotProcessor,
    isDataConsistencyError
} from '@subsquid/util-internal-ingest-tools'
import {Batch, HotDatabaseState, HotDataSource, HotUpdate} from '@subsquid/util-internal-processor-tools'
import {
    getRequestAt,
    mapRangeRequestList,
    rangeEnd,
    RangeRequest,
    RangeRequestList,
    splitRange,
    splitRangeByRequest,
    SplitRequest
} from '@subsquid/util-internal-range'
import {cast, NAT, object} from '@subsquid/util-internal-validation'
import {addTimeout, TimeoutError} from '@subsquid/util-timeout'
import assert from 'assert'
import {Bytes32} from '../interfaces/base.js'
import {DataRequest} from '../interfaces/data-request.js'
import {Block} from '../mapping/entities.js'
import {mapBlock} from './mapping.js'
import {MappingRequest, toMappingRequest} from './request.js'
import {Rpc, RpcValidationFlags} from './rpc.js'
import { HEX } from './rpc-data.js'


const NO_REQUEST = toMappingRequest()


export interface BchRpcDataSourceOptions {
    rpc: RpcClient
    p2pEndpoint?: string // endpoint in format "ip:port"
    finalityConfirmation: number
    newHeadTimeout?: number
    headPollInterval?: number
    log?: Logger
    validationFlags?: RpcValidationFlags
}

export class BchRpcDataSource implements HotDataSource<Block, DataRequest> {
    public rpc: Rpc
    private finalityConfirmation: number
    private headPollInterval: number
    private newHeadTimeout: number

    private log?: Logger

    constructor(options: BchRpcDataSourceOptions) {
        this.log = options.log
        this.rpc = new Rpc(options.rpc, this.log, options.validationFlags, 0, {p2pEndpoint: options.p2pEndpoint })
        this.finalityConfirmation = options.finalityConfirmation
        this.headPollInterval = options.headPollInterval || 5_000
        this.newHeadTimeout = options.newHeadTimeout || 0
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
        return coldIngest({
            getFinalizedHeight: () => this.getFinalizedHeight(),
            getSplit: req => this._getColdSplit(req),
            requests: mapRangeRequestList(requests, req => this.toMappingRequest(req)),
            splitSize: 10,
            concurrency: Math.min(5, this.rpc.client.getConcurrency()),
            stopOnHead,
            headPollInterval: this.headPollInterval
        })
    }

    private async _getColdSplit(req: SplitRequest<MappingRequest>): Promise<Block[]> {
        let rpc = this.rpc.withPriority(req.range.from)
        let blocks = await rpc.getColdSplit(req).catch(err => {
            if (isDataConsistencyError(err)) {
                err.message += '. Perhaps finality confirmation was not large enough'
            }
            throw err
        })
        await rpc.cleanupRpc()
        return blocks.map(b => mapBlock(b, req.request))
    }

    private toMappingRequest(req?: DataRequest): MappingRequest {
        let r = toMappingRequest(req)
        return r
    }

    async processHotBlocks(
        requests: RangeRequestList<DataRequest>,
        state: HotDatabaseState,
        cb: (upd: HotUpdate<Block>) => Promise<void>
    ): Promise<void> {
        if (requests.length == 0) return

        let mappingRequests = mapRangeRequestList(requests, req => this.toMappingRequest(req))

        let self = this

        let proc = new HotProcessor<Block>(state, {
            process: cb,
            getBlock: async ref => {
                let req = getRequestAt(mappingRequests, ref.height) || NO_REQUEST
                let block = await this.rpc.getColdBlock(ref.hash, req, proc.getFinalizedHeight())
                return mapBlock(block, req)
            },
            async *getBlockRange(from: number, to: BlockRef): AsyncIterable<Block[]> {
                assert(to.height != null)
                if (from > to.height) {
                    from = to.height
                }
                for (let split of splitRangeByRequest(mappingRequests, {from, to: to.height})) {
                    let request = split.request || NO_REQUEST
                    for (let range of splitRange(10, split.range)) {
                        let rpcBlocks = await self.rpc.getHotSplit({
                            range,
                            request,
                            finalizedHeight: proc.getFinalizedHeight()
                        })
                        let blocks = rpcBlocks.map(b => mapBlock(b, request))
                        let lastBlock = maybeLast(blocks)?.header.height ?? range.from - 1
                        yield blocks
                        if (lastBlock < range.to) {
                            throw new BlockConsistencyError({height: lastBlock + 1})
                        }
                    }
                }
            },
            getHeader(block) {
                return block.header
            }
        })

        let isEnd = () => proc.getFinalizedHeight() >= rangeEnd(last(requests).range)

        let navigate = (head: {height: number, hash?: Bytes32}): Promise<void> => {
            return proc.goto({
                best: head,
                finalized: {
                    height: Math.max(head.height - this.finalityConfirmation, 0)
                }
            })
        }

        if (this.rpc.client.supportsNotifications()) {
            return this.subscription(navigate, isEnd)
        } else {
            return this.polling(navigate, isEnd)
        }
    }

    async processMempool(
        requests: RangeRequestList<DataRequest>,
        state: HotDatabaseState,
        cb: (upd: HotUpdate<Block>) => Promise<void>
    ): Promise<() => Promise<void>> {
        return await this.rpc.watchMempool(requests as any, state, cb as any);
    }

    private async polling(cb: (head: {height: number}) => Promise<void>, isEnd: () => boolean): Promise<void> {
        let prev = -1
        let height = new Throttler(() => this.rpc.getHeight(), this.headPollInterval)
        while (!isEnd()) {
            let next = await height.call()
            if (next <= prev) continue
            prev = next
            for (let i = 0; i < 100; i++) {
                try {
                    await cb({height: next})
                    break
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

    private async subscription(cb: (head: HashAndHeight) => Promise<void>, isEnd: () => boolean): Promise<void> {
        let lastHead: HashAndHeight = {height: -1, hash: '0x'}
        let heads = await this.subscribeNewHeads()
        try {
            while (!isEnd()) {
                let next = await addTimeout(heads.take(), this.newHeadTimeout).catch(ensureError)
                assert(next)
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
                            if (isDataConsistencyError(err)) {
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

    private async subscribeNewHeads(): Promise<AsyncQueue<Head | Error>> {
        let queue = new AsyncQueue<Head | Error>(1)

        const unsubscribe = await this.rpc.watchNewBlocks(async (head) => {
            try {
                let {height, hash, parentHash} = cast(NewHeadMessage, head)
                queue.forcePut({
                    height,
                    hash,
                    parentHash
                })
            } catch(err: any) {
                queue.forcePut(ensureError(err))
                queue.close()
            }
        })

        queue.addCloseListener(async () => await unsubscribe())

        return queue
    }
}


const NewHeadMessage = object({
    height: NAT,
    hash: HEX,
    parentHash: HEX
})
