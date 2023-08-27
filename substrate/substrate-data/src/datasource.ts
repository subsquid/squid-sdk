import type {RpcClient} from '@subsquid/rpc-client'
import * as raw from '@subsquid/substrate-data-raw'
import {OldSpecsBundle, OldTypesBundle} from '@subsquid/substrate-runtime/lib/metadata'
import {Batch, HotState, HotUpdate} from '@subsquid/util-internal-ingest-tools'
import {RangeRequest, RangeRequestList} from '@subsquid/util-internal-range'
import {Block, DataRequest} from './interfaces/data'
import {Parser} from './parser'


export interface RpcDataSourceOptions {
    rpc: RpcClient
    pollInterval?: number
    typesBundle?: OldTypesBundle | OldSpecsBundle
}


export class RpcDataSource {
    private rds: raw.RpcDataSource
    private typesBundle?: OldTypesBundle | OldSpecsBundle

    constructor(options: RpcDataSourceOptions) {
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

    async *getFinalizedBlocks(
        requests: RangeRequestList<DataRequest>,
        stopOnHead?: boolean
    ): AsyncIterable<Batch<Block>> {
        let parser = new Parser(this.rpc, requests, this.typesBundle)

        for await (let batch of this.rds.getFinalizedBlocks(
            requests.map(toRawRangeRequest),
            stopOnHead
        )) {
            let blocks = await parser.parse(batch.blocks)
            yield {
                ...batch,
                blocks
            }
        }
    }

    processHotBlocks(
        requests: RangeRequest<DataRequest>[],
        state: HotState,
        cb: (upd: HotUpdate<Block>) => Promise<void>
    ): Promise<void> {
        let parser = new Parser(this.rpc, requests, this.typesBundle)
        return this.rds.processHotBlocks(
            requests.map(toRawRangeRequest),
            state,
            async upd => {
                let blocks = await parser.parse(upd.blocks)
                await cb({
                    ...upd,
                    blocks
                })
            }
        )
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
        extrinsics: req.blockTimestamp || !!req.extrinsics,
        events: req.events || !!req.extrinsics
    }
}
