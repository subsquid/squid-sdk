import type {Bytes, Bytes20, Bytes32, Bytes8} from '../common/data'
import type {QueryBase} from '../common/query'
import type {StateDiff} from './data'
import type {FieldSelection} from './fields'

export interface Query<F extends FieldSelection = FieldSelection> extends QueryBase, ItemQuery {
    type: 'evm'
    fields?: F
}

export interface ItemQuery {
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
    transactionTraces?: boolean
    transactionLogs?: boolean
    transactionStateDiffs?: boolean
}

export interface TransactionRequest {
    to?: Bytes20[]
    from?: Bytes20[]
    sighash?: Bytes8[]
    type?: number[]
    logs?: boolean
    traces?: boolean
    stateDiffs?: boolean
}

export interface TraceRequest {
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

export interface StateDiffRequest {
    address?: Bytes20[]
    key?: Bytes[]
    kind?: StateDiff['kind'][]
    transaction?: boolean
}
