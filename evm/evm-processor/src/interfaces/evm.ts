import {Bytes, Bytes20, Bytes32, Bytes8} from './base'


export interface EvmBlockHeader {
    height: number
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
    /**
     * This field is not supported by all currently deployed archives.
     * Requesting it may cause internal error.
     */
    l1BlockNumber: number
}


export interface EvmTransaction extends _EvmTx, _EvmTxReceipt {
    transactionIndex: number
    sighash: Bytes
}


export interface EIP7702Authorization {
    chainId: number
    nonce: number
    address: Bytes20
    yParity: number
    r: Bytes32
    s: Bytes32
}


export interface _EvmTx {
    hash: Bytes32
    from: Bytes20
    to?: Bytes20
    gas: bigint
    gasPrice: bigint
    maxFeePerGas?: bigint
    maxPriorityFeePerGas?: bigint
    input: Bytes
    nonce: number
    value: bigint
    v: bigint
    r: Bytes32
    s: Bytes32
    yParity?: number
    chainId?: number
    authorizationList?: EIP7702Authorization[]
}


export interface _EvmTxReceipt {
    gasUsed: bigint
    cumulativeGasUsed: bigint
    effectiveGasPrice: bigint
    contractAddress?: Bytes32
    type: number
    status: number
    /**
     * Next fields are not supported by all currently deployed archives.
     * Requesting them may cause internal error.
     */
    l1Fee?: bigint
    l1FeeScalar?: number
    l1GasPrice?: bigint
    l1GasUsed?: bigint
    l1BlobBaseFee?: bigint
    l1BlobBaseFeeScalar?: number
    l1BaseFeeScalar?: number
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
