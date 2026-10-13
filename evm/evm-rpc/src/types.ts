import {
    GetBlock,
    Log,
    Receipt,
    TraceTransactionReplay,
    DebugStateDiffResult,
    DebugFrameResult,
    BlockAccessList
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
    blockAccessList?: BlockAccessList
    _isInvalid?: boolean
    _errorMessage?: string
}


export interface DataRequest {
    transactions?: boolean
    logs?: boolean
    receipts?: boolean
    traces?: boolean
    stateDiffs?: boolean
    /**
     * Fetch EIP-7928 block access lists for blocks whose header commits to one
     */
    blockAccessLists?: boolean
    useDebugApiForStateDiffs?: boolean
    useDebugTraceBlockByNumber?: boolean
    useTraceApi?: boolean
    debugTraceTimeout?: string
}
