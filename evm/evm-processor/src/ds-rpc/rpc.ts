import {Bytes, Bytes20, Bytes32, Bytes8, Qty} from '../interfaces/evm'


export interface Block {
    number: Qty
    hash: Bytes32
    parentHash: Bytes32
    nonce?: Bytes8
    sha3Uncles: Bytes32
    logsBloom: Bytes
    transactionsRoot: Bytes32
    stateRoot: Bytes32
    receiptsRoot: Bytes32
    mixHash?: Bytes
    miner: Bytes20
    difficulty?: Qty
    totalDifficulty?: Qty
    extraData: Bytes
    size: Qty
    gasLimit: Qty
    gasUsed: Qty
    timestamp: Qty
    baseFeePerGas?: Qty
    transactions: Bytes32[] | Transaction[]
    _receipts?: TransactionReceipt[]
    _logs?: Log[]
    _traceReplays?: TraceTransactionReplay[]
    _debugFrames?: DebugFrameResult[]
    _debugStateDiffs?: DebugStateDiffResult[]
}


export interface Transaction {
    blockNumber: Qty
    blockHash: Bytes32
    from: Bytes20
    gas: Qty
    gasPrice: Qty
    maxFeePerGas?: Qty
    maxPriorityFeePerGas?: Qty
    hash: Bytes32
    input: Bytes
    nonce: Qty
    to?: Bytes20
    transactionIndex: Qty
    value: Qty
    v?: Qty
    r?: Bytes32
    s?: Bytes32
    yParity?: Qty
    chainId?: Qty
}


export interface TransactionReceipt {
    transactionHash: Bytes32
    transactionIndex: Qty
    blockHash: Bytes32
    blockNumber: Qty
    cumulativeGasUsed: Qty
    effectiveGasPrice: Qty
    gasUsed: Qty
    contractAddress: Bytes20 | null
    logs: Log[]
    type: Qty
    status: Qty
}


export interface Log {
    blockNumber: Qty
    blockHash: Bytes32
    logIndex: Qty
    transactionIndex: Qty
    transactionHash: Bytes32
    address: Bytes20
    data: Bytes
    topics: Bytes32[]
}


export interface TraceFrameBase {
    traceAddress: number[]
    subtraces: number
    error: string | null
    transactionHash?: Bytes32
    blockHash?: Bytes32
}


export interface TraceCreateFrame extends TraceFrameBase {
    type: 'create'
    action: TraceCreateAction
    result?: TraceCreateResult
}


export interface TraceCreateAction {
    from: Bytes20
    value: Qty
    gas: Qty
    init: Bytes
}


export interface TraceCreateResult {
    gasUsed: Qty
    code: Bytes
    address: Bytes20
}


export interface TraceCallFrame extends TraceFrameBase {
    type: 'call'
    action: TraceCallAction
    result?: TraceCallResult
}


export interface TraceCallAction {
    callType: string
    from: Bytes20
    to: Bytes20
    value: Qty
    gas: Qty
    input: Bytes
}


export interface TraceCallResult {
    gasUsed: bigint
    output: Bytes
}


export interface TraceSuicideFrame extends TraceFrameBase {
    type: 'suicide'
    action: TraceSuicideAction
}


export interface TraceSuicideAction {
    address: Bytes20
    refundAddress: Bytes20
    balance: Qty
}


export interface TraceRewardFrame extends TraceFrameBase {
    type: 'reward'
    action: TraceRewardAction
}


export interface TraceRewardAction {
    author: Bytes20
    value: Qty
    type: string
}


export type TraceFrame = TraceCreateFrame | TraceCallFrame | TraceSuicideFrame | TraceRewardFrame


interface TraceAddDiff {
    '+': Bytes
    '*'?: undefined
    '-'?: undefined
}


interface TraceChangeDiff {
    '+'?: undefined
    '*': {
        from: Bytes
        to: Bytes
    }
    '-'?: undefined
}


interface TraceDeleteDiff {
    '+'?: undefined
    '*'?: undefined
    '-': Bytes
}


export type TraceDiff = '=' | TraceAddDiff | TraceChangeDiff | TraceDeleteDiff


export interface TraceStateDiff {
    balance: TraceDiff
    code: TraceDiff
    nonce: TraceDiff
    storage: Record<Bytes20, TraceDiff>
}


export interface TraceTransactionReplay {
    transactionHash: Bytes32
    trace?: TraceFrame[]
    stateDiff?: Record<Bytes20, TraceStateDiff>
}


export type TraceTracers = 'trace' | 'stateDiff'


export interface DebugFrame {
    type: 'CALL' | 'STATICCALL' | 'DELEGATECALL' | 'CREATE' | 'CREATE2' | 'SELFDESTRUCT' | 'INVALID'
    from: Bytes20
    to: Bytes20
    value?: Qty
    gas: Qty
    gasUsed: Qty
    input: Bytes
    output: Bytes
    error?: string
    revertReason?: string
    calls?: DebugFrame[]
}


export interface DebugFrameResult {
    result: DebugFrame
}


export interface DebugStateMap {
    balance?: Qty
    code?: Bytes
    nonce?: number
    storage?: Record<Bytes32, Bytes>
}


export interface DebugStateDiff {
    pre: Record<Bytes20, DebugStateMap>
    post: Record<Bytes20, DebugStateMap>
}


export interface DebugStateDiffResult {
    result: DebugStateDiff
}


export interface DataRequest {
    logs: boolean
    transactions: boolean
    receipts: boolean
    traces: boolean
    stateDiffs: boolean
    transactionList?: boolean
}
