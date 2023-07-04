import {RpcClient} from '@subsquid/rpc-client'
import {assertNotNull, concurrentMap, last, Throttler} from '@subsquid/util-internal'
import {HotProcessor, HotState, HotUpdate, RequestsTracker} from '@subsquid/util-internal-ingest-tools'
import {assertRangeList, RangeRequest, RangeRequestList, splitRange, SplitRequest} from '@subsquid/util-internal-range'
import assert from 'assert'
import {BlockBatch, BlockData, Bytes, DataRequest, Hash, RuntimeVersion} from './interfaces'
import {Rpc} from './rpc'
import {runtimeVersionEquals} from './util'


interface Stride extends SplitRequest<DataRequest> {
    lastBlock?: BlockData
}


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

        let prevRuntimeVersion: RuntimeVersion | undefined
        let prevMetadata: Bytes | undefined
        let fetcher = new Fetcher(this.rpc)

        for await (let {blocks, stride} of batches1) {
            await fetcher.fetchMeta(blocks, stride.request, prevRuntimeVersion, prevMetadata)
            prevRuntimeVersion = last(blocks).runtimeVersion
            prevMetadata = last(blocks).metadata
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
        let metaCache = new MetaCache()

        let processor = new HotProcessor<BlockData>({
            state,
            getBlock: async ref => {
                let hash = ref.hash || await this.rpc.getBlockHash(assertNotNull(ref.height))
                let request = requestsTracker.getRequestAt(ref.height ?? processor.getHeight() + 1)
                let block = await this.rpc.getBlock0(hash, request)
                request = requestsTracker.getRequestAt(block.height)
                if (matchesRequest0(block, request)) {
                    return block
                } else {
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
                        let prevMeta = metaCache.get(blocks[0].height - 1)
                        await Promise.all([
                            fetcher.fetch1(blocks, request),
                            fetcher.fetchMeta(blocks, request, prevMeta.runtimeVersion, prevMeta.metadata)
                        ])
                        metaCache.save(blocks)
                    }
                }
                await cb(upd)
                metaCache.clear(upd.finalizedHead.height)
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


class MetaCache {
    private cache = new Map<number, {runtimeVersion?: RuntimeVersion, metadata?: Bytes}>

    get(height: number): {runtimeVersion?: RuntimeVersion, metadata?: Bytes} {
        return this.cache.get(height) || {}
    }

    save(blocks: BlockData[]) {
        for (let block of blocks) {
            this.cache.set(block.height, {
                runtimeVersion: block.runtimeVersion,
                metadata: block.metadata
            })
        }
    }

    clear(height: number): void {
        for (let key of this.cache.keys()) {
            if (key < height) {
                this.cache.delete(key)
            }
        }
    }
}


class Fetcher {
    constructor(private rpc: Rpc) {}

    async getStride1(s: Stride): Promise<BlockData[]> {
        let blocks = await this.getStride0(s)
        await this.fetch1(blocks, s.request)
        return blocks
    }

    async getStride0(s: Stride): Promise<BlockData[]> {
        let blocks: BlockData[] = new Array(s.range.to - s.range.from + 1)
        if (s.lastBlock) {
            assert(s.range.to === s.lastBlock.height)
            if (matchesRequest0(s.lastBlock, s.request)) {
                blocks[blocks.length - 1] = s.lastBlock
            } else {
                blocks[blocks.length - 1] = await this.rpc.getBlock0(s.lastBlock.hash, s.request)
            }
        } else {
            let hash = await this.rpc.getBlockHash(s.range.to)
            blocks[blocks.length - 1] = await this.rpc.getBlock0(hash, s.request)
        }
        for (let i = blocks.length - 2; i >= 0; i--) {
            blocks[i] = await this.rpc.getBlock0(blocks[i+1].block.block.header.parentHash, s.request)
        }
        return blocks
    }

    async fetch1(blocks: BlockData[], req: DataRequest): Promise<void> {
        if (req.events) {
            await this.fetchEvents(blocks)
        }
    }

    private async fetchEvents(blocks: BlockData[]): Promise<void> {
        let call = blocks.map(b => ({
            method: 'state_getStorage',
            params: [
                '0x26aa394eea5630e07c48ae0c9558cef780d41e5e16056765bc8461851072c9d7',
                b.hash
            ]
        }))

        let events: Bytes[] = await this.rpc.batchCall(call)

        for (let i = 0; i < blocks.length; i++) {
            blocks[i].events = events[i]
        }
    }

    async fetchMeta(
        blocks: BlockData[],
        req: DataRequest,
        prevRuntimeVersion: RuntimeVersion | undefined,
        prevMetadata: Bytes | undefined
    ): Promise<void> {
        if (req.runtimeVersion || req.metadata) {
            await this.fetchRuntimeVersion(blocks, prevRuntimeVersion)
        }
        if (req.metadata) {
            await this.fetchMetadata(blocks, prevRuntimeVersion, prevMetadata)
        }
    }

    async fetchRuntimeVersion(blocks: BlockData[], prevRuntimeVersion: RuntimeVersion | undefined): Promise<void> {
        if (prevRuntimeVersion == null) {
            prevRuntimeVersion = await this.rpc.getRuntimeVersion(blocks[0].hash)
        }

        last(blocks).runtimeVersion = await this.rpc.getRuntimeVersion(last(blocks).hash)

        for (let i = blocks.length - 2; i >= 0; i--) {
            if (runtimeVersionEquals(prevRuntimeVersion, assertNotNull(blocks[i+1].runtimeVersion))) {
                blocks[i].runtimeVersion = prevRuntimeVersion
            } else {
                blocks[i].runtimeVersion = await this.rpc.getRuntimeVersion(blocks[i].hash)
            }
        }
    }

    async fetchMetadata(
        blocks: BlockData[],
        prevRuntimeVersion: RuntimeVersion | undefined,
        prevMetadata: Bytes | undefined,
    ): Promise<void> {
        for (let block of blocks) {
            if (prevRuntimeVersion && prevMetadata && runtimeVersionEquals(prevRuntimeVersion, assertNotNull(block.runtimeVersion))) {
                block.metadata = prevMetadata
            } else {
                block.metadata = await this.rpc.getMetadata(block.hash)
            }
            prevRuntimeVersion = block.runtimeVersion
            prevMetadata = block.metadata
        }
    }
}


function matchesRequest0(block: BlockData, request?: DataRequest): boolean {
    return !!block.block.block.extrinsics || !request?.extrinsics
}
