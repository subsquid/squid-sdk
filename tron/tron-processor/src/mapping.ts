import {Bytes, ExtrinsicSignature, Hash, QualifiedName} from '@subsquid/substrate-data'
import {assertNotNull} from '@subsquid/util-internal'
import {HashAndHeight} from '@subsquid/util-internal-processor-tools'
import {PartialBlockHeader} from './interfaces/data-partial'


export class BlockHeader implements PartialBlockHeader {
    id: string
    height!: number
    hash!: Hash
    parentHash!: Hash
    timestamp?: number

    constructor(src: PartialBlockHeader) {
        this.id = formatId(src)
        Object.assign(this, src)
    }
}


export class Transaction {
    id: string
    index: number
    hash?: string
    #block: BlockHeader
    // #call?: InternalTransaction
    // #events?: Log[]
    // #subcalls?: InternalTransaction[]

    constructor(
        block: BlockHeader,
        index: number
    ) {
        this.id = formatId(block, index)
        this.index = index
        this.#block = block
    }

    // get block(): BlockHeader {
    //     return this.#block
    // }

    // set block(value: BlockHeader) {
    //     this.#block = value
    // }

    // get events(): Log[] {
    //     this.#events = this.#events || []
    //     return this.#events
    // }

    // set events(events: Log[]) {
    //     this.#events = events
    // }

    // encode(): Uint8Array {
    //     let runtime = this.block._runtime
    //     let version = assertNotNull(this.version, 'missing .version property')

    //     let callRecord = this.getCall()
    //     let name = assertNotNull(callRecord.name, 'missing .name property on a call')
    //     let args = runtime.decodeJsonCallRecordArguments({name, args: callRecord.args})
    //     let call = runtime.toDecodedCall({name, args})

    //     let signature = this.signature && runtime.jsonCodec.decode(
    //         runtime.description.signature,
    //         this.signature
    //     )

    //     return runtime.encodeExtrinsic({
    //         version,
    //         signature,
    //         call
    //     })
    // }
}


export class InternalTransaction {
    id: string
    name?: QualifiedName
    args?: any
    origin?: any
    error?: any
    success?: boolean
    #block: BlockHeader
    #extrinsic?: Transaction
    #parentCall?: InternalTransaction
    #subcalls?: InternalTransaction[]
    #events?: Log[]
    #ethereumTransactTo?: Bytes
    #ethereumTransactSighash?: Bytes

    constructor(
        block: BlockHeader,
        transactionIndex: number
    ) {
        this.id = formatId(block, transactionIndex)
        // this.extrinsicIndex = transactionIndex
        this.#block = block
    }

    // get block(): BlockHeader {
    //     return this.#block
    // }

    // set block(value: BlockHeader) {
    //     this.#block = value
    // }

    // get extrinsic(): Transaction | undefined {
    //     return this.#extrinsic
    // }

    // set extrinsic(value: Transaction | undefined) {
    //     this.#extrinsic = value
    // }

    // getExtrinsic(): Transaction {
    //     if (this.extrinsic == null) {
    //         throw new Error(`Extrinsic is not set on call ${this.id}`)
    //     } else {
    //         return this.extrinsic
    //     }
    // }

    // get parentCall(): InternalTransaction | undefined {
    //     return this.#parentCall
    // }

    // set parentCall(value: InternalTransaction | undefined) {
    //     this.#parentCall = value
    // }

    // getParentCall(): InternalTransaction {
    //     if (this.parentCall == null) {
    //         throw new Error(`Parent call is not set on call ${this.id}`)
    //     } else {
    //         return this.parentCall
    //     }
    // }

    // get subcalls(): InternalTransaction[] {
    //     this.#subcalls = this.#subcalls || []
    //     return this.#subcalls
    // }

    // set subcalls(calls: InternalTransaction[]) {
    //     this.#subcalls = calls
    // }

