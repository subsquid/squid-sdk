import {
    array,
    BYTES,
    constant,
    GetSrcType,
    keyTaggedUnion,
    NAT,
    object,
    oneOf,
    option,
    QTY,
    record,
    ref,
    SMALL_QTY,
    STRING,
    Validator,
    withSentinel,
    withDefault,
    taggedUnion
} from '@subsquid/util-internal-validation'
import {Bytes} from './base'


export const Transaction = object({
    blockNumber: SMALL_QTY,
    blockHash: BYTES,
    transactionIndex: SMALL_QTY,
    hash: BYTES,
    input: BYTES,
    nonce: withSentinel('Transaction.nonce', -1, SMALL_QTY),
    from: BYTES,
    to: option(BYTES),
    value: withSentinel('Transaction.value', -1n, QTY),
    gas: withSentinel('Transaction.gas', -1n, QTY),
    gasPrice: withSentinel('Transaction.gasPrice', -1n, QTY),
    maxFeePerGas: option(QTY),
    maxPriorityFeePerGas: option(QTY),
    v: withSentinel('Transaction.v', -1n, QTY),
    r: withSentinel('Transaction.r', '0x', BYTES),
    s: withSentinel('Transaction.s', '0x', BYTES),
    yParity: option(SMALL_QTY),
    chainId: option(SMALL_QTY)
})


export type Transaction = GetSrcType<typeof Transaction>


export const GetBlock = object({
    number: SMALL_QTY,
    hash: BYTES,
    parentHash: BYTES,
    logsBloom: withSentinel('BlockHeader.logsBloom', '0x', BYTES),
    timestamp: withSentinel('BlockHeader.timestamp', 0, SMALL_QTY),
    transactionsRoot: withSentinel('BlockHeader.transactionsRoot', '0x', BYTES),
    receiptsRoot: withSentinel('BlockHeader.receiptsRoot', '0x', BYTES),
    stateRoot: withSentinel('BlockHeader.stateRoot', '0x', BYTES),
    sha3Uncles: withSentinel('BlockHeader.sha3Uncles', '0x', BYTES),
    extraData: withSentinel('BlockHeader.extraData', '0x', BYTES),
    miner: withSentinel('BlockHeader.miner', '0x', BYTES),
    nonce: withSentinel('BlockHeader.nonce', '0x', BYTES),
    mixHash: withSentinel('BlockHeader.mixHash', '0x', BYTES),
    size: withSentinel('BlockHeader.size', -1, SMALL_QTY),
    gasLimit: withSentinel('BlockHeader.gasLimit', -1n, QTY),
    gasUsed: withSentinel('BlockHeader.gasUsed', -1n, QTY),
    difficulty: withSentinel('BlockHeader.difficulty', -1n, QTY),
    totalDifficulty: withSentinel('BlockHeader.totalDifficulty', -1n, QTY),
    baseFeePerGas: withSentinel('BlockHeader.baseFeePerGas', -1n, QTY),
    l1BlockNumber: withDefault(0, SMALL_QTY),
    transactions: oneOf({
        withTransactions: array(Transaction),
        noTransactions: array(BYTES),
    })
})


export type GetBlock = GetSrcType<typeof GetBlock>


export const Log = object({
    blockNumber: SMALL_QTY,
    blockHash: BYTES,
    logIndex: SMALL_QTY,
    transactionIndex: SMALL_QTY,
    transactionHash: BYTES,
    address: BYTES,
    data: BYTES,
    topics: array(BYTES)
})


export type Log = GetSrcType<typeof Log>


export const TransactionReceipt = object({
    blockNumber: SMALL_QTY,
    blockHash: BYTES,
    transactionIndex: SMALL_QTY,
    transactionHash: BYTES,
    cumulativeGasUsed: withSentinel('Receipt.cumulativeGasUsed', -1n, QTY),
    effectiveGasPrice: withSentinel('Receipt.effectiveGasPrice', -1n, QTY),
    gasUsed: withSentinel('Receipt.gasUsed', -1n, QTY),
    contractAddress: option(BYTES),
    type: withSentinel('Receipt.type', -1, SMALL_QTY),
    status: withSentinel('Receipt.status', -1, SMALL_QTY),
    logs: array(Log)
})


