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
    withDefault
} from '@subsquid/util-internal-validation'
import {Bytes, Bytes20, Bytes32, Qty} from '../interfaces/base'
import {project} from '../mapping/schema'


export interface DataRequest {
    logs?: boolean
    transactions?: boolean
    receipts?: boolean
    traces?: boolean
    stateDiffs?: boolean
    preferTraceApi?: boolean
    useDebugApiForStateDiffs?: boolean
    debugTraceTimeout?: string
}


export interface Block {
    height: number
    hash: Bytes32
    block: GetBlock
    receipts?: TransactionReceipt[]
    logs?: Log[]
    traceReplays?: TraceTransactionReplay[]
    debugFrames?: (DebugFrameResult | undefined | null)[]
    debugStateDiffs?: (DebugStateDiffResult | undefined | null)[]
    _isInvalid?: boolean
    _errorMessage?: string
}


const Transaction = object({
    blockNumber: SMALL_QTY,
    blockHash: BYTES,
    transactionIndex: SMALL_QTY,
    hash: BYTES,
    input: BYTES
})


export type Transaction = GetSrcType<typeof Transaction>


export const GetBlockWithTransactions = object({
    number: SMALL_QTY,
    hash: BYTES,
    parentHash: BYTES,
    logsBloom: BYTES,
    transactions: array(Transaction)
})


export const GetBlockNoTransactions = object({
    number: SMALL_QTY,
    hash: BYTES,
    parentHash: BYTES,
    logsBloom: BYTES,
    transactions: array(BYTES)
})


export interface GetBlock {
    number: Qty
    hash: Bytes32
    parentHash: Bytes32
    logsBloom: Bytes
    transactions: Bytes32[] | Transaction[]
}


export const Log = object({
    blockNumber: SMALL_QTY,
    blockHash: BYTES,
    logIndex: SMALL_QTY,
    transactionIndex: SMALL_QTY
})


export type Log = GetSrcType<typeof Log>


export const TransactionReceipt = object({
    blockNumber: SMALL_QTY,
    blockHash: BYTES,
    transactionIndex: SMALL_QTY,
    transactionHash: BYTES,
    logs: array(Log)
})


export type TransactionReceipt = GetSrcType<typeof TransactionReceipt>


export const DebugFrame: Validator<DebugFrame> = object({
    type: STRING,
    input: withDefault('0x', BYTES),
    calls: option(array(ref(() => DebugFrame)))
})


export interface DebugFrame {
    type: string
    input?: Bytes | null
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
    nonce: option(NAT),
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


export const TraceFrame = object({
    blockHash: option(BYTES),
    transactionHash: option(BYTES),
    traceAddress: array(NAT),
    type: STRING,
    action: object({})
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


export interface TraceTransactionReplay {
    transactionHash?: Bytes32 | null
    trace?: TraceFrame[]
    stateDiff?: Record<Bytes20, TraceStateDiff>
}


export interface TraceReplayTraces {
    trace?: boolean
    stateDiff?: boolean
}


export function getTraceTransactionReplayValidator(tracers: TraceReplayTraces): Validator<TraceTransactionReplay> {
    return object({
        transactionHash: option(BYTES),
        ...project(tracers, {
            trace: array(TraceFrame),
            stateDiff: record(BYTES, TraceStateDiff)
        })
    })
}
