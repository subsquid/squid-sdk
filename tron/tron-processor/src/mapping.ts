import {Bytes, ExtrinsicSignature, Hash, QualifiedName} from '@subsquid/substrate-data'
import {assertNotNull} from '@subsquid/util-internal'
import {HashAndHeight} from '@subsquid/util-internal-processor-tools'
import {PartialBlockHeader} from './interfaces/data-partial'


export class BlockHeader implements PartialBlockHeader {
    id: string
    height!: number
    hash!: Hash
    parentHash!: Hash
    txTrieRoot?: string
    version?: number
    timestamp?: number
    witnessAddress?: string
    witnessSignature?: string

    constructor(src: PartialBlockHeader) {
        this.id = formatId(src)
        Object.assign(this, src)
    }
}


export class Transaction {
    hash?: string
    ret?: string
    signature?: string[]
    type?: string
    parameter?: any
    permissionId?: number
    refBlockBytes?: string
    refBlockHash?: string
    feeLimit?: number
    expiration?: number
    timestamp?: number
    rawDataHex?: string
    fee?: number
    contractResult?: string
    contractAddress?: string
    resMessage?: string
    withdrawAmount?: number
    unfreezeAmount?: number
    withdrawExpireAmount?: number
    cancelUnfreezeV2Amount: any
    result?: string
    energyFee?: number
    energyUsage?: number
    energyUsageTotal?: number
    netUsage?: number
    netFee?: number
    originEnergyUsage?: number
    energyPenaltyTotal?: number
    #block: BlockHeader
    #logs?: Log[]
    #internalTransactions?: InternalTransaction[]

    constructor(block: BlockHeader) {
        this.#block = block
    }

    get block(): BlockHeader {
        return this.#block
    }

    set block(value: BlockHeader) {
        this.#block = value
    }

    get logs(): Log[] {
        return this.#logs || []
    }

    set logs(logs: Log[]) {
        this.#logs = logs
    }

    get internalTransactions(): InternalTransaction[] {
        return this.#internalTransactions || []
    }

    set internalTransactions(internalTransactions: InternalTransaction[]) {
        this.#internalTransactions = internalTransactions
    }
}


export class InternalTransaction {
    transactionHash?: string
    hash?: string
    callerAddress?: string
    transferToAddress?: string
    callValueInfo?: {
        callValue?: number
        tokenId?: string
    }[]
    note?: string
    rejected?: boolean
    extra?: string
    #block: BlockHeader
    #transaction?: Transaction

    constructor(block: BlockHeader) {
        this.#block = block
    }

    get block(): BlockHeader {
        return this.#block
    }

    set block(value: BlockHeader) {
        this.#block = value
    }

    get transaction(): Transaction | undefined {
        return this.#transaction
    }

    set transaction(value: Transaction | undefined) {
        this.#transaction = value
    }

    getTransaction(): Transaction {
        if (this.#transaction == null) {
            throw new Error(`Extrinsic is not set on internal transaction ${this.hash}`)
        } else {
            return this.#transaction
        }
    }
}


export class Log {
    id: string
    logIndex: number
    transactionHash?: string
    address?: string
    data?: string
    topics?: string[]
    #block: BlockHeader
    #transaction?: Transaction

    constructor(
        block: BlockHeader,
        logIndex: number
    ) {
        this.id = formatId(block, logIndex)
        this.logIndex = logIndex
        this.#block = block
    }

    get block(): BlockHeader {
        return this.#block
    }

    set block(value: BlockHeader) {
        this.#block = value
    }

    get transaction(): Transaction | undefined {
        return this.#transaction
    }

    set transaction(value: Transaction | undefined) {
        this.#transaction = value
    }

    getTransaction(): Transaction {
        if (this.#transaction == null) {
            throw new Error(`Transaction is not set on log ${this.id}`)
        } else {
            return this.#transaction
        }
    }
}


export class Block {
    constructor(public header: BlockHeader) {}
    transactions: Transaction[] = []
    internalTransactions: InternalTransaction[] = []
    logs: Log[] = []
}


