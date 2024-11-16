import {formatId} from '@subsquid/util-internal-processor-tools'
import assert from 'assert'
import {Bytes, Bytes20, Bytes32, Bytes8} from '../interfaces/base'
import {
    EIP7702Authorization,
    EvmTraceCallAction,
    EvmTraceCallResult,
    EvmTraceCreateAction,
    EvmTraceCreateResult,
    EvmTraceRewardAction,
    EvmTraceSuicideAction
} from '../interfaces/evm'


export class Block {
    header: BlockHeader
    transactions: Transaction[] = []
    logs: Log[] = []
    traces: Trace[] = []
    stateDiffs: StateDiff[] = []

    constructor(header: BlockHeader) {
        this.header = header
    }
}


export class BlockHeader {
    id: string
    height: number
    hash: Bytes32
    parentHash: Bytes32
    nonce?: Bytes8
    sha3Uncles?: Bytes32
    logsBloom?: Bytes
    transactionsRoot?: Bytes32
    stateRoot?: Bytes32
    receiptsRoot?: Bytes32
    mixHash?: Bytes
    miner?: Bytes20
    difficulty?: bigint
    totalDifficulty?: bigint
    extraData?: Bytes
    size?: bigint
    gasLimit?: bigint
    gasUsed?: bigint
    timestamp?: number
    baseFeePerGas?: bigint
    l1BlockNumber?: number

    constructor(
        height: number,
        hash: Bytes20,
        parentHash: Bytes20
    ) {
        this.id = formatId({height, hash})
        this.height = height
        this.hash = hash
        this.parentHash = parentHash
    }
}


export class Transaction {
    id: string
    transactionIndex: number
    from?: Bytes20
    gas?: bigint
    gasPrice?: bigint
    maxFeePerGas?: bigint
    maxPriorityFeePerGas?: bigint
    hash?: Bytes32
    input?: Bytes
    nonce?: number
    to?: Bytes20
    value?: bigint
    v?: bigint
    r?: Bytes32
    s?: Bytes32
    yParity?: number
    chainId?: number
    gasUsed?: bigint
    cumulativeGasUsed?: bigint
    effectiveGasPrice?: bigint
    contractAddress?: Bytes32
    type?: number
    status?: number
    sighash?: Bytes
    authorizationList?: EIP7702Authorization[]
    l1Fee?: bigint
    l1FeeScalar?: number
    l1GasPrice?: bigint
    l1GasUsed?: bigint
    l1BlobBaseFee?: bigint
    l1BlobBaseFeeScalar?: number
    l1BaseFeeScalar?: number
    #block: BlockHeader
    #logs?: Log[]
    #traces?: Trace[]
    #stateDiffs?: StateDiff[]

    constructor(
        block: BlockHeader,
        transactionIndex: number
    ) {
        this.id = formatId(block, transactionIndex)
        this.transactionIndex = transactionIndex
        this.#block = block
    }

    get block(): BlockHeader {
        return this.#block
    }

    get logs(): Log[] {
        return this.#logs || (this.#logs = [])
    }

    set logs(value: Log[]) {
        this.#logs = value
    }

    get traces(): Trace[] {
        return this.#traces || (this.#traces = [])
    }

    set traces(value: Trace[]) {
        this.#traces = value
    }

    get stateDiffs(): StateDiff[] {
        return this.#stateDiffs || (this.#stateDiffs = [])
    }

    set stateDiffs(value: StateDiff[]) {
        this.#stateDiffs = value
    }
}


export class Log {
    id: string
    logIndex: number
    transactionIndex: number
    transactionHash?: Bytes32
    address?: Bytes20
    data?: Bytes
    topics?: Bytes32[]
    #block: BlockHeader
    #transaction?: Transaction

    constructor(
        block: BlockHeader,
        logIndex: number,
        transactionIndex: number
    ) {
        this.id = formatId(block, logIndex)
        this.logIndex = logIndex
        this.transactionIndex = transactionIndex
        this.#block = block
    }

    get block(): BlockHeader {
        return this.#block
    }

    get transaction(): Transaction | undefined {
        return this.#transaction
    }

    set transaction(value: Transaction | undefined) {
        this.#transaction = value
    }

    getTransaction(): Transaction {
        assert(this.transaction != null)
        return this.transaction
    }
}


class TraceBase {
    id: string
    transactionIndex: number
    traceAddress: number[]
    subtraces?: number
    error?: string | null
    revertReason?: string
    #block: BlockHeader
    #transaction?: Transaction
    #parent?: Trace
    #children?: Trace[]

    constructor(block: BlockHeader, transactionIndex: number, traceAddress: number[]) {
        this.id = formatId(block, transactionIndex, ...traceAddress)
        this.transactionIndex = transactionIndex
        this.traceAddress = traceAddress
        this.#block = block
    }

    get block(): BlockHeader {
        return this.#block
    }

    get transaction(): Transaction | undefined {
        return this.#transaction
    }

    set transaction(value: Transaction | undefined) {
        this.#transaction = value
    }

    getTransaction(): Transaction {
        assert(this.transaction != null)
        return this.transaction
    }

    get parent(): Trace | undefined {
        return this.#parent
    }

    set parent(value: Trace | undefined) {
        this.#parent = value
    }

    getParent(): Trace {
        assert(this.parent != null)
        return this.parent
    }

    get children(): Trace[] {
        return this.#children || (this.#children = [])
    }

    set children(value: Trace[]) {
        this.#children = value
    }
}


export class TraceCreate extends TraceBase {
    type: 'create' = 'create'
    action?: Partial<EvmTraceCreateAction>
    result?: Partial<EvmTraceCreateResult>
}


export class TraceCall extends TraceBase {
    type: 'call' = 'call'
    action?: Partial<EvmTraceCallAction>
    result?: Partial<EvmTraceCallResult>
}


export class TraceSuicide extends TraceBase {
    type: 'suicide' = 'suicide'
    action?: Partial<EvmTraceSuicideAction>
}


export class TraceReward extends TraceBase {
    type: 'reward' = 'reward'
    action?: Partial<EvmTraceRewardAction>
}


export type Trace = TraceCreate | TraceCall | TraceSuicide | TraceReward


class StateDiffBase {
    transactionIndex: number
    address: Bytes20
    key: 'balance' | 'code' | 'nonce' | Bytes32
    #block: BlockHeader
    #transaction?: Transaction

    constructor(
        block: BlockHeader,
        transactionIndex: number,
        address: Bytes20,
        key: 'balance' | 'code' | 'nonce' | Bytes32
    ) {
        this.transactionIndex = transactionIndex
        this.address = address
        this.key = key
        this.#block = block
    }

    get block(): BlockHeader {
        return this.#block
    }

    get transaction(): Transaction | undefined {
        return this.#transaction
    }

    set transaction(value: Transaction | undefined) {
        this.#transaction = value
    }

    getTransaction(): Transaction {
        assert(this.transaction != null)
        return this.transaction
    }
}


export class StateDiffNoChange extends StateDiffBase {
    kind: '=' = '='
    prev?: null
    next?: null
}


export class StateDiffAdd extends StateDiffBase {
    kind: '+' = '+'
    prev?: null
    next?: Bytes
}


export class StateDiffChange extends StateDiffBase {
    kind: '*' = '*'
    prev?: Bytes
    next?: Bytes
}


export class StateDiffDelete extends StateDiffBase {
    kind: '-' = '-'
    prev?: Bytes
    next?: null
}


export type StateDiff = StateDiffNoChange | StateDiffAdd | StateDiffChange | StateDiffDelete
