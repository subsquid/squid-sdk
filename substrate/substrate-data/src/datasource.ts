import {RpcClient} from '@subsquid/rpc-client'
import * as raw from '@subsquid/substrate-raw-data'
import {RangeRequestList} from '@subsquid/util-internal-range'
import {PartialBlockBatch} from './interfaces/data'
import {DataRequest} from './interfaces/data-request'


export interface SubstrateRpcDataSourceOptions {
    rpc: RpcClient
    pollInterval?: number
}


export class SubstrateRpcDataSource {
    private pollInterval: number
    private rds: raw.RpcDataSource

    constructor(options: SubstrateRpcDataSourceOptions) {
        this.pollInterval = options.pollInterval || 1000
        this.rds = new raw.RpcDataSource({
            rpc: options.rpc,
            pollInterval: options.pollInterval
        })
    }

    getFinalizedHeight(): Promise<number> {
        return this.rds.getFinalizedHeight()
    }

    getBlockHash(height: number): Promise<string> {
        return this.rds.rpc.getBlockHash(height)
    }

    async *getFinalizedBlocks(requests: RangeRequestList<DataRequest>, stopOnHead?: boolean): AsyncIterable<PartialBlockBatch> {
        throw new Error()
    }
}
