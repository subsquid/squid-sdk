// import {annotateSyncError} from '@subsquid/util-internal'
// import {ArchiveClient} from '@subsquid/util-internal-archive-client'
// import {Batch, DataSource} from '@subsquid/util-internal-processor-tools'
// import {RangeRequestList} from '@subsquid/util-internal-range'
// import {archiveIngest} from '@subsquid/util-internal-ingest-tools'
// import {HttpApi} from '@subsquid/tron-data-raw'
// import {ArchiveBlock} from './interfaces/data-partial'
// import {DataRequest} from './interfaces/data-request'
// import {Block, BlockHeader, InternalTransaction, Log, Transaction, setUpItems} from './mapping'


// export interface TronArchiveOptions {
//     client: ArchiveClient
//     httpApi: HttpApi
// }


// export class TronArchive implements DataSource<Block, DataRequest> {
//     private client: ArchiveClient
//     private httpApi: HttpApi

//     constructor(options: TronArchiveOptions) {
//         this.client = options.client
//         this.httpApi = options.httpApi
//     }

//     getFinalizedHeight(): Promise<number> {
//         return this.client.getHeight()
//     }

//     getBlockHash(height: number): Promise<string> {
//         return this.httpApi.getBlock(height, false).then(block => block.blockID)
//     }

//     async *getFinalizedBlocks(requests: RangeRequestList<DataRequest>, stopOnHead?: boolean): AsyncIterable<Batch<Block>> {
//         for await (let {blocks, isHead} of archiveIngest<ArchiveBlock>({
//             requests,
//             client: this.client,
//             stopOnHead
//         })) {
//             yield {
//                 blocks: blocks.map(b => this.mapBlock(b)),
//                 isHead
//             }
//         }
//     }

//     @annotateSyncError((src: ArchiveBlock) => ({blockHeight: src.header.number, blockHash: src.header.hash}))
//     private mapBlock(src: ArchiveBlock): Block {
//         let block = new Block(new BlockHeader(
//             {
//                 height: src.header.number,
//                 ...src.header
//             }
//         ))

//         if (src.transactions) {
//             for (let s of src.transactions) {
//                 let tx = new Transaction(block.header, s.hash)

//                 if (s.ret != null) {
//                     tx.ret = s.ret
//                 }

//                 if (s.signature != null) {
//                     tx.signature = s.signature
//                 }

//                 if (s.type != null) {
//                     tx.type = s.type
//                 }

//                 if (s.parameter != null) {
//                     tx.parameter = s.parameter
//                 }

//                 if (s.permissionId != null) {
//                     tx.permissionId = s.permissionId
//                 }

//                 if (s.refBlockBytes != null) {
//                     tx.refBlockBytes = s.refBlockBytes
//                 }

//                 if (s.refBlockHash != null) {
//                     tx.refBlockHash = s.refBlockHash
//                 }

//                 if (s.feeLimit != null) {
//                     tx.feeLimit = s.feeLimit
//                 }

//                 if (s.expiration != null) {
//                     tx.expiration = s.expiration
//                 }

//                 if (s.timestamp != null) {
//                     tx.timestamp = s.timestamp
//                 }

//                 if (s.rawDataHex != null) {
//                     tx.rawDataHex = s.rawDataHex
//                 }

//                 if (s.fee != null) {
//                     tx.fee = s.fee
//                 }

//                 if (s.contractResult != null) {
//                     tx.contractResult = s.contractResult
//                 }

//                 if (s.contractAddress != null) {
//                     tx.contractAddress = s.contractAddress
//                 }

//                 if (s.resMessage != null) {
//                     tx.resMessage = s.resMessage
//                 }

//                 if (s.withdrawAmount != null) {
//                     tx.withdrawAmount = s.withdrawAmount
//                 }

//                 if (s.unfreezeAmount != null) {
//                     tx.unfreezeAmount = s.unfreezeAmount
//                 }

//                 if (s.withdrawExpireAmount != null) {
//                     tx.withdrawExpireAmount = s.withdrawExpireAmount
//                 }

//                 if (s.cancelUnfreezeV2Amount != null) {
//                     tx.cancelUnfreezeV2Amount = s.cancelUnfreezeV2Amount
//                 }

//                 if (s.result != null) {
//                     tx.result = s.result
//                 }

//                 if (s.energyFee != null) {
//                     tx.energyFee = s.energyFee
//                 }

//                 if (s.energyUsage != null) {
//                     tx.energyUsage = s.energyUsage
//                 }

//                 if (s.energyUsageTotal != null) {
//                     tx.energyUsageTotal = s.energyUsageTotal
//                 }

//                 if (s.netUsage != null) {
//                     tx.netUsage = s.netUsage
//                 }

//                 if (s.netFee != null) {
//                     tx.netFee = s.netFee
//                 }

//                 if (s.originEnergyUsage != null) {
//                     tx.originEnergyUsage = s.originEnergyUsage
//                 }

//                 if (s.energyPenaltyTotal != null) {
//                     tx.energyPenaltyTotal = s.energyPenaltyTotal
//                 }

//                 block.transactions.push(tx)
//             }
//         }

//         if (src.internalTransactions) {
//             for (let s of src.internalTransactions) {
//                 let tx = new InternalTransaction(block.header, s.transactionHash)

//                 if (s.hash != null) {
//                     tx.hash = s.hash
//                 }

//                 if (s.callerAddress != null) {
//                     tx.callerAddress = s.callerAddress
//                 }

//                 if (s.transferToAddress != null) {
//                     tx.transferToAddress = s.transferToAddress
//                 }

//                 if (s.callValueInfo != null) {
//                     tx.callValueInfo = s.callValueInfo
//                 }

//                 if (s.note != null) {
//                     tx.note = s.note
//                 }

//                 if (s.rejected != null) {
//                     tx.rejected = s.rejected
//                 }

//                 if (s.extra != null) {
//                     tx.extra = s.extra
//                 }

//                 block.internalTransactions.push(tx)
//             }
//         }

//         if (src.logs) {
//             for (let s of src.logs) {
//                 let log = new Log(block.header, s.logIndex, s.transactionHash)

//                 if (s.address != null) {
//                     log.address = s.address
//                 }

//                 if (s.data != null) {
//                     log.data = s.data
//                 }

//                 if (s.topics != null) {
//                     log.topics = s.topics
//                 }

//                 block.logs.push(log)
//             }
//         }

//         setUpItems(block)
//         return block
//     }
// }
