import {Bytes, Bytes20, Bytes32, Bytes8} from '@subsquid/evm-stream'
import {
    PartialBlock,
    PartialBlockHeader,
    PartialLog,
    PartialStateDiff,
    PartialTrace,
    PartialTransaction
} from '@subsquid/evm-stream/lib/data/partial'
import {
    EIP7702Authorization,
    EvmTraceCallAction,
    EvmTraceCallResult,
    EvmTraceCreateAction,
    EvmTraceCreateResult,
    EvmTraceRewardAction,
    EvmTraceSuicideAction
} from '@subsquid/evm-stream/lib/data/evm'
import {formatId} from './util'


export class Block {
    constructor(
        public header: BlockHeader,
        public transactions: Transaction[],
        public logs: Log[],
        public traces: Trace[],
        public stateDiffs: StateDiff[]
    ) {}

    static fromPartial(src: PartialBlock): Block {
        let header = new BlockHeader(src.header)

        return new Block(
            header,
            src.transactions.map(i => new Transaction(header, i)),
            src.logs.map(i => new Log(header, i)),
            src.traces.map(i => createTrace(header, i)),
            src.stateDiffs.map(i => createStateDiff(header, i))
        )
    }
}


export class BlockHeader implements PartialBlockHeader {
    id: string
    number: number
    height: number
    hash: Bytes32
    parentHash: Bytes32

    constructor(header: PartialBlockHeader) {
        this.id = formatId(header)
        this.number = header.number
        this.height = header.height
        this.hash = header.hash
        this.parentHash = header.parentHash
        Object.assign(this, header)
    }
}


export class Transaction implements PartialTransaction {
    id: string
    transactionIndex: number
    #block: BlockHeader
    #logs?: Log[]
    #traces?: Trace[]
    #stateDiffs?: StateDiff[]

    constructor(block: BlockHeader, tx: PartialTransaction) {
        this.id = formatId(block, tx.transactionIndex)
        this.transactionIndex = tx.transactionIndex
        this.#block = block
        Object.assign(this, tx)
    }

    get block(): BlockHeader {
        return this.#block
    }

    set block(value: BlockHeader) {
        this.#block = value
    }

    get logs(): Log[] {
        if (this.#logs == null) {
            this.#logs = []
        }
        return this.#logs
    }

    set logs(value: Log[]) {
        this.#logs = value
    }

    get traces(): Trace[] {
        if (this.#traces == null) {
            this.#traces = []
        }
        return this.#traces
    }

    set traces(value: Trace[]) {
        this.#traces = value
    }

    get stateDiffs(): StateDiff[] {
        if (this.#stateDiffs == null) {
            this.#stateDiffs = []
        }
        return this.#stateDiffs
    }

    set stateDiffs(value: StateDiff[]) {
        this.#stateDiffs = value
    }
}


export class Log implements PartialLog {
    id: string
    logIndex: number
    transactionIndex: number
    #block: BlockHeader
    #transaction?: Transaction

    constructor(block: BlockHeader, log: PartialLog) {
        this.id = formatId(block, log.logIndex)
        this.logIndex = log.logIndex
        this.transactionIndex = log.transactionIndex
        this.#block = block
        Object.assign(this, log)
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


class TraceBase {
    id: string
    transactionIndex: number
    traceAddress: number[]
    #block: BlockHeader
    #transaction?: Transaction
    #parent?: Trace
    #children?: Trace[]

    constructor(block: BlockHeader, trace: PartialTrace) {
        this.id = formatId(block, trace.transactionIndex, ...trace.traceAddress)
        this.transactionIndex = trace.transactionIndex
        this.traceAddress = trace.traceAddress
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
            throw new Error(`Transaction is not set on trace ${this.id}`)
        } else {
            return this.#transaction
        }
    }

    get parent(): Trace | undefined {
        return this.#parent
    }

    set parent(value: Trace | undefined) {
        this.#parent = value
    }

    getParent(): Trace {
        if (this.#parent == null) {
            throw new Error(`Parent is not set on trace ${this.id}`)
        } else {
            return this.#parent
        }
    }

    get children(): Trace[] {
        if (this.#children == null) {
            this.#children = []
        }
        return this.#children
    }

    set children(value: Trace[]) {
        this.#children = value
    }
}


export class TraceCreate extends TraceBase {
    type: 'create' = 'create'
    action?: Partial<EvmTraceCreateAction>
    result?: Partial<EvmTraceCreateResult>

