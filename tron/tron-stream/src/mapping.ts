// import {TransactionResult} from '@subsquid/tron-data'
// import {HashAndHeight} from '@subsquid/util-internal-processor-tools'
// import {PartialBlockHeader} from './interfaces/data-partial'


// export class BlockHeader implements PartialBlockHeader {
//     id: string
//     height!: number
//     hash!: string
//     parentHash!: string
//     txTrieRoot?: string
//     version?: number
//     timestamp?: number
//     witnessAddress?: string
//     witnessSignature?: string

//     constructor(src: PartialBlockHeader) {
//         this.id = formatId(src)
//         Object.assign(this, src)
//     }
// }


// export class Transaction {
//     hash: string
//     ret?: TransactionResult[]
//     signature?: string[]
//     type?: string
//     parameter?: any
//     permissionId?: number
//     refBlockBytes?: string
//     refBlockHash?: string
//     feeLimit?: number
//     expiration?: number
//     timestamp?: number
//     rawDataHex?: string
//     fee?: number
//     contractResult?: string
//     contractAddress?: string
//     resMessage?: string
//     withdrawAmount?: number
//     unfreezeAmount?: number
//     withdrawExpireAmount?: number
//     cancelUnfreezeV2Amount: any
//     result?: string
//     energyFee?: number
//     energyUsage?: number
//     energyUsageTotal?: number
//     netUsage?: number
//     netFee?: number
//     originEnergyUsage?: number
//     energyPenaltyTotal?: number
//     #block: BlockHeader
//     #logs?: Log[]
//     #internalTransactions?: InternalTransaction[]

//     constructor(
//         block: BlockHeader,
//         hash: string
//     ) {
//         this.hash = hash
//         this.#block = block
//     }

//     get block(): BlockHeader {
//         return this.#block
//     }

//     set block(value: BlockHeader) {
//         this.#block = value
//     }

//     get logs(): Log[] {
//         return this.#logs || []
//     }

//     set logs(logs: Log[]) {
//         this.#logs = logs
//     }

//     get internalTransactions(): InternalTransaction[] {
//         return this.#internalTransactions || []
//     }

//     set internalTransactions(internalTransactions: InternalTransaction[]) {
//         this.#internalTransactions = internalTransactions
//     }
// }


// export class InternalTransaction {
//     transactionHash: string
//     hash?: string
//     callerAddress?: string
//     transferToAddress?: string
//     callValueInfo?: {
//         callValue?: number
//         tokenId?: string
//     }[]
//     note?: string
//     rejected?: boolean
//     extra?: string
//     #block: BlockHeader
//     #transaction?: Transaction

//     constructor(
//         block: BlockHeader,
//         transactionHash: string
//     ) {
//         this.transactionHash = transactionHash
//         this.#block = block
//     }

//     get block(): BlockHeader {
//         return this.#block
//     }

//     set block(value: BlockHeader) {
//         this.#block = value
//     }

//     get transaction(): Transaction | undefined {
//         return this.#transaction
//     }

//     set transaction(value: Transaction | undefined) {
//         this.#transaction = value
//     }

//     getTransaction(): Transaction {
//         if (this.#transaction == null) {
//             throw new Error(`Extrinsic is not set on internal transaction ${this.hash}`)
//         } else {
//             return this.#transaction
//         }
//     }
// }


// export class Log {
//     id: string
//     logIndex: number
//     transactionHash: string
//     address?: string
//     data?: string
//     topics?: string[]
//     #block: BlockHeader
//     #transaction?: Transaction

//     constructor(
//         block: BlockHeader,
//         logIndex: number,
//         transactionHash: string
//     ) {
//         this.id = formatId(block, logIndex)
//         this.logIndex = logIndex
//         this.transactionHash = transactionHash
//         this.#block = block
//     }

//     get block(): BlockHeader {
//         return this.#block
//     }

//     set block(value: BlockHeader) {
//         this.#block = value
//     }

//     get transaction(): Transaction | undefined {
//         return this.#transaction
//     }

//     set transaction(value: Transaction | undefined) {
//         this.#transaction = value
//     }

//     getTransaction(): Transaction {
//         if (this.#transaction == null) {
//             throw new Error(`Transaction is not set on log ${this.id}`)
//         } else {
//             return this.#transaction
//         }
//     }
// }


// export class Block {
//     constructor(public header: BlockHeader) {}
//     transactions: Transaction[] = []
//     internalTransactions: InternalTransaction[] = []
//     logs: Log[] = []
// }


// export function setUpItems(block: Block): void {
//     let txByHash = new Map(block.transactions.map(tx => [tx.hash, tx]))

//     for (let i = 0; i < block.internalTransactions.length; i++) {
//         let internalTx = block.internalTransactions[i]
//         let tx = txByHash.get(internalTx.transactionHash)
//         if (tx) {
//             internalTx.transaction = tx
//         }
//     }

//     for (let log of block.logs) {
//         let tx = txByHash.get(log.transactionHash)
//         if (tx) {
//             tx.logs.push(log)
//             log.transaction = tx
//         }
//     }
// }


// function formatId(block: HashAndHeight, ...address: number[]): string {
//     let no = block.height.toString().padStart(10, '0')
//     let hash = block.hash.slice(16).slice(0, 5)
//     let id = `${no}-${hash}`
//     for (let index of address) {
//         id += '-' + index.toString().padStart(6, '0')
//     }
//     return id
// }
