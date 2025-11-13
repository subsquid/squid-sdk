import type {Bytes, Bytes20, Bytes32, Bytes8, QueryBase} from '../../types'
import type {StateDiff} from './data'
import type {EvmFieldSelection} from './fields'


export interface EvmQuery<F extends EvmFieldSelection = EvmFieldSelection> extends QueryBase, EvmItemQuery {
    type: 'evm'
    fields?: F
}


export interface EvmItemQuery {
    logs?: EvmLogRequest[]
    transactions?: EvmTransactionRequest[]
    traces?: EvmTraceRequest[]
    stateDiffs?: EvmStateDiffRequest[]
}


export interface EvmLogRequest {
    address?: Bytes20[]
    topic0?: Bytes32[]
    topic1?: Bytes32[]
    topic2?: Bytes32[]
    topic3?: Bytes32[]
    transaction?: boolean
    transactionTraces?: boolean
    transactionLogs?: boolean
    transactionStateDiffs?: boolean
}


export interface EvmTransactionRequest {
    to?: Bytes20[]
    from?: Bytes20[]
    sighash?: Bytes8[]
    type?: number[]
    logs?: boolean
    traces?: boolean
    stateDiffs?: boolean
}


export interface EvmTraceRequest {
    type?: string[]
    createFrom?: Bytes20[]
    callTo?: Bytes20[]
    callFrom?: Bytes20[]
    callSighash?: Bytes[]
    suicideRefundAddress?: Bytes[]
    rewardAuthor?: Bytes20[]
    transaction?: boolean
    transactionLogs?: boolean
    subtraces?: boolean
    parents?: boolean
}


export interface EvmStateDiffRequest {
    address?: Bytes20[]
    key?: Bytes[]
    kind?: StateDiff['kind'][]
    transaction?: boolean
}