    constructor(block: BlockHeader, trace: PartialTrace) {
        super(block, trace)
        Object.assign(this, trace)
    }
}


export class TraceCall extends TraceBase {
    type: 'call' = 'call'
    action?: Partial<EvmTraceCallAction>
    result?: Partial<EvmTraceCallResult>

    constructor(block: BlockHeader, trace: PartialTrace) {
        super(block, trace)
        Object.assign(this, trace)
    }
}


export class TraceSuicide extends TraceBase {
    type: 'suicide' = 'suicide'
    action?: Partial<EvmTraceSuicideAction>

    constructor(block: BlockHeader, trace: PartialTrace) {
        super(block, trace)
        Object.assign(this, trace)
    }
}


export class TraceReward extends TraceBase {
    type: 'reward' = 'reward'
    action?: Partial<EvmTraceRewardAction>

    constructor(block: BlockHeader, trace: PartialTrace) {
        super(block, trace)
        Object.assign(this, trace)
    }
}


export type Trace = TraceCreate | TraceCall | TraceSuicide | TraceReward


function createTrace(block: BlockHeader, trace: PartialTrace): Trace {
    switch (trace.type) {
        case 'create':
            return new TraceCreate(block, trace)
        case 'call':
            return new TraceCall(block, trace)
        case 'suicide':
            return new TraceSuicide(block, trace)
        case 'reward':
            return new TraceReward(block, trace)
        default:
            throw new Error(`Unknown trace type`)
    }
}


class StateDiffBase {
    transactionIndex: number
    address: Bytes20
    key: 'balance' | 'code' | 'nonce' | Bytes32
    #block: BlockHeader
    #transaction?: Transaction

    constructor(block: BlockHeader, stateDiff: PartialStateDiff) {
        this.transactionIndex = stateDiff.transactionIndex
        this.address = stateDiff.address
        this.key = stateDiff.key
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
            throw new Error(`Transaction is not set on state diff at ${this.block.id}-${this.transactionIndex}-${this.address}-${this.key}`)
        } else {
            return this.#transaction
        }
    }
}


export class StateDiffNoChange extends StateDiffBase {
    kind: '=' = '='
    prev?: null
    next?: null

    constructor(block: BlockHeader, stateDiff: PartialStateDiff) {
        super(block, stateDiff)
        Object.assign(this, stateDiff)
    }
}


export class StateDiffAdd extends StateDiffBase {
    kind: '+' = '+'
    prev?: null
    next?: Bytes

    constructor(block: BlockHeader, stateDiff: PartialStateDiff) {
        super(block, stateDiff)
        Object.assign(this, stateDiff)
    }
}


export class StateDiffChange extends StateDiffBase {
    kind: '*' = '*'
    prev?: Bytes
    next?: Bytes

    constructor(block: BlockHeader, stateDiff: PartialStateDiff) {
        super(block, stateDiff)
        Object.assign(this, stateDiff)
    }
}


export class StateDiffDelete extends StateDiffBase {
    kind: '-' = '-'
    prev?: Bytes
    next?: null

    constructor(block: BlockHeader, stateDiff: PartialStateDiff) {
        super(block, stateDiff)
        Object.assign(this, stateDiff)
    }
}


export type StateDiff = StateDiffNoChange | StateDiffAdd | StateDiffChange | StateDiffDelete


function createStateDiff(block: BlockHeader, stateDiff: PartialStateDiff): StateDiff {
    switch (stateDiff.kind) {
        case '=':
            return new StateDiffNoChange(block, stateDiff)
        case '+':
            return new StateDiffAdd(block, stateDiff)
        case '*':
            return new StateDiffChange(block, stateDiff)
        case '-':
            return new StateDiffDelete(block, stateDiff)
        default:
            throw new Error(`Unknown state diff kind`)
    }
}
