import {RpcClient} from '@subsquid/rpc-client'
import {OldSpecsBundle, OldTypesBundle} from '@subsquid/substrate-metadata'
import * as raw from '@subsquid/substrate-raw-data'
import {assertNotNull, last} from '@subsquid/util-internal'
import {Batch, HashAndHeight, HotState, HotUpdate} from '@subsquid/util-internal-ingest-tools'
import {RangeRequest, RangeRequestList} from '@subsquid/util-internal-range'
import assert from 'assert'
import {Block, DataRequest, WithRuntime} from './interfaces/data'
import {RawBlock} from './interfaces/data-raw'
import {Parser} from './parser'
import {Runtime} from './runtime'


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
    ): AsyncIterable<Batch<Block> & WithRuntime> {
        let parser = new Parser(this.rpc, requests, this.typesBundle)

        for await (let batch of this.rds.getFinalizedBlocks(
            requests.map(toRawRangeRequest),
            stopOnHead
        )) {
            let blocks = await parser.parse(batch.blocks)
            for (let runtimeBatch of splitAtRuntime(batch.blocks, blocks)) {
                yield {
                    ...runtimeBatch,
                    isHead: batch.isHead && last(blocks) === last(runtimeBatch.blocks)
                }
            }
        }
    }

    processHotBlocks(
        requests: RangeRequest<DataRequest>[],
        state: HotState,
        cb: (upd: HotUpdate<Block> & WithRuntime) => Promise<void>
    ): Promise<void> {
        let parser = new Parser(this.rpc, requests, this.typesBundle)
        return this.rds.processHotBlocks(
            requests.map(toRawRangeRequest),
            state,
            async upd => {
                let blocks = await parser.parse(upd.blocks)
                for (let runtimeBatch of splitAtRuntime(upd.blocks, blocks)) {
                    let lastBlock = last(runtimeBatch.blocks).header
                    await cb({
                        ...runtimeBatch,
                        baseHead: getParent(runtimeBatch.blocks[0]),
                        finalizedHead: upd.finalizedHead.height > lastBlock.height
                            ? lastBlock
                            : upd.finalizedHead
                    })
                }
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
        extrinsics: req.extrinsics,
        events: req.events
    }
}


function* splitAtRuntime(raw: RawBlock[], blocks: Block[]): Iterable<{
    runtime: Runtime,
    prevRuntime: Runtime,
    blocks: Block[]
}> {
    assert(raw.length === blocks.length)
    if (blocks.length == 0) return

    let item = {
        runtime: assertNotNull(raw[0].runtime),
        prevRuntime: assertNotNull(raw[0].runtimeOfPreviousBlock),
        blocks: [blocks[0]]
    }

    for (let i = 1; i < blocks.length; i++) {
        if (raw[i].runtime === item.runtime) {
            item.blocks.push(blocks[i])
        } else {
            yield item
            item = {
                runtime: assertNotNull(raw[i].runtime),
                prevRuntime: assertNotNull(raw[i].runtimeOfPreviousBlock),
                blocks: [blocks[i]]
            }
        }
    }

    yield item
}


function getParent(block: Block): HashAndHeight {
    return {
        height: block.header.height - 1,
        hash: block.header.parentHash
    }
}
