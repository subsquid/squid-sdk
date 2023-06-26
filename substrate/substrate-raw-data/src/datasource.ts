import {RpcClient} from '@subsquid/rpc-client'
import {assertNotNull, concurrentMap, last, Throttler} from '@subsquid/util-internal'
import {assertRangeList, RangeRequestList, splitRange, SplitRequest} from '@subsquid/util-internal-range'
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
    private rpc: Rpc
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

        for await (let {blocks, stride} of batches1) {
            await this.fetchMeta(blocks, stride.request, prevRuntimeVersion, prevMetadata)
            prevRuntimeVersion = last(blocks).runtimeVersion
            prevMetadata = last(blocks).metadata
            yield {
                blocks,
                isHead: !!stride.lastBlock
            }
        }
    }

    private async fetchMeta(
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

    private async fetchRuntimeVersion(blocks: BlockData[], prevRuntimeVersion: RuntimeVersion | undefined): Promise<void> {
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

    private async fetchMetadata(
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
            if (s.lastBlock.block.block.extrinsics || !s.request.extrinsics) {
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
}
