import type {RpcClient} from '@subsquid/rpc-client'
import {Batch} from '@subsquid/util-internal-ingest-tools'
import {RangeRequest} from '@subsquid/util-internal-range'
import {Block, DataRequest} from './data'
import {getFinalizedTop} from './fetch'
import {Rpc} from './rpc'


export interface RpcDataSourceOptions {
    rpc: RpcClient
    newHeadTimeout?: number
    headPollInterval?: number
}


export class RpcDataSource {
    private rpc: Rpc

    constructor(options: RpcDataSourceOptions) {
        this.rpc = new Rpc(options.rpc)
    }

    async getFinalizedHeight(): Promise<number> {
        let top = await getFinalizedTop(this.rpc)
        return top.height
    }

    async *getFinalizedBlocks(
        requests: RangeRequest<DataRequest>[],
        stopOnHead?: boolean
    ): AsyncIterable<Batch<Block>> {

    }
}


