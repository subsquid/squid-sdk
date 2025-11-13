import type {Bytes, Bytes20, Bytes32, Bytes8} from '../../types'


export interface BlockHeader {
    number: number
    hash: Bytes32
    parentHash: Bytes32
    nonce: Bytes8
    sha3Uncles: Bytes32
    logsBloom: Bytes
    transactionsRoot: Bytes32
    stateRoot: Bytes32
    receiptsRoot: Bytes32
    mixHash: Bytes
    miner: Bytes20
    difficulty: bigint
    totalDifficulty: bigint
    extraData: Bytes
    size: bigint
    gasLimit: bigint
    gasUsed: bigint
    timestamp: number
    baseFeePerGas: bigint
    l1BlockNumber: number
}


export interface Transaction {
    transactionIndex: number
    // Transaction part
    hash: Bytes32
    from: Bytes20
    to?: Bytes20
    gas: bigint
    gasPrice: bigint
    maxFeePerGas?: bigint
    maxPriorityFeePerGas?: bigint
    input: Bytes
    sighash?: Bytes8
    nonce: number
    value: bigint
    v: bigint
    r: Bytes32
    s: Bytes32
    yParity?: number
    chainId?: number
    authorizationList?: EIP7702Authorization[]
    // Receipt part
    gasUsed: bigint
    cumulativeGasUsed: bigint
    effectiveGasPrice: bigint
    contractAddress?: Bytes20
    type: number
    status: number
    l1Fee?: bigint
    l1FeeScalar?: number
    l1GasPrice?: bigint
    l1GasUsed?: bigint
    l1BlobBaseFee?: bigint
    l1BlobBaseFeeScalar?: number
    l1BaseFeeScalar?: number
}



export interface EIP7702Authorization {
    chainId: number
    nonce: number
    address: Bytes20
    yParity: number
    r: Bytes32
    s: Bytes32
}


export interface Log {
    logIndex: number
    transactionIndex: number
    transactionHash: Bytes32
    address: Bytes20
    topics: Bytes32[]
    data: Bytes
}


export interface TraceBase {
    transactionIndex: number
    traceAddress: number[]
    subtraces: number
    error: string | null
    revertReason?: string
}


export interface TraceCreate extends TraceBase {
    type: 'create'
    action: TraceCreateAction
    result?: TraceCreateResult
}


export interface TraceCreateAction {
    from: Bytes20
    value: bigint
    gas: bigint
    init: Bytes
}


export interface TraceCreateResult {
    gasUsed: bigint
    code: Bytes
    address: Bytes20
}


export interface TraceCall extends TraceBase {
    type: 'call'
    action: TraceCallAction
    result?: TraceCallResult
}


export interface TraceCallAction {
    callType: string
    from: Bytes20
    to: Bytes20
    value?: bigint
    gas: bigint
    input: Bytes
    sighash: Bytes8
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
    balance: bigint
}


export interface TraceReward extends TraceBase {
    type: 'reward'
    action: TraceRewardAction
}


export interface TraceRewardAction {
    author: Bytes20
    value: bigint
    type: string
}


export type Trace = TraceCreate | TraceCall | TraceSuicide | TraceReward


export interface StateDiffBase {
    transactionIndex: number
    address: Bytes20
    key: 'balance' | 'code' | 'nonce' | Bytes32
}


export interface StateDiffNoChange extends StateDiffBase {
    kind: '='
    prev?: null
    next?: null
}


export interface StateDiffAdd extends StateDiffBase {
    kind: '+'
    prev?: null
    next: Bytes32
}


export interface StateDiffChange extends StateDiffBase {
    kind: '*'
    prev: Bytes32
    next: Bytes32
}


export interface StateDiffDelete extends StateDiffBase {
    kind: '-'
    prev: Bytes32
    next?: null
}


export type StateDiff = StateDiffNoChange | StateDiffAdd | StateDiffChange | StateDiffDelete
