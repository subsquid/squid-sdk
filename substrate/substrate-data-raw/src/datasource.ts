import {RpcClient} from '@subsquid/rpc-client'
import {assertIsValid, rpcIngest} from '@subsquid/util-internal-ingest-tools'
import {assertRangeList, getRequestAt, RangeRequestList, SplitRequest} from '@subsquid/util-internal-range'
import assert from 'assert'
import {Fetch1} from './fetch1'
import {BlockBatch, BlockData, DataRequest, DataRequest1} from './interfaces'
import {Rpc} from './rpc'
import {RuntimeVersionTracker} from './runtimeVersionTracker'
import {qty2Int} from './util'


export interface RpcDataSourceOptions {
    rpc: RpcClient
    headPollInterval?: number
}


export class RpcDataSource {
    public readonly rpc: Rpc
    private headPollInterval: number

    constructor(options: RpcDataSourceOptions) {
        this.rpc = new Rpc(options.rpc)
        this.headPollInterval = options.headPollInterval ?? 5000
    }

    async getFinalizedHeight(): Promise<number> {
        let head = await this.rpc.getFinalizedHead()
        let header = await this.rpc.getBlockHeader(head)
        assert(header, 'finalized blocks must be always available')
        return qty2Int(header.number)
    }

    getSplit(req: SplitRequest<DataRequest1>): Promise<BlockData[]> {
        let fetch = new Fetch1(this.rpc.withPriority(req.range.from))
        return fetch.getSplit(req.range.from, req.range.to, req.request)
    }

    async *getFinalizedBlocks(requests: RangeRequestList<DataRequest>, stopOnHead?: boolean): AsyncIterable<BlockBatch> {
        assertRangeList(requests.map(req => req.range))

        let runtimeVersionTracker = new RuntimeVersionTracker()

        let stream = rpcIngest({
            api: this,
            requests,
            concurrency: Math.min(5, this.rpc.client.getConcurrency()),
            strideSize: 10,
            stopOnHead,
            heightPollInterval: this.headPollInterval
        })

        for await (let batch of stream) {
            let request = getRequestAt(requests, batch.blocks[0].height)
            if (request?.runtimeVersion) {
                await runtimeVersionTracker.addRuntimeVersion(this.rpc, batch.blocks)
                assertIsValid(batch.blocks)
            }
            yield batch
        }
    }
}
