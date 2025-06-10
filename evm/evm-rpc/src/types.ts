import {GetBlock, Receipt, TraceFrame, TraceTransactionReplay} from './rpc-data'


export type Qty = string
export type Bytes32 = string


export interface Block {
    number: number
    hash: Bytes32
    block: GetBlock
    receipts?: Receipt[]
    traces?: TraceFrame[]
    stateDiffs?: TraceTransactionReplay[]
    _isInvalid?: boolean
}


export interface DataRequest {
    transactions?: boolean
    receipts?: boolean
    traces?: boolean
    stateDiffs?: boolean
    useDebugApiForStateDiffs?: boolean
}