    // get events(): Log[] {
    //     this.#events = this.#events || []
    //     return this.#events
    // }

    // set events(events: Log[]) {
    //     this.#events = events
    // }

    // encode(): Uint8Array {
    //     let runtime = this.block._runtime
    //     let name = assertNotNull(this.name, 'missing .name property')
    //     let args = runtime.decodeJsonCallRecordArguments({name, args: this.args})
    //     let decodedCall = runtime.toDecodedCall({name, args})
    //     return runtime.encodeCall(decodedCall)
    // }

    // get _ethereumTransactTo(): Bytes | undefined {
    //     return this.#ethereumTransactTo
    // }

    // set _ethereumTransactTo(value: Bytes | undefined) {
    //     this.#ethereumTransactTo = value
    // }

    // get _ethereumTransactSighash(): Bytes | undefined {
    //     return this.#ethereumTransactSighash
    // }

    // set _ethereumTransactSighash(value: Bytes | undefined) {
    //     this.#ethereumTransactSighash = value
    // }
}


export class Log {
    id: string
    index: number
    name?: QualifiedName
    args?: any
    phase?: 'Initialization' | 'ApplyExtrinsic' | 'Finalization'
    extrinsicIndex?: number
    callAddress?: number[]
    #block: BlockHeader
    #extrinsic?: Transaction
    #call?: InternalTransaction
    #evmLogAddress?: Bytes
    #evmLogTopics?: Bytes[]
    #contractAddress?: Bytes
    #gearProgramId?: Bytes

    constructor(
        block: BlockHeader,
        index: number
    ) {
        this.id = formatId(block, index)
        this.index = index
        this.#block = block
    }

    get block(): BlockHeader {
        return this.#block
    }

    set block(value: BlockHeader) {
        this.#block = value
    }

    get extrinsic(): Transaction | undefined {
        return this.#extrinsic
    }

    set extrinsic(value: Transaction | undefined) {
        this.#extrinsic = value
    }

    getExtrinsic(): Transaction {
        if (this.extrinsic == null) {
            throw new Error(`Extrinsic is not set on event ${this.id}`)
        } else {
            return this.extrinsic
        }
    }

    get call(): InternalTransaction | undefined {
        return this.#call
    }

    set call(value: InternalTransaction | undefined) {
        this.#call = value
    }

    getCall(): InternalTransaction {
        if (this.call == null) {
            throw new Error(`Call is not set on event ${this.id}`)
        } else {
            return this.call
        }
    }

    get _evmLogAddress(): Bytes | undefined {
        return this.#evmLogAddress
    }

    set _evmLogAddress(value: Bytes | undefined) {
        this.#evmLogAddress = value
    }

    get _evmLogTopics(): Bytes[] | undefined {
        return this.#evmLogTopics
    }

    set _evmLogTopics(value: Bytes[] | undefined) {
        this.#evmLogTopics = value
    }

    get _evmLogTopic0(): Bytes | undefined {
        return this._evmLogTopics?.[0]
    }

    get _evmLogTopic1(): Bytes | undefined {
        return this._evmLogTopics?.[1]
    }

    get _evmLogTopic2(): Bytes | undefined {
        return this._evmLogTopics?.[2]
    }

    get _evmLogTopic3(): Bytes | undefined {
        return this._evmLogTopics?.[3]
    }

    get _contractAddress(): Bytes | undefined {
        return this.#contractAddress
    }

    set _contractAddress(value: Bytes | undefined) {
        this.#contractAddress = value
    }

    get _gearProgramId(): Bytes | undefined {
        return this.#gearProgramId
    }

    set _gearProgramId(value: Bytes | undefined) {
        this.#gearProgramId = value
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
    let hash = block.hash.startsWith('0x')
        ? block.hash.slice(2, 7)
        : block.hash.slice(0, 5)
    let id = `${no}-${hash}`
    for (let index of address) {
        id += '-' + index.toString().padStart(6, '0')
    }
    return id
}
