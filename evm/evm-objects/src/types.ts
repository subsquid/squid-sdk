import {Bytes, FieldSelection} from '@subsquid/evm-stream'
import * as base from '@subsquid/evm-stream'


export type BlockHeader<F extends FieldSelection = {}> = base.BlockHeader<F> & {
    id: string
}


export type Transaction<F extends FieldSelection = {}> = base.Transaction<F> & {
    id: string
    block: BlockHeader<F>
    logs: Log<F>[]
    traces: Trace<F>[]
    stateDiffs: StateDiff<F>[]
}


export type Log<F extends FieldSelection = {}> = base.Log<F> & {
    id: string
    block: BlockHeader<F>
    transaction?: Transaction<F>
    getTransaction(): Transaction<F>
}


export type TraceCreate<F extends FieldSelection = {}> = base.TraceCreate<F> & {
    id: string
    block: BlockHeader<F>
    transaction?: Transaction<F>
    getTransaction(): Transaction<F>
    parent?: Trace<F>
    getParent(): Trace<F>
    children: Trace<F>[]
}


export type TraceCall<F extends FieldSelection = {}> = base.TraceCall<F> & {
    id: string
    block: BlockHeader<F>
    transaction?: Transaction<F>
    getTransaction(): Transaction<F>
    parent?: Trace<F>
    getParent(): Trace<F>
    children: Trace<F>[]
}


export type TraceSuicide<F extends FieldSelection = {}> = base.TraceSuicide<F> & {
    id: string
    block: BlockHeader<F>
    transaction?: Transaction<F>
    getTransaction(): Transaction<F>
    parent?: Trace<F>
    getParent(): Trace<F>
    children: Trace<F>[]
}


export type TraceReward<F extends FieldSelection = {}> = base.TraceReward<F> & {
    id: string
    block: BlockHeader<F>
    transaction?: Transaction<F>
    getTransaction(): Transaction<F>
    parent?: Trace<F>
    getParent(): Trace<F>
    children: Trace<F>[]
}


export type Trace<F extends FieldSelection = {}> = 
    | TraceCreate<F>
    | TraceCall<F>
    | TraceSuicide<F>
    | TraceReward<F>


export type StateDiff<F extends FieldSelection = {}> = base.StateDiff<F> & {
    block: BlockHeader<F>
    transaction?: Transaction<F>
    getTransaction(): Transaction<F>
}


export interface Block<F extends FieldSelection = {}> {
    header: BlockHeader<F>
    transactions: Transaction<F>[]
    logs: Log<F>[]
    traces: Trace<F>[]
    stateDiffs: StateDiff<F>[]
}
