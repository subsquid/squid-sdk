import {RpcClient} from '@subsquid/rpc-client'
import * as base from '@subsquid/substrate-data'
import {WithRuntime} from '@subsquid/substrate-data'
import {OldSpecsBundle, OldTypesBundle} from '@subsquid/substrate-metadata'
import {
    Batch,
    HotDatabaseState,
    HotDataSource,
    HotUpdate,
    RangeRequestList
} from '@subsquid/util-internal-processor-tools'
import {PartialBlockData} from '../interfaces/data'
import {DataRequest} from '../interfaces/data-request'
import {toBaseRangeRequest} from './mapping'


export interface RpcDataSourceOptions {
    rpc: RpcClient
    pollInterval?: number
    typesBundle?: OldTypesBundle | OldSpecsBundle
}


export class RpcDataSource implements HotDataSource<PartialBlockData, DataRequest> {
    private ds: base.RpcDataSource

    constructor(options: RpcDataSourceOptions) {
        this.ds = new base.RpcDataSource({
            rpc: options.rpc,
            pollInterval: options.pollInterval,
            typesBundle: options.typesBundle
        })
    }

    getBlockHash(height: number): Promise<string> {
        return this.ds.getBlockHash(height)
    }

    getFinalizedHeight(): Promise<number> {
        return this.ds.getFinalizedHeight()
    }

    async *getFinalizedBlocks(
        requests: RangeRequestList<DataRequest>,
        stopOnHead?: boolean
    ): AsyncIterable<Batch<PartialBlockData> & WithRuntime> {
        for await (let batch of this.ds.getFinalizedBlocks(
            requests.map(toBaseRangeRequest),
            stopOnHead
        )) {

        }
    }

    getHotBlocks(
        requests: RangeRequestList<DataRequest>,
        state: HotDatabaseState
    ): AsyncIterable<HotUpdate<PartialBlockData> & WithRuntime> {
        throw new Error()
    }
}


