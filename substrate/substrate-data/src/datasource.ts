import type {RpcClient} from '@subsquid/rpc-client'
import * as raw from '@subsquid/substrate-data-raw'
import {OldSpecsBundle, OldTypesBundle} from '@subsquid/substrate-runtime/lib/metadata'
import {Batch, HotState, HotUpdate} from '@subsquid/util-internal-ingest-tools'
import {mapRangeRequestList, RangeRequestList} from '@subsquid/util-internal-range'
import {Block, DataRequest} from './interfaces/data'
import {Parser} from './parser'


export interface RpcDataSourceOptions {
    rpc: RpcClient
    headPollInterval?: number
    newHeadTimeout?: number
    typesBundle?: OldTypesBundle | OldSpecsBundle
    finalityConfirmation?: number
}


export class RpcDataSource {
    private rawDataSource: raw.RpcDataSource
    private typesBundle?: OldTypesBundle | OldSpecsBundle

    constructor(options: RpcDataSourceOptions) {
        this.rawDataSource = new raw.RpcDataSource({
            rpc: options.rpc,
            headPollInterval: options.headPollInterval,
            newHeadTimeout: options.newHeadTimeout,
            finalityConfirmation: options.finalityConfirmation
        })
        this.typesBundle = options.typesBundle
    }

    get rpc(): raw.Rpc {
        return this.rawDataSource.rpc
    }

    getFinalizedHeight(): Promise<number> {
        return this.rawDataSource.getFinalizedHeight()
    }

    getBlockHash(height: number): Promise<string | null> {
        return this.rpc.getBlockHash(height)
    }

    async *getFinalizedBlocks(
        requests: RangeRequestList<DataRequest>,
        stopOnHead?: boolean
    ): AsyncIterable<Batch<Block>> {
        let parser = new Parser(this.rpc, requests, this.typesBundle)

        for await (let batch of this.rawDataSource.getFinalizedBlocks(
            mapRangeRequestList(requests, toRawRequest),
            stopOnHead
        )) {
            let blocks = await parser.parseCold(batch.blocks)
            yield {
                ...batch,
                blocks
            }
        }
    }

    async processHotBlocks(
        requests: RangeRequestList<DataRequest>,
        state: HotState,
        cb: (upd: HotUpdate<Block>) => Promise<void>
    ): Promise<void> {
        let parser = new Parser(this.rpc, requests, this.typesBundle)

        return this.rawDataSource.processHotBlocks(
            mapRangeRequestList(requests, toRawRequest),
            state,
            async upd => {
                let blocks = await parser.parseCold(upd.blocks)
                return cb({
                    ...upd,
                    blocks
                })
            }
        )
    }
}


function toRawRequest(req: DataRequest): raw.DataRequest {
    return {
        runtimeVersion: true,
        extrinsics: req.blockTimestamp || !!req.extrinsics,
        events: req.events || !!req.extrinsics
    }
}
