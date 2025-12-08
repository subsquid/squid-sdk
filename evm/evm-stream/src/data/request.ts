import {FieldSelection} from './model'
import {EvmStateDiff, Bytes, Bytes20, Bytes32} from './evm'

export interface DataRequest<F extends FieldSelection> {
    fields?: F
    includeAllBlocks?: boolean
    logs?: LogRequest[]
    transactions?: TransactionRequest[]
    traces?: TraceRequest[]
    stateDiffs?: StateDiffRequest[]
}

export interface LogRequest {
    where?: LogRequestWhere
    include?: LogRequestRelations
}

export interface LogRequestWhere {
    address?: Bytes20[]
    topic0?: Bytes32[]
    topic1?: Bytes32[]
    topic2?: Bytes32[]
    topic3?: Bytes32[]
}

export interface LogRequestRelations {
    transaction?: boolean
    transactionTraces?: boolean
    transactionLogs?: boolean
    transactionStateDiffs?: boolean
}

export interface TransactionRequest {
    where?: TransactionRequestWhere
    include?: TransactionRequestRelations
}

export interface TransactionRequestWhere {
    to?: Bytes20[]
    from?: Bytes20[]
    sighash?: Bytes[]
    type?: number[]
}

export interface TransactionRequestRelations {
    logs?: boolean
    traces?: boolean
    stateDiffs?: boolean
}

export interface TraceRequest {
    where?: TraceRequestWhere
    include?: TraceRequestRelations
}

export interface TraceRequestWhere {
    type?: string[]
    createFrom?: Bytes20[]
    callTo?: Bytes20[]
    callFrom?: Bytes20[]
    callSighash?: Bytes[]
    suicideRefundAddress?: Bytes[]
    rewardAuthor?: Bytes20[]
}

export interface TraceRequestRelations {
    transaction?: boolean
    transactionLogs?: boolean
    subtraces?: boolean
    parents?: boolean
}

export interface StateDiffRequest {
    where?: StateDiffRequestWhere
    include?: StateDiffRequestRelations
}

export interface StateDiffRequestWhere {
    address?: Bytes20[]
    key?: Bytes[]
    kind?: EvmStateDiff['kind'][]
}

export interface StateDiffRequestRelations {
    transaction?: boolean
}
