import {Bytes, ExtrinsicSignature, Hash, QualifiedName} from '@subsquid/substrate-data'
import {Runtime} from '@subsquid/substrate-runtime'
import {HashAndHeight} from '@subsquid/util-internal-processor-tools'
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
        this.id = formatId(this)
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
    #block: PartialBlockHeader
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

    get block(): PartialBlockHeader {
        return this.#block
    }

    set block(value: PartialBlockHeader) {
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
    #block: PartialBlockHeader
    #extrinsic?: Extrinsic
    #parentCall?: Call
    #subcalls?: Call[]
    #events?: Event[]

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

    get block(): PartialBlockHeader {
        return this.#block
    }

    set block(value: PartialBlockHeader) {
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
}


export class Event {
    id: string
    index: number
    name?: QualifiedName
    args?: any
    phase?: 'Initialization' | 'ApplyExtrinsic' | 'Finalization'
    extrinsicIndex?: number
    callAddress?: number[]
    #block: BlockHeader
    #extrinsic?: Extrinsic
    #call?: Call

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

    let extrinsicsByIndex = new Map(block.extrinsics.map(ex => [ex.index, ex]))

    for (let i = 0; i < block.calls.length; i++) {
        let call = block.calls[i]
        let extrinsic = extrinsicsByIndex.get(call.extrinsicIndex)
        if (extrinsic) {
            if (call.address.length == 0) {
                extrinsic.call = call
            }
            call.extrinsic = extrinsic
            extrinsic.subcalls.push(call)
        }
        setUpCallTree(block.calls, i)
    }

    for (let event of block.events) {
        if (event.extrinsicIndex == null) continue
        let extrinsic = extrinsicsByIndex.get(event.extrinsicIndex)
        if (extrinsic) {
            extrinsic.events.push(event)
            event.extrinsic = extrinsic
        }
        if (event.callAddress && block.calls.length) {
            let pos = bisectCalls(block.calls, event.extrinsicIndex, event.callAddress)
            for (let i = pos; i >= 0; i--) {
                let parent = block.calls[pos]
                if (isSubcall(parent, {extrinsicIndex: event.extrinsicIndex, address: event.callAddress})) {
                    parent.events.push(event)
                    if (addressCompare(parent.address, event.callAddress) == 0) {
                        event.call = parent
                    }
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


function setUpCallTree(calls: Call[], pos: number): void {
    let offset = -1
    let parent = calls[pos]
    for (let i = pos - 1; i >= 0; i--) {
        if (isSubcall(parent, calls[i])) {
            if (calls[i].address.length == parent.address.length + 1) {
                calls[i].parentCall = parent
            }
            offset = i
        } else {
            break
        }
    }
    if (offset < 0) return
    parent.subcalls = calls.slice(offset, pos)
}


function callCompare(a: Call, b: Call) {
    return a.extrinsicIndex - b.extrinsicIndex || addressCompare(a.address, b.address)
}


function addressCompare(a: number[], b: number[]): number {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        let order = a[i] - b[i]
        if (order) return order
    }
    return b.length - a.length
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
