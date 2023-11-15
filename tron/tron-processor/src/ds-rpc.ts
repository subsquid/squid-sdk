// import type {RpcClient} from '@subsquid/rpc-client'
// import * as base from '@subsquid/substrate-data'
// import {annotateSyncError, AsyncQueue, ensureError} from '@subsquid/util-internal'
// import {toJSON} from '@subsquid/util-internal-json'
// import {
//     Batch,
//     HotDatabaseState,
//     HotDataSource,
//     HotUpdate,
//     RangeRequest,
//     RangeRequestList
// } from '@subsquid/util-internal-processor-tools'
// import {filterBlockBatch} from './filter'
// import {DataRequest} from './interfaces/data-request'
// import {Block, BlockHeader, InternalTransaction, Log, Transaction, setUpItems} from './mapping'


// export interface RpcDataSourceOptions {
//     rpc: RpcClient
//     pollInterval?: number
// }


// export class RpcDataSource implements HotDataSource<Block, DataRequest> {
//     private ds: base.RpcDataSource

//     constructor(options: RpcDataSourceOptions) {
//         this.ds = new base.RpcDataSource({
//             rpc: options.rpc,
//             pollInterval: options.pollInterval,
//         })
//     }

//     getBlockHash(height: number): Promise<string> {
//         return this.ds.getBlockHash(height)
//     }

//     getFinalizedHeight(): Promise<number> {
//         return this.ds.getFinalizedHeight()
//     }

//     async *getFinalizedBlocks(
//         requests: RangeRequestList<DataRequest>,
//         stopOnHead?: boolean
//     ): AsyncIterable<Batch<Block>> {
//         for await (let batch of this.ds.getFinalizedBlocks(
//             requests.map(toBaseRangeRequest),
//             stopOnHead
//         )) {
//             let blocks = batch.blocks.map(b => this.mapBlock(b))
//             filterBlockBatch(requests, blocks)
//             yield {
//                 ...batch,
//                 blocks
//             }
//         }
//     }

//     async *getHotBlocks(
//         requests: RangeRequestList<DataRequest>,
//         state: HotDatabaseState
//     ): AsyncIterable<HotUpdate<Block>> {
//         let queue = new AsyncQueue<HotUpdate<base.Block> | Error>(1)

//         this.ds.processHotBlocks(
//             requests.map(toBaseRangeRequest),
//             state,
//             upd => queue.put(upd)
//         ).then(
//             () => queue.close(),
//             err => queue.put(ensureError(err)).catch(err => {})
//         )

//         for await (let upd of queue.iterate()) {
//             if (upd instanceof Error) {
//                 throw upd
//             } else {
//                 let blocks = upd.blocks.map(b => this.mapBlock(b))
//                 filterBlockBatch(requests, blocks)
//                 yield {
//                     ...upd,
//                     blocks
//                 }
//             }
//         }
//     }

//     @annotateSyncError((src: base.Block) => ({blockHeight: src.header.height, blockHash: src.header.hash}))
//     private mapBlock(src: base.Block): Block {
//         let block = new Block(new BlockHeader(
//             src.runtime,
//             src.runtimeOfPrevBlock,
//             src.header
//         ))

//         if (src.extrinsics) {
//             for (let s of src.extrinsics) {
//                 let extrinsic = new Transaction(block.header, s.index)
//                 if (s.version != null) {
//                     extrinsic.version = s.version
//                 }
//                 if (s.signature != null) {
//                     extrinsic.signature = toJSON(s.signature)
//                 }
//                 if (s.fee != null) {
//                     extrinsic.fee = s.fee
//                 }
//                 if (s.tip != null) {
//                     extrinsic.tip = s.tip
//                 }
//                 if (s.error != null) {
//                     extrinsic.error = toJSON(s.error)
//                 }
//                 if (s.success != null) {
//                     extrinsic.success = s.success
//                 }
//                 if (s.hash != null) {
//                     extrinsic.hash = s.hash
//                 }
//                 block.transactions.push(extrinsic)
//             }
//         }

//         if (src.calls) {
//             for (let s of src.calls) {
//                 let call = new InternalTransaction(block.header, s.extrinsicIndex, s.address)
//                 if (s.name) {
//                     call.name = s.name
//                 }
//                 if (s.args != null) {
//                     call.args = toJSON(s.args)
//                 }
//                 if (s.origin != null) {
//                     call.origin = toJSON(s.origin)
//                 }
//                 if (s.error != null) {
//                     call.error = toJSON(s.error)
//                 }
//                 if (s.success != null) {
//                     call.success = s.success
//                 }
//                 call._ethereumTransactTo = s._ethereumTransactTo
//                 call._ethereumTransactSighash = s._ethereumTransactSighash
//                 block.internalTransactions.push(call)
//             }
//         }

//         if (src.events) {
//             for (let s of src.events) {
//                 let event = new Log(block.header, s.index)
//                 if (s.name != null) {
//                     event.name = s.name
//                 }
//                 if (s.args != null) {
//                     event.args = toJSON(s.args)
//                 }
//                 if (s.phase != null) {
//                     event.phase = s.phase
//                 }
//                 if (s.extrinsicIndex != null) {
//                     event.extrinsicIndex = s.extrinsicIndex
//                 }
//                 if (s.callAddress != null) {
//                     event.callAddress = s.callAddress
//                 }
//                 event._evmLogAddress = s._evmLogAddress
//                 event._evmLogTopics = s._evmLogTopics
//                 event._contractAddress = s._contractAddress
//                 event._gearProgramId = s._gearProgramId
//                 block.logs.push(event)
//             }
//         }

//         setUpItems(block)
//         return block
//     }
// }


// function toBaseRangeRequest(req: RangeRequest<DataRequest>): RangeRequest<base.DataRequest> {
//     return {
//         range: req.range,
//         request: toBaseDataRequest(req.request)
//     }
// }


// function toBaseDataRequest(req: DataRequest): base.DataRequest {
//     let events = !!req.logs?.length
//         || !!req.transferTransactions?.length
//         || !!req.triggerSmartContractTransactions?.length
//         || !!req.internalTransactions?.length
//         || !!req.gearUserMessagesSent?.length
//         || req.transactions?.some(c => c.events)
//         || req.transferAssetTransactions?.some(c => c.events)
//         || false

//     let calls = !!req.transactions?.length
//         || !!req.transferAssetTransactions?.length
//         || req.logs?.some(e => e.extrinsic || e.call || e.stack)
//         || req.transferTransactions?.some(e => e.extrinsic || e.call || e.stack)
//         || req.triggerSmartContractTransactions?.some(e => e.extrinsic || e.call || e.stack)
//         || req.internalTransactions?.some(e => e.extrinsic || e.call || e.stack)
//         || req.gearUserMessagesSent?.some(e => e.extrinsic || e.call || e.stack)
//         || false

//     let baseReq: base.DataRequest = {
//         blockTimestamp: !!req.fields?.block?.timestamp,
//         blockValidator: !!req.fields?.block?.validator,
//         events
//     }

//     if (calls) {
//         baseReq.extrinsics = {
//             hash: !!req.fields?.extrinsic?.hash,
//             fee: !!req.fields?.extrinsic?.fee
//         }
//     }

//     return baseReq
// }
