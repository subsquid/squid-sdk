import {Bytes, ExtrinsicSignature, Hash, QualifiedName} from '@subsquid/substrate-data'
import {Runtime} from '@subsquid/substrate-runtime'
import {assertNotNull, maybeLast} from '@subsquid/util-internal'
import {formatId} from '@subsquid/util-internal-processor-tools'
import {ParentBlockHeader} from './interfaces/data'
import {PartialBlockHeader} from './interfaces/data-partial'


export class BlockHeader implements PartialBlockHeader {
    id: string
    height!: number
    hash!: Hash
    parentHash!: Hash
    stateRoot?: Hash
    extrinsicsRoot?: Hash
    digest?: {logs: Bytes[]}
    specName!: string
    specVersion!: number
    implName!: string
    implVersion!: number
    timestamp?: number
    validator?: Bytes
    #runtime: Runtime
    #runtimeOfPrevBlock: Runtime

    constructor(
        runtime: Runtime,
        runtimeOfPrevBlock: Runtime,
        src: PartialBlockHeader
    ) {
        this.id = formatId(src)
        this.#runtime = runtime
        this.#runtimeOfPrevBlock = runtimeOfPrevBlock
        Object.assign(this, src)
    }

    get _runtime(): Runtime {
        return this.#runtime
    }

    get _runtimeOfPrevBlock(): Runtime {
        return this.#runtimeOfPrevBlock
    }

    getParent(): ParentBlockHeader {
        if (this.height == 0) return this
        return {
            _runtime: this._runtimeOfPrevBlock,
            height: this.height - 1,
            hash: this.parentHash
        }
    }
}


export class Extrinsic {
    id: string
    index: number
    version?: number
    signature?: ExtrinsicSignature
    fee?: bigint
    tip?: bigint
    error?: any
    success?: boolean
    hash?: string
    #block: BlockHeader
    #call?: Call
    #events?: Event[]
    #subcalls?: Call[]

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

    get call(): Call | undefined {
        return this.#call
    }

    set call(value: Call | undefined) {
        this.#call = value
    }

    getCall(): Call {
        if (this.call == null) {
            throw new Error(`Call is not set on extrinsic ${this.id}`)
        } else {
            return this.call
        }
    }

    get subcalls(): Call[] {
        this.#subcalls = this.#subcalls || []
        return this.#subcalls
    }

    set subcalls(calls: Call[]) {
        this.#subcalls = calls
    }

    get events(): Event[] {
        this.#events = this.#events || []
        return this.#events
    }

    set events(events: Event[]) {
        this.#events = events
    }

    encode(): Uint8Array {
        let runtime = this.block._runtime
        let version = assertNotNull(this.version, 'missing .version property')

        let callRecord = this.getCall()
        let name = assertNotNull(callRecord.name, 'missing .name property on a call')
        let args = runtime.decodeJsonCallRecordArguments({name, args: callRecord.args})
        let call = runtime.toDecodedCall({name, args})

        let signature = this.signature && runtime.jsonCodec.decode(
            runtime.description.signature,
            this.signature
        )

        return runtime.encodeExtrinsic({
            version,
            signature,
            call
        })
    }
}


export class Call {
    id: string
    extrinsicIndex: number
    address: number[]
    name?: QualifiedName
    args?: any
    origin?: any
    error?: any
    success?: boolean
    #block: BlockHeader
    #extrinsic?: Extrinsic
    #parentCall?: Call
    #subcalls?: Call[]
    #events?: Event[]
    #ethereumTransactTo?: Bytes
    #ethereumTransactSighash?: Bytes

    constructor(
        block: BlockHeader,
        extrinsicIndex: number,
        address: number[]
    ) {
        this.id = formatId(block, extrinsicIndex, ...address)
        this.extrinsicIndex = extrinsicIndex
        this.address = address
        this.#block = block
    }

    get block(): BlockHeader {
        return this.#block
    }

    set block(value: BlockHeader) {
        this.#block = value
    }

    get extrinsic(): Extrinsic | undefined {
        return this.#extrinsic
    }

    set extrinsic(value: Extrinsic | undefined) {
        this.#extrinsic = value
    }

    getExtrinsic(): Extrinsic {
        if (this.extrinsic == null) {
            throw new Error(`Extrinsic is not set on call ${this.id}`)
        } else {
            return this.extrinsic
        }
    }

    get parentCall(): Call | undefined {
        return this.#parentCall
    }

    set parentCall(value: Call | undefined) {
        this.#parentCall = value
    }

    getParentCall(): Call {
        if (this.parentCall == null) {
            throw new Error(`Parent call is not set on call ${this.id}`)
        } else {
            return this.parentCall
        }
    }

    get subcalls(): Call[] {
        this.#subcalls = this.#subcalls || []
        return this.#subcalls
    }

    set subcalls(calls: Call[]) {
        this.#subcalls = calls
    }

    get events(): Event[] {
        this.#events = this.#events || []
        return this.#events
    }

    set events(events: Event[]) {
        this.#events = events
    }

