import {Logger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {rpcIngest} from '@subsquid/util-internal-ingest-tools'
import {Batch, DataSource, HotDataSource, HotDatabaseState, HotUpdate,
    RangeRequest,
    RangeRequestList,
    SplitRequest
} from '@subsquid/util-internal-processor-tools'
import {Bytes32} from '../interfaces/base'
import {AllFields, BlockData} from '../interfaces/data'
import {DataRequest} from '../interfaces/data-request'
import {mapBlock, MappingRequest, toMappingRequest} from './mapping'
import {Rpc} from './rpc'


type Block = BlockData<AllFields>


export interface EvmRpcDataSourceOptions {
    rpc: RpcClient
    finalityConfirmation: number
    pollInterval?: number
    preferTraceApi?: boolean
    useDebugApiForStateDiffs?: boolean
    log?: Logger
}


export class EvmRpcDataSource implements HotDataSource<Block, DataRequest> {
    private rpc: Rpc
    private finalityConfirmation: number
    private pollInterval: number
    private preferTraceApi?: boolean
    private useDebugApiForStateDiffs?: boolean
    private log?: Logger

    constructor(options: EvmRpcDataSourceOptions) {
        this.rpc = new Rpc(options.rpc)
        this.finalityConfirmation = options.finalityConfirmation
        this.pollInterval = options.pollInterval ?? 5_000
        this.preferTraceApi = options.preferTraceApi
        this.useDebugApiForStateDiffs = options.useDebugApiForStateDiffs
        this.log = options.log
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
        return rpcIngest({
            api: this,
            requests,
            strideSize: 10,
            concurrency: Math.min(5, this.rpc.client.getConcurrency()),
            stopOnHead,
            pollInterval: this.pollInterval
        })
    }

    async getSplit(req: SplitRequest<DataRequest>): Promise<Block[]> {
        let request = this.toRpcDataRequest(req.request)
        let rpc = this.rpc.withPriority(req.range.from)
        let blocks = await rpc.getSplit({range: req.range, request})
        return blocks.map(b => mapBlock(b, request.transactionList || false))
    }

    private toRpcDataRequest(req: DataRequest): MappingRequest {
        let r = toMappingRequest(req)
        r.preferTraceApi = this.preferTraceApi
        r.useDebugApiForStateDiffs = this.useDebugApiForStateDiffs
        return r
    }

    getHotBlocks(requests: RangeRequestList<DataRequest>, state: HotDatabaseState): AsyncIterable<HotUpdate<Block>> {
        throw new Error('Method not implemented.')
    }
}
