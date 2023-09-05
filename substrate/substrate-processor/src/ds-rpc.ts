import type {RpcClient} from '@subsquid/rpc-client'
import * as base from '@subsquid/substrate-data'
import {OldSpecsBundle, OldTypesBundle} from '@subsquid/substrate-runtime'
import {annotateSyncError, AsyncQueue, ensureError} from '@subsquid/util-internal'
import {toJSON} from '@subsquid/util-internal-json'
import {
    Batch,
    HotDatabaseState,
    HotDataSource,
    HotUpdate,
    RangeRequest,
    RangeRequestList
} from '@subsquid/util-internal-processor-tools'
import {DataRequest} from './interfaces/data-request'
import {Block, BlockHeader, Call, Event, Extrinsic, setUpItems} from './mapping'


export interface RpcDataSourceOptions {
    rpc: RpcClient
    pollInterval?: number
    typesBundle?: OldTypesBundle | OldSpecsBundle
}


export class RpcDataSource implements HotDataSource<Block, DataRequest> {
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
    ): AsyncIterable<Batch<Block>> {
        for await (let batch of this.ds.getFinalizedBlocks(
            requests.map(toBaseRangeRequest),
            stopOnHead
        )) {
            yield {
                ...batch,
                blocks: batch.blocks.map(b => this.mapBlock(b))
            }
        }
    }

    async *getHotBlocks(
        requests: RangeRequestList<DataRequest>,
        state: HotDatabaseState
    ): AsyncIterable<HotUpdate<Block>> {
        let queue = new AsyncQueue<HotUpdate<base.Block> | Error>(1)

        this.ds.processHotBlocks(
            requests.map(toBaseRangeRequest),
            state,
            upd => queue.put(upd)
        ).then(
            () => queue.close(),
            err => queue.put(ensureError(err)).catch(err => {})
        )

        for await (let upd of queue.iterate()) {
            if (upd instanceof Error) {
                throw upd
            } else {
                yield {
                    ...upd,
                    blocks: upd.blocks.map(b => this.mapBlock(b))
                }
            }
        }
    }

    @annotateSyncError((src: base.Block) => ({blockHeight: src.header.height, blockHash: src.header.hash}))
    private mapBlock(src: base.Block): Block {
        let block = new Block(new BlockHeader(
            src.runtime,
            src.runtimeOfPrevBlock,
            src.header
        ))

        if (src.extrinsics) {
            for (let s of src.extrinsics) {
                let extrinsic = new Extrinsic(block.header, s.index)
                if (s.version != null) {
                    extrinsic.version = s.version
                }
                if (s.signature != null) {
                    extrinsic.signature = toJSON(s.signature)
                }
                if (s.fee != null) {
                    extrinsic.fee = s.fee
                }
                if (s.tip != null) {
                    extrinsic.tip = s.tip
                }
                if (s.error != null) {
                    extrinsic.error = toJSON(s.error)
                }
                if (s.success != null) {
                    extrinsic.success = s.success
                }
                if (s.hash != null) {
                    extrinsic.hash = s.hash
                }
                block.extrinsics.push(extrinsic)
            }
        }

        if (src.calls) {
            for (let s of src.calls) {
                let call = new Call(block.header, s.extrinsicIndex, s.address)
                if (s.name) {
                    call.name = s.name
                }
                if (s.args != null) {
                    call.args = toJSON(s.args)
                }
                if (s.origin != null) {
                    call.origin = toJSON(s.origin)
                }
                if (s.error != null) {
                    call.error = toJSON(s.error)
                }
                if (s.success != null) {
                    call.success = s.success
                }
                block.calls.push(call)
            }
        }

        if (src.events) {
            for (let s of src.events) {
                let event = new Event(block.header, s.index)
                if (s.name != null) {
                    event.name = s.name
                }
                if (s.args != null) {
                    event.args = toJSON(s.args)
                }
                if (s.phase != null) {
                    event.phase = s.phase
                }
                if (s.extrinsicIndex != null) {
                    event.extrinsicIndex = s.extrinsicIndex
                }
                if (s.callAddress != null) {
                    event.callAddress = s.callAddress
                }
                block.events.push(event)
            }
        }

        setUpItems(block)
        return block
    }
}


function toBaseRangeRequest(req: RangeRequest<DataRequest>): RangeRequest<base.DataRequest> {
    return {
        range: req.range,
        request: toBaseDataRequest(req.request)
    }
}


function toBaseDataRequest(req: DataRequest): base.DataRequest {
    let events = !!req.events?.length
        || !!req.evmLogs?.length
        || !!req.contractsEvents?.length
        || !!req.gearMessagesEnqueued?.length
        || !!req.gearUserMessagesSent?.length
        || req.calls?.some(c => c.events)
        || req.ethereumTransactions?.some(c => c.events)
        || false

    let calls = !!req.calls?.length
        || !!req.ethereumTransactions?.length
        || req.events?.some(e => e.extrinsic || e.call || e.stack)
        || req.evmLogs?.some(e => e.extrinsic || e.call || e.stack)
        || req.contractsEvents?.some(e => e.extrinsic || e.call || e.stack)
        || req.gearMessagesEnqueued?.some(e => e.extrinsic || e.call || e.stack)
        || req.gearUserMessagesSent?.some(e => e.extrinsic || e.call || e.stack)
        || false

    let baseReq: base.DataRequest = {
        blockTimestamp: !!req.fields?.block?.timestamp,
        blockValidator: !!req.fields?.block?.validator,
        events
    }

    if (calls) {
        baseReq.extrinsics = {
            hash: !!req.fields?.extrinsic?.hash,
            fee: !!req.fields?.extrinsic?.fee
        }
    }

    return baseReq
}
