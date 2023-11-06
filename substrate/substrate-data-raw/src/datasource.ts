import {RpcClient} from '@subsquid/rpc-client'
import {assertNotNull, concurrentMap, Throttler} from '@subsquid/util-internal'
import {HotProcessor, HotState, HotUpdate, RequestsTracker} from '@subsquid/util-internal-ingest-tools'
import {assertRangeList, RangeRequest, RangeRequestList, splitRange} from '@subsquid/util-internal-range'
import {Fetcher, matchesRequest0, Stride} from './fetcher'
import {BlockBatch, BlockData, DataRequest, Hash} from './interfaces'
import {Rpc} from './rpc'


export interface RpcDataSourceOptions {
    rpc: RpcClient
    pollInterval?: number
    strides?: number
}


export class RpcDataSource {
    public readonly rpc: Rpc
    private pollInterval: number
    private strides: number

    constructor(options: RpcDataSourceOptions) {
        this.rpc = new Rpc(options.rpc)
        this.pollInterval = options.pollInterval ?? 1000
        this.strides = options.strides || 5
    }

    async getFinalizedHeight(): Promise<number> {
        let head = await this.rpc.getFinalizedHead()
        let block = await this.rpc.getBlock0(head)
        return block.height
    }

    async *getFinalizedBlocks(requests: RangeRequestList<DataRequest>, stopOnHead?: boolean): AsyncIterable<BlockBatch> {
        assertRangeList(requests.map(req => req.range))

        let batches1 = concurrentMap(
            this.strides,
            this.generateStrides(requests, stopOnHead),
            async s => {
                let blocks = await new Fetcher(this.rpc.withPriority(s.range.from)).getStride1(s)
                return {blocks, stride: s}
            }
        )

        let fetcher = new Fetcher(this.rpc)

        for await (let {blocks, stride} of batches1) {
            if (stride.request.runtimeVersion) {
                await fetcher.fetchRuntimeVersion(blocks)
            }
            yield {
                blocks,
                isHead: !!stride.lastBlock
            }
        }
    }

    private async *generateStrides(
        requests: RangeRequestList<DataRequest>,
        stopOnHead?: boolean
    ): AsyncIterable<Stride> {
        let head = new Throttler(() => this.rpc.getFinalizedHead(), this.pollInterval)
        let top = await this.rpc.getBlock0(await head.get())
        for (let req of requests) {
            let beg = req.range.from
            let end = req.range.to ?? Infinity
            while (beg <= end) {
                if (top.height < beg) {
                    top = await this.getHeadBlock(
                        await head.get(),
                        top,
                        beg,
                        req.request
                    )
                }
                if (top.height < beg) {
                    if (stopOnHead) return
                    await head.call()
                } else {
                    let to = Math.min(top.height, end)
                    for (let range of splitRange(10, {
                        from: beg,
                        to
                    })) {
                        let stride: Stride = {
                            range,
                            request: req.request
                        }
                        if (range.to == top.height) {
                            stride.lastBlock = top
                        }
                        yield stride
                    }
                    beg = to + 1
                }
            }
        }
    }

    private async getHeadBlock(
        head: Hash,
        current: BlockData,
        desiredHeight: number,
        req: DataRequest
    ): Promise<BlockData> {
        if (head === current.hash) return current
        return this.rpc.getBlock0(
            head,
            desiredHeight == current.height + 1 ? req : undefined
        )
    }

    async processHotBlocks(
        requests: RangeRequest<DataRequest>[],
        state: HotState,
        cb: (upd: HotUpdate<BlockData>) => Promise<void>
    ): Promise<void> {
        let requestsTracker = new RequestsTracker(requests)
        let fetcher = new Fetcher(this.rpc)

        let processor = new HotProcessor<BlockData>({
            state,
            getBlock: async ref => {
                let hash = ref.hash || await this.rpc.getBlockHash(assertNotNull(ref.height))
                if (ref.height == null) {
                    let request = requestsTracker.getRequestAt(processor.getHeight() + 1)
                    let block = await this.rpc.getBlock0(hash, request)
                    request = requestsTracker.getRequestAt(block.height)
                    if (matchesRequest0(block, request)) {
                        return block
                    } else {
                        return this.rpc.getBlock0(hash, request)
                    }
                } else {
                    let request = requestsTracker.getRequestAt(ref.height)
                    return this.rpc.getBlock0(hash, request)
                }
            },
            getHeader(block: BlockData) {
                return {
                    height: block.height,
                    hash: block.hash,
                    parentHash: block.block.block.header.parentHash
                }
            },
            getBlockHeight: async hash => {
                let b = await this.rpc.getBlock0(hash)
                return b.height
            },
            process: async upd => {
                for (let {blocks, request} of requestsTracker.splitBlocksByRequest(upd.blocks, b => b.height)) {
                    if (request) {
                        await fetcher.fetch1(blocks, request)
                        if (request.runtimeVersion) {
                            await fetcher.fetchRuntimeVersion(blocks)
                        }
                    }
                }
                await cb(upd)
            }
        })

        for await (let head of this.getHeads()) {
            await processor.goto(head)
        }
    }

    private async *getHeads(): AsyncIterable<{best: Hash, finalized: Hash}> {
        let heads = new Throttler(() => this.rpc.getHead(), this.pollInterval)
        let prevBest: Hash | undefined
        while (true) {
            let best = await heads.call()
            if (best !== prevBest) {
                let finalized = await this.rpc.getFinalizedHead()
                yield {best, finalized}
                prevBest = best
            }
        }
    }
}
