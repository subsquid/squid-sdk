import {
    GetBlock,
    Log,
    Receipt,
    TraceTransactionReplay,
    DebugStateDiffResult,
    DebugFrameResult
} from './rpc-data'


export type Qty = string
export type Bytes = string
export type Bytes8 = string
export type Bytes20 = string
export type Bytes32 = string


export interface Block {
    number: number
    hash: Bytes32
    block: GetBlock
    logs?: Log[]
    receipts?: Receipt[]
    traceReplays?: TraceTransactionReplay[]
    debugStateDiffs?: (DebugStateDiffResult | undefined)[]
    debugFrames?: (DebugFrameResult | undefined)[]
    _isInvalid?: boolean
    _errorMessage?: string
}


export interface DataRequest {
    transactions?: boolean
    logs?: boolean
    receipts?: boolean
    traces?: boolean
    stateDiffs?: boolean
    useDebugApiForStateDiffs?: boolean
    useTraceApi?: boolean
    debugTraceTimeout?: boolean
}
