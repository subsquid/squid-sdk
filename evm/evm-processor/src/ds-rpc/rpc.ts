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


export interface TraceBase {
    traceAddress: number[]
    subtraces: number
    error: string | null
}


export interface TraceCreate extends TraceBase {
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


export interface TraceCall extends TraceBase {
    type: 'call'
    action: TraceCallAction
    result?: TraceCallResult
}


export interface TraceCallAction {
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


export interface TraceSuicide extends TraceBase {
    type: 'suicide'
    action: TraceSuicideAction
}


export interface TraceSuicideAction {
    address: Bytes20
    refundAddress: Bytes20
    balance: Qty
}


export interface TraceReward extends TraceBase {
    type: 'reward'
    action: TraceRewardAction
}


export interface TraceRewardAction {
    author: Bytes20
    value: Qty
    type: string
}


export type Trace = TraceCreate | TraceCall | TraceSuicide | TraceReward


interface AddDiff {
    '+': Bytes
    '*'?: undefined
    '-'?: undefined
}


interface ChangeDiff {
    '+'?: undefined
    '*': {
        from: Bytes
        to: Bytes
    }
    '-'?: undefined
}


interface DeleteDiff {
    '+'?: undefined
    '*'?: undefined
    '-': Bytes
}


export type Diff = '=' | AddDiff | ChangeDiff | DeleteDiff


export interface StateDiff {
    balance: Diff
    code: Diff
    nonce: Diff
    storage: Record<Bytes20, Diff>
}


export interface TransactionReplay {
    transactionHash: Bytes32
    trace?: Trace[]
    stateDiff?: Record<Bytes20, StateDiff>
}
