import {
    GetBlock,
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
    receipts?: Receipt[]
    traceReplays?: TraceTransactionReplay[]
    debugStateDiffs?: DebugStateDiffResult[]
    debugFrames?: DebugFrameResult[]
    _isInvalid?: boolean
}


export interface DataRequest {
    transactions?: boolean
    receipts?: boolean
    traces?: boolean
    stateDiffs?: boolean
    useDebugApiForStateDiffs?: boolean
    useTraceApi?: boolean
    debugTraceTimeout?: boolean
}