    encode(): Uint8Array {
        let runtime = this.block._runtime
        let name = assertNotNull(this.name, 'missing .name property')
        let args = runtime.decodeJsonCallRecordArguments({name, args: this.args})
        let decodedCall = runtime.toDecodedCall({name, args})
        return runtime.encodeCall(decodedCall)
    }

    get _ethereumTransactTo(): Bytes | undefined {
        return this.#ethereumTransactTo
    }

    set _ethereumTransactTo(value: Bytes | undefined) {
        this.#ethereumTransactTo = value
    }

    get _ethereumTransactSighash(): Bytes | undefined {
        return this.#ethereumTransactSighash
    }

    set _ethereumTransactSighash(value: Bytes | undefined) {
        this.#ethereumTransactSighash = value
    }
}


export class Event {
    id: string
    index: number
    name?: QualifiedName
    args?: any
    phase?: 'Initialization' | 'ApplyExtrinsic' | 'Finalization'
    extrinsicIndex?: number
    callAddress?: number[]
    topics?: Bytes[]
    #block: BlockHeader
    #extrinsic?: Extrinsic
    #call?: Call
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

    get extrinsic(): Extrinsic | undefined {
        return this.#extrinsic
    }

    set extrinsic(value: Extrinsic | undefined) {
        this.#extrinsic = value
    }

    getExtrinsic(): Extrinsic {
        if (this.extrinsic == null) {
            throw new Error(`Extrinsic is not set on event ${this.id}`)
        } else {
            return this.extrinsic
        }
    }

    get call(): Call | undefined {
        return this.#call
    }

    set call(value: Call | undefined) {
        this.#call = value
    }

    getCall(): Call {
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
    extrinsics: Extrinsic[] = []
    calls: Call[] = []
    events: Event[] = []
}


export function setUpItems(block: Block): void {
    block.events.sort((a, b) => a.index - b.index)
    block.extrinsics.sort((a, b) => a.index - b.index)
    block.calls.sort(callCompare)

    let extrinsics: (Extrinsic | undefined)[] = new Array((maybeLast(block.extrinsics)?.index ?? -1) + 1)
    for (let rec of block.extrinsics) {
        extrinsics[rec.index] = rec
    }

    for (let i = block.calls.length - 1; i >= 0; i--) {
        let rec = block.calls[i]
        let extrinsic = extrinsics[rec.extrinsicIndex]
        if (extrinsic) {
            if (rec.address.length == 0) {
                extrinsic.call = rec
            }
            rec.extrinsic = extrinsic
            extrinsic.subcalls.push(rec)
        }

        if (i < block.calls.length - 1) {
            let prev: Call | undefined = block.calls[i + 1]
            if (prev.extrinsicIndex == rec.extrinsicIndex) {
                while (prev != null) {
                    if (isSubcall(prev, rec)) {
                        rec.parentCall = prev
                        populateSubcalls(prev, rec)
                        break
                    }
                    prev = prev.parentCall
                }
            }
        }
    }

    for (let event of block.events) {
        if (event.extrinsicIndex == null) continue

        let extrinsic = extrinsics[event.extrinsicIndex]
        if (extrinsic) {
            extrinsic.events.push(event)
            event.extrinsic = extrinsic
        }

        if (event.callAddress && block.calls.length) {
            let pos = bisectCalls(block.calls, event.extrinsicIndex, event.callAddress)
            for (let i = pos; i < block.calls.length; i++) {
                let call = block.calls[i]
                if (isSubcall(call, {extrinsicIndex: event.extrinsicIndex, address: event.callAddress})) {
                    call.events.push(event)
                    if (addressCompare(call.address, event.callAddress) == 0) {
                        event.call = call
                    }
                } else {
                    break
                }
            }
        }
    }
}


function bisectCalls(calls: Call[], extrinsicIndex: number, callAddress: number[]): number {
    let beg = 0
    let end = calls.length
    while (beg + 1 < end) {
        let dist = end - beg
        let pos = beg + (dist - (dist % 2)) / 2
        let call = calls[pos]
        let order = call.extrinsicIndex - extrinsicIndex || addressCompare(call.address, callAddress)
        if (order == 0) return pos
        if (order > 0) {
            end = pos
        } else {
            beg = pos
        }
    }
    return beg
}


function populateSubcalls(parent: Call | undefined, child: Call): void {
    while (parent) {
        parent.subcalls.unshift(child)
        parent = parent.parentCall
    }
}


function callCompare(a: Call, b: Call) {
    return a.extrinsicIndex - b.extrinsicIndex || addressCompare(a.address, b.address)
}


function addressCompare(a: number[], b: number[]): number {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        let order = a[i] - b[i]
        if (order) return order
    }
    return b.length - a.length // this differs from EVM call ordering
}


type CallKey = Pick<Call, 'extrinsicIndex' | 'address'>


function isSubcall(parent: CallKey, call: CallKey): boolean {
    if (parent.extrinsicIndex != call.extrinsicIndex) return false
    if (parent.address.length > call.address.length) return false
    for (let i = 0; i < parent.address.length; i++) {
        if (parent.address[i] != call.address[i]) return false
    }
    return true
}
