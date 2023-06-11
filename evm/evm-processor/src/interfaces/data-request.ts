import {FieldSelection} from './data'
import {Bytes, Bytes20, Bytes32, EvmStateDiff} from './evm'


export interface DataRequest {
    fields?: FieldSelection
    includeAllBlocks?: boolean
    logs?: LogRequest[]
    transactions?: TransactionRequest[]
    traces?: TraceRequest[]
    stateDiffs?: StateDiffRequest[]
}


export interface LogRequest {
    address?: Bytes20[]
    topic0?: Bytes32[]
    topic1?: Bytes32[]
    topic2?: Bytes32[]
    topic3?: Bytes32[]
    transaction?: boolean
}


export interface TransactionRequest {
    to?: Bytes20[]
    from?: Bytes20[]
    sighash?: Bytes[]
    logs?: boolean
    traces?: boolean
    stateDiffs?: boolean
}


export interface TraceRequest {
    type?: string[]
    createFrom?: Bytes20[]
    callTo?: Bytes20[]
    callSighash?: Bytes[]
    suicideRefundAddress?: Bytes[]
    rewardAuthor?: Bytes20[]
    transaction?: boolean
    subtraces?: boolean
    parents?: boolean
}


export interface StateDiffRequest {
    address?: Bytes20[]
    key?: Bytes[]
    kind?: EvmStateDiff['kind'][]
    transaction?: boolean
}