export type TransactionReceipt = GetSrcType<typeof TransactionReceipt>


export const DebugFrame: Validator<DebugFrame> = object({
    type: STRING,
    input: BYTES,
    calls: option(array(ref(() => DebugFrame)))
})


export interface DebugFrame {
    type: string
    input: Bytes
    calls?: DebugFrame[] | null
}


export const DebugFrameResult = object({
    result: DebugFrame,
    txHash: option(BYTES)
})


export type DebugFrameResult = GetSrcType<typeof DebugFrameResult>


export const DebugStateMap = object({
    balance: option(QTY),
    code: option(BYTES),
    nonce: option(SMALL_QTY),
    storage: option(record(BYTES, BYTES))
})


export type DebugStateMap = GetSrcType<typeof DebugStateMap>


export const DebugStateDiff = object({
    pre: record(BYTES, DebugStateMap),
    post: record(BYTES, DebugStateMap)
})


export type DebugStateDiff = GetSrcType<typeof DebugStateDiff>


export const DebugStateDiffResult = object({
    result: DebugStateDiff,
    txHash: option(BYTES)
})


export type DebugStateDiffResult = GetSrcType<typeof DebugStateDiffResult>


const traceFrameBase = {
    blockHash: option(BYTES),
    transactionHash: option(BYTES),
    traceAddress: array(NAT),
    subtraces: NAT,
    error: option(STRING),
}


export const TraceCreateAction = object({
    from: BYTES,
    value: QTY,
    gas: QTY,
    init: BYTES
})


export const TraceCreateResult = object({
    gasUsed: QTY,
    code: BYTES,
    address: BYTES
})


export const TraceCallAction = object({
    from: BYTES,
    to: BYTES,
    value: QTY,
    gas: QTY,
    input: BYTES,
    callType: oneOf({
        call: constant('call'),
        callcode: constant('callcode'),
        delegatecall: constant('delegatecall'),
        staticcall: constant('staticcall')
    })
})


export const TraceCallResult = object({
    gasUsed: QTY,
    output: BYTES
})


export const TraceSuicideAction = object({
    address: BYTES,
    refundAddress: BYTES,
    balance: QTY
})


export const TraceRewardAction = object({
    author: BYTES,
    value: QTY,
    rewardType: oneOf({
        block: constant('block'),
        uncle: constant('uncle'),
        emptyStep: constant('emptyStep'),
        external: constant('external')
    })
})


export const TraceFrame = taggedUnion('type', {
    create: object({
        ...traceFrameBase,
        action: TraceCreateAction,
        result: option(TraceCreateResult)
    }),
    call: object({
        ...traceFrameBase,
        action: TraceCallAction,
        result: option(TraceCallResult)
    }),
    suicide: object({
        ...traceFrameBase,
        action: TraceSuicideAction
    }),
    reward: object({
        ...traceFrameBase,
        action: TraceRewardAction
    })
})


export type TraceFrame = GetSrcType<typeof TraceFrame>


const TraceDiffObj = keyTaggedUnion({
    '+': BYTES,
    '*': object({from: BYTES, to: BYTES}),
    '-': BYTES
})


const TraceDiff = oneOf({
    '= sign': constant('='),
    'diff object': TraceDiffObj
})


export type TraceDiff = GetSrcType<typeof TraceDiff>


export const TraceStateDiff = object({
    balance: TraceDiff,
    code: TraceDiff,
    nonce: TraceDiff,
    storage: record(BYTES, TraceDiff)
})


export type TraceStateDiff = GetSrcType<typeof TraceStateDiff>


export const TraceTransactionReplay = object({
    transactionHash: option(BYTES),
    trace: option(array(TraceFrame)),
    stateDiff: option(record(BYTES, TraceStateDiff)),
})


export type TraceTransactionReplay = GetSrcType<typeof TraceTransactionReplay>


export const Block = object({
    height: NAT,
    hash: BYTES,
    block: GetBlock,
    receipts: option(array(TransactionReceipt)),
    logs: option(array(Log)),
    traceReplays: option(array(TraceTransactionReplay)),
    debugFrames: option(array(DebugFrameResult)),
    debugStateDiffs: option(array(DebugStateDiffResult))
})


export type Block = GetSrcType<typeof Block>
