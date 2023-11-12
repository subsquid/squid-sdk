import type {RpcClient} from '@subsquid/rpc-client'
import * as raw from '@subsquid/substrate-data-raw'
import {OldSpecsBundle, OldTypesBundle} from '@subsquid/substrate-runtime/lib/metadata'
import {assertNotNull} from '@subsquid/util-internal'
import {assertIsValid, Batch} from '@subsquid/util-internal-ingest-tools'
import {mapRangeRequestList, RangeRequestList} from '@subsquid/util-internal-range'
import {Block, DataRequest} from './interfaces/data'
import {RawBlock} from './interfaces/data-raw'
import {Parser} from './parser'


export interface RpcDataSourceOptions {
    rpc: RpcClient
    headPollInterval?: number
    typesBundle?: OldTypesBundle | OldSpecsBundle
}


export class RpcDataSource {
    private rds: raw.RpcDataSource
    private typesBundle?: OldTypesBundle | OldSpecsBundle

    constructor(options: RpcDataSourceOptions) {
        this.rds = new raw.RpcDataSource({
            rpc: options.rpc,
            headPollInterval: options.headPollInterval
        })
        this.typesBundle = options.typesBundle
    }

    get rpc(): raw.Rpc {
        return this.rds.rpc
    }

    getFinalizedHeight(): Promise<number> {
        return this.rds.getFinalizedHeight()
    }

    getBlockHash(height: number): Promise<string | null> {
        return this.rpc.getBlockHash(height)
    }

    async *getFinalizedBlocks(
        requests: RangeRequestList<DataRequest>,
        stopOnHead?: boolean
    ): AsyncIterable<Batch<Block>> {
        let parser = new Parser(this.rpc, requests, this.typesBundle)

        for await (let batch of this.rds.getFinalizedBlocks(
            mapRangeRequestList(requests, toRawRequest),
            stopOnHead
        )) {
            let blocks = await parser.parseFinalized(batch.blocks)
            yield {
                ...batch,
                blocks
            }
        }
    }
}


function toRawRequest(req: DataRequest): raw.DataRequest {
    return {
        runtimeVersion: true,
        extrinsics: req.blockTimestamp || !!req.extrinsics,
        events: req.events || !!req.extrinsics
    }
}
