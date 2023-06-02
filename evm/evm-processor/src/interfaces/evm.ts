export type Bytes = string
export type Bytes8 = string
export type Bytes20 = string
export type Bytes32 = string
export type Qty = string


export interface EvmBlock {
    height: number
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
    difficulty?: bigint
    totalDifficulty?: bigint
    extraData: Bytes
    size: bigint
    gasLimit: bigint
    gasUsed: bigint
    timestamp: number
    baseFeePerGas?: bigint
}


export interface EvmTransaction {
    from: Bytes20
    gas: bigint
    gasPrice: bigint
    maxFeePerGas?: bigint
    maxPriorityFeePerGas?: bigint
    hash: Bytes32
    input: Bytes
    nonce: number
    to?: Bytes20
    transactionIndex: number
    value: bigint
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
    sighash: Bytes
}


export interface EvmLog {
    logIndex: number
    transactionIndex: number
    transactionHash: Bytes32
    address: Bytes20
    data: Bytes
    topics: Bytes32[]
}


export interface EvmTraceBase {
    transactionIndex: number
    traceAddress: number[]
    subtraces: number
    error: string | null
    revertReason?: string
}


export interface EvmTraceCreate extends EvmTraceBase {
    type: 'create'
    action: EvmTraceCreateAction
    result?: EvmTraceCreateResult
}


export interface EvmTraceCreateAction {
    from: Bytes20
    value: bigint
    gas: bigint
    init: Bytes
}


export interface EvmTraceCreateResult {
    gasUsed: bigint
    code: Bytes
    address: Bytes20
}


export interface EvmTraceCall extends EvmTraceBase {
    type: 'call'
    action: EvmTraceCallAction
    result?: EvmTraceCallResult
}


export interface EvmTraceCallAction {
    callType: string
    from: Bytes20
    to: Bytes20
    value?: bigint
    gas: bigint
    input: Bytes
    sighash: Bytes
}


export interface EvmTraceCallResult {
    gasUsed: bigint
    output: Bytes
}


export interface EvmTraceSuicide extends EvmTraceBase {
    type: 'suicide'
    action: EvmTraceSuicideAction
}


export interface EvmTraceSuicideAction {
    address: Bytes20
    refundAddress: Bytes20
    balance: bigint
}


export interface EvmTraceReward extends EvmTraceBase {
    type: 'reward'
    action: EvmTraceRewardAction
}


export interface EvmTraceRewardAction {
    author: Bytes20
    value: bigint
    type: string
}


export type EvmTrace = EvmTraceCreate | EvmTraceCall | EvmTraceSuicide | EvmTraceReward


export interface EvmStateDiffBase {
    transactionIndex: number
    address: Bytes20
    key: 'balance' | 'code' | 'nonce' | Bytes32
}


export interface EvmStateDiffNoChange extends EvmStateDiffBase {
    kind: '='
    prev?: null
    next?: null
}


export interface EvmStateDiffAdd extends EvmStateDiffBase {
    kind: '+'
    prev?: null
    next: Bytes
}


export interface EvmStateDiffChange extends EvmStateDiffBase {
    kind: '*'
    prev: Bytes
    next: Bytes
}


export interface EvmStateDiffDelete extends EvmStateDiffBase {
    kind: '-'
    prev: Bytes
    next?: null
}


export type EvmStateDiff = EvmStateDiffNoChange | EvmStateDiffAdd | EvmStateDiffChange | EvmStateDiffDelete
