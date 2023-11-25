import {Bytes, Bytes20, Bytes32, Qty} from '../interfaces/base'
import {project} from '../mapping/schema'
import {
    array,
    BYTES,
    constant,
    GetSrcType,
    NAT,
    object,
    option,
    print,
    QTY,
    record,
    ref,
    SMALL_QTY,
    STRING,
    ValidationFailure,
    Validator
} from '../validation'


export interface DataRequest {
    logs?: boolean
    transactions?: boolean
    receipts?: boolean
    traces?: boolean
    stateDiffs?: boolean
    preferTraceApi?: boolean
    useDebugApiForStateDiffs?: boolean
}


export interface Block {
    height: number
    hash: Bytes32
    block: GetBlock
    receipts?: TransactionReceipt[]
    logs?: Log[]
    traceReplays?: TraceTransactionReplay[]
    debugFrames?: DebugFrameResult[]
    debugStateDiffs?: DebugStateDiffResult[]
    _isInvalid?: boolean
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
    result: DebugFrame
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
    result: DebugStateDiff
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


export type TraceDiff = '=' | TraceAddDiff | TraceChangeDiff | TraceDeleteDiff


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


const TraceDiff: Validator<TraceDiff> = {
    cast(value: unknown): ValidationFailure | TraceDiff {
        return this.validate(value) || (value as any)
    },
    validate(value: unknown): ValidationFailure | undefined {
        if (value === '=') return
        if (typeof value != 'object' || !value) return new ValidationFailure(`${print(value)} is not a diff object`)
        if ('+' in value) {
            return TraceAddDiff.validate(value)
        } else if ('*' in value) {
            return TraceChangeDiff.validate(value)
        } else if ('-' in value) {
            return TraceDeleteDiff.validate(value)
        } else {
            return new ValidationFailure(`${print(value)} is not a diff object`)
        }
    },
    phantom(): TraceDiff {
        throw new Error()
    }
}


const TraceAddDiff = object({
    '+': BYTES,
    '*': constant(undefined),
    '-': constant(undefined)
})


const TraceChangeDiff = object({
    '+': constant(undefined),
    '*': object({from: BYTES, to: BYTES}),
    '-': constant(undefined)
})


const TraceDeleteDiff = object({
    '+': constant(undefined),
    '*': constant(undefined),
    '-': BYTES
})


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