// export function setUpItems(block: Block): void {
//     block.logs.sort((a, b) => a.index - b.index)
//     block.transactions.sort((a, b) => a.index - b.index)
//     block.internalTransactions.sort(callCompare)

//     let extrinsicsByIndex = new Map(block.transactions.map(ex => [ex.index, ex]))

//     for (let i = 0; i < block.internalTransactions.length; i++) {
//         let call = block.internalTransactions[i]
//         let extrinsic = extrinsicsByIndex.get(call.extrinsicIndex)
//         if (extrinsic) {
//             if (call.address.length == 0) {
//                 extrinsic.call = call
//             }
//             call.extrinsic = extrinsic
//             extrinsic.subcalls.push(call)
//         }
//         setUpCallTree(block.internalTransactions, i)
//     }

//     for (let event of block.logs) {
//         if (event.extrinsicIndex == null) continue
//         let extrinsic = extrinsicsByIndex.get(event.extrinsicIndex)
//         if (extrinsic) {
//             extrinsic.events.push(event)
//             event.extrinsic = extrinsic
//         }
//         if (event.callAddress && block.internalTransactions.length) {
//             let pos = bisectCalls(block.internalTransactions, event.extrinsicIndex, event.callAddress)
//             for (let i = pos; i < block.internalTransactions.length; i++) {
//                 let call = block.internalTransactions[i]
//                 if (isSubcall(call, {extrinsicIndex: event.extrinsicIndex, address: event.callAddress})) {
//                     call.events.push(event)
//                     if (addressCompare(call.address, event.callAddress) == 0) {
//                         event.call = call
//                     }
//                 } else {
//                     break
//                 }
//             }
//         }
//     }
// }


// function bisectCalls(calls: InternalTransaction[], extrinsicIndex: number, callAddress: number[]): number {
//     let beg = 0
//     let end = calls.length
//     while (beg + 1 < end) {
//         let dist = end - beg
//         let pos = beg + (dist - (dist % 2)) / 2
//         let call = calls[pos]
//         let order = call.extrinsicIndex - extrinsicIndex || addressCompare(call.address, callAddress)
//         if (order == 0) return pos
//         if (order > 0) {
//             end = pos
//         } else {
//             beg = pos
//         }
//     }
//     return beg
// }


// function setUpCallTree(calls: InternalTransaction[], pos: number): void {
//     let offset = -1
//     let parent = calls[pos]
//     for (let i = pos - 1; i >= 0; i--) {
//         if (isSubcall(parent, calls[i])) {
//             if (calls[i].address.length == parent.address.length + 1) {
//                 calls[i].parentCall = parent
//             }
//             offset = i
//         } else {
//             break
//         }
//     }
//     if (offset < 0) return
//     parent.subcalls = calls.slice(offset, pos)
// }


// function callCompare(a: InternalTransaction, b: InternalTransaction) {
//     return a.extrinsicIndex - b.extrinsicIndex || addressCompare(a.address, b.address)
// }


// function addressCompare(a: number[], b: number[]): number {
//     for (let i = 0; i < Math.min(a.length, b.length); i++) {
//         let order = a[i] - b[i]
//         if (order) return order
//     }
//     return b.length - a.length
// }


// type CallKey = Pick<InternalTransaction, 'extrinsicIndex' | 'address'>


// function isSubcall(parent: CallKey, call: CallKey): boolean {
//     if (parent.extrinsicIndex != call.extrinsicIndex) return false
//     if (parent.address.length > call.address.length) return false
//     for (let i = 0; i < parent.address.length; i++) {
//         if (parent.address[i] != call.address[i]) return false
//     }
//     return true
// }


function formatId(block: HashAndHeight, ...address: number[]): string {
    let no = block.height.toString().padStart(10, '0')
    let hash = block.hash.slice(16).slice(0, 5)
    let id = `${no}-${hash}`
    for (let index of address) {
        id += '-' + index.toString().padStart(6, '0')
    }
    return id
}
