import {RpcClient} from '@subsquid/rpc-client'
import {OldSpecsBundle, OldTypesBundle} from '@subsquid/substrate-metadata'
import * as raw from '@subsquid/substrate-raw-data'
import {RequestsTracker} from '@subsquid/util-internal-ingest-tools'
import {RangeRequest, RangeRequestList} from '@subsquid/util-internal-range'
import {Block, BlockBatch, DataRequest} from './interfaces/data'
import {RawBlock} from './interfaces/data-raw'
import {parseRawBlock} from './parsing'
import {RuntimeTracker} from './runtime-tracker'


export interface SubstrateRpcDataSourceOptions {
    rpc: RpcClient
    pollInterval?: number
    typesBundle?: OldTypesBundle | OldSpecsBundle
}


export class SubstrateRpcDataSource {
    private rds: raw.RpcDataSource
    private typesBundle?: OldTypesBundle | OldSpecsBundle

    constructor(options: SubstrateRpcDataSourceOptions) {
        this.rds = new raw.RpcDataSource({
            rpc: options.rpc,
            pollInterval: options.pollInterval
        })
        this.typesBundle = options.typesBundle
    }

    get rpc(): raw.Rpc {
        return this.rds.rpc
    }

    getFinalizedHeight(): Promise<number> {
        return this.rds.getFinalizedHeight()
    }

    getBlockHash(height: number): Promise<string> {
        return this.rpc.getBlockHash(height)
    }

    async *getFinalizedBlocks(requests: RangeRequestList<DataRequest>, stopOnHead?: boolean): AsyncIterable<BlockBatch> {
        let parser = new Parser(this.rpc, requests, this.typesBundle)

        for await (let batch of this.rds.getFinalizedBlocks(
            requests.map(toRawRangeRequest),
            stopOnHead
        )) {
            let blocks = await parser.parse(batch.blocks)
            yield {
                blocks,
                isHead: batch.isHead
            }
        }
    }
}


class Parser {
    private requests: RequestsTracker<DataRequest>
    private runtimeTracker: RuntimeTracker

    constructor(
        private rpc: raw.Rpc,
        requests: RangeRequestList<DataRequest>,
        typesBundle?: OldTypesBundle | OldSpecsBundle
    ) {
        this.requests = new RequestsTracker(requests)
        this.runtimeTracker = new RuntimeTracker(this.rpc, typesBundle)
    }

    async parse(rawBlocks: RawBlock[]): Promise<Block[]> {
        let result: Block[] = []
        for (let rawBlock of rawBlocks) {
            result.push(await this.parseBlock(rawBlock))
        }
        return result
    }

    async parseBlock(rawBlock: RawBlock): Promise<Block> {
        let request = this.requests.getRequestAt(rawBlock.height)
        let runtime = await this.runtimeTracker.getRuntime(rawBlock)
        return parseRawBlock(runtime, rawBlock, request)
    }
}


function toRawRangeRequest(req: RangeRequest<DataRequest>): RangeRequest<raw.DataRequest> {
    return {
        range: req.range,
        request: toRawRequest(req.request)
    }
}


function toRawRequest(req: DataRequest): raw.DataRequest {
    return {
        runtimeVersion: true,
        extrinsics: req.extrinsics,
        events: req.events
    }
}
