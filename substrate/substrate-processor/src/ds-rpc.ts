import type {RpcClient} from '@subsquid/rpc-client'
import * as base from '@subsquid/substrate-data'
import {OldSpecsBundle, OldTypesBundle} from '@subsquid/substrate-runtime'
import {annotateSyncError} from '@subsquid/util-internal'
import {toJSON} from '@subsquid/util-internal-json'
import {Batch, HotDatabaseState, HotDataSource, HotUpdate} from '@subsquid/util-internal-processor-tools'
import {mapRangeRequestList, RangeRequestList} from '@subsquid/util-internal-range'
import {filterBlockBatch} from './ds-rpc-filter'
import {DataRequest} from './interfaces/data-request'
import {Block, BlockHeader, Call, Event, Extrinsic, setUpItems} from './mapping'


export interface RpcDataSourceOptions {
    rpc: RpcClient
    headPollInterval?: number
    newHeadTimeout?: number
    typesBundle?: OldTypesBundle | OldSpecsBundle
    finalityConfirmation?: number
}


export class RpcDataSource implements HotDataSource<Block, DataRequest> {
    private baseDataSource: base.RpcDataSource

    constructor(options: RpcDataSourceOptions) {
        this.baseDataSource = new base.RpcDataSource(options)
    }

    getBlockHash(height: number): Promise<string | null> {
        return this.baseDataSource.getBlockHash(height)
    }

    getFinalizedHeight(): Promise<number> {
        return this.baseDataSource.getFinalizedHeight()
    }

    async *getFinalizedBlocks(
        requests: RangeRequestList<DataRequest>,
        stopOnHead?: boolean
    ): AsyncIterable<Batch<Block>> {
        for await (let batch of this.baseDataSource.getFinalizedBlocks(
            mapRangeRequestList(requests, toBaseDataRequest),
            stopOnHead
        )) {
            let blocks = batch.blocks.map(b => this.mapBlock(b))
            filterBlockBatch(requests, blocks)
            yield {
                ...batch,
                blocks
            }
        }
    }

    async processHotBlocks(
        requests: RangeRequestList<DataRequest>,
        state: HotDatabaseState,
        cb: (upd: HotUpdate<Block>) => Promise<void>
    ): Promise<void> {
        return this.baseDataSource.processHotBlocks(
            mapRangeRequestList(requests, toBaseDataRequest),
            state,
            upd => {
                let blocks = upd.blocks.map(b => this.mapBlock(b))
                filterBlockBatch(requests, blocks)
                return cb({...upd, blocks})
            }
        )
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
                call._ethereumTransactTo = s._ethereumTransactTo
                call._ethereumTransactSighash = s._ethereumTransactSighash
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
                if (s.topics != null) {
                    event.topics = s.topics
                }
                event._evmLogAddress = s._evmLogAddress
                event._evmLogTopics = s._evmLogTopics
                event._contractAddress = s._contractAddress
                event._gearProgramId = s._gearProgramId
                block.events.push(event)
            }
        }

        setUpItems(block)
        return block
    }
}


function toBaseDataRequest(req: DataRequest): base.DataRequest {
    let events = !!req.events?.length
        || !!req.evmLogs?.length
        || !!req.contractsEvents?.length
        || !!req.gearMessagesQueued?.length
        || !!req.gearUserMessagesSent?.length
        || req.calls?.some(c => c.events)
        || req.ethereumTransactions?.some(c => c.events)
        || false

    let calls = !!req.calls?.length
        || !!req.ethereumTransactions?.length
        || req.events?.some(e => e.extrinsic || e.call || e.stack)
        || req.evmLogs?.some(e => e.extrinsic || e.call || e.stack)
        || req.contractsEvents?.some(e => e.extrinsic || e.call || e.stack)
        || req.gearMessagesQueued?.some(e => e.extrinsic || e.call || e.stack)
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
