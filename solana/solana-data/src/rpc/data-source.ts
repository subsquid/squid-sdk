import type {RpcClient} from '@subsquid/rpc-client'
import {concurrentMap, last, Throttler} from '@subsquid/util-internal'
import {Batch} from '@subsquid/util-internal-ingest-tools'
import {FiniteRange, RangeRequest, splitRange} from '@subsquid/util-internal-range'
import assert from 'assert'
import {Block, DataRequest} from './data'
import {getData, getFinalizedTop, isConsistentChain} from './fetch'
import {Rpc} from './rpc'
import {findSlot} from './slot-search'


export interface RpcDataSourceOptions {
    rpc: RpcClient
    headPollInterval?: number
    newHeadTimeout?: number
    strideSize?: number
    strideConcurrency?: number
}


export class RpcDataSource {
    private rpc: Rpc
    private headPollInterval: number
    private strideSize: number
    private strideConcurrency: number

    constructor(options: RpcDataSourceOptions) {
        this.rpc = new Rpc(options.rpc)
        this.headPollInterval = options.headPollInterval ?? 500
        this.strideSize = options.strideSize || 10
        this.strideConcurrency = options.strideConcurrency || 5
        assert(this.strideSize >= 1)
    }

    async getFinalizedHeight(): Promise<number> {
        let top = await getFinalizedTop(this.rpc)
        return top.height
    }

    async *getFinalizedBlocks(
        requests: RangeRequest<DataRequest>[],
        stopOnHead?: boolean
    ): AsyncIterable<Batch<Block>> {
        let head = new Throttler(() => getFinalizedTop(this.rpc), this.headPollInterval)
        let rpc = this.rpc
        let strideSize = this.strideSize

        async function* splits(): AsyncIterable<{
            slots: FiniteRange
            request: DataRequest
            isHead: boolean
        }> {
            let bottom = {height: 0, slot: 0}
            let top = await head.get()

            for (let req of requests) {
                let beg = req.range.from
                let end = req.range.to ?? Infinity
                while (beg <= end) {
                    if (top.height < beg) {
                        top = await head.get()
                    }
                    while (top.height < beg) {
                        if (stopOnHead) return
                        top = await head.call()
                    }
                    let startSlot = await findSlot(rpc, beg, bottom, top)
                    let endSlot: number
                    if (top.height > end) {
                        endSlot = await findSlot(rpc, end, {height: beg, slot: startSlot}, top)
                        bottom = {height: end, slot: endSlot}
                        beg = end + 1
                    } else {
                        endSlot = top.slot
                        bottom = top
                        beg = top.height + 1
                    }
                    for (let range of splitRange(strideSize, {from: startSlot, to: endSlot})) {
                        if (range.to == endSlot) {
                            top = await head.get()
                        }
                        let isHead = top.slot == endSlot
                        yield {
                            slots: range,
                            request: req.request,
                            isHead
                        }
                    }
                }
            }
        }

        let prev: Block | undefined

        for await (let batch of concurrentMap(
            this.strideConcurrency,
            splits(),
            async s => {
                let blocks = await getData(
                    rpc.withPriority(s.slots.from),
                    'finalized',
                    s.slots,
                    s.request
                )
                return {
                    blocks: blocks as Block[],
                    isHead: s.isHead
                }
            }
        )) {
            if (batch.blocks.length == 0) continue
            if (prev?.height === batch.blocks[0].height - 1) {
                assert(isConsistentChain(prev, batch.blocks[0]))
            }
            for (let i = 1; i < batch.blocks.length; i++) {
                assert(isConsistentChain(batch.blocks[i-1], batch.blocks[i]))
            }
            prev = last(batch.blocks)
            yield batch
        }
    }
}
