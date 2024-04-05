import type {RpcClient} from '@subsquid/rpc-client'
import {Batch, HotState, HotUpdate} from '@subsquid/util-internal-ingest-tools'
import {RangeRequest} from '@subsquid/util-internal-range'
import assert from 'assert'
import {ingestColdBlocks} from './ingest/cold'
import {Block, DataRequest} from './data'
import {Rpc} from './rpc'
import {ChainConsistencyValidator} from './util'


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

    constructor(private options: RpcDataSourceOptions) {
        this.rpc = new Rpc(options.rpc)
        this.headPollInterval = options.headPollInterval ?? 2000
        this.strideSize = options.strideSize || 5
        this.strideConcurrency = options.strideConcurrency || 5
        assert(this.strideSize >= 1)
    }

    async getFinalizedHeight(): Promise<number> {
        let slot = await this.rpc.getTopSlot('finalized')
        return this.rpc.getFinalizedBlockHeight(slot)
    }

    async *getFinalizedBlocks(
        requests: RangeRequest<DataRequest>[],
        stopOnHead?: boolean
    ): AsyncIterable<Batch<Block>> {
        let chain = new ChainConsistencyValidator()

        let blockStream = ingestColdBlocks({
            requests,
            rpc: this.rpc,
            headPollInterval: this.headPollInterval,
            strideConcurrency: this.strideConcurrency,
            strideSize: this.strideSize,
            stopOnHead
        })

        for await (let blocks of blockStream) {
            chain.assertNextBatch(blocks)
            yield {blocks, isHead: false}
        }
    }

    async processHotBlocks(
        requests: RangeRequest<DataRequest>[],
        state: HotState,
        cb: (upd: HotUpdate<Block>) => Promise<void>
    ): Promise<void> {

    }
}
