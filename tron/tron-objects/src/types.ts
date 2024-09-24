import {FieldSelection} from '@subsquid/tron-stream'
import * as base from '@subsquid/tron-stream'


export type BlockHeader<F extends FieldSelection = {}> = base.BlockHeader<F>


export type Transaction<F extends FieldSelection = {}> = base.Transaction<F> & {
    id: string
    block: BlockHeader<F>
    logs: Log<F>[]
    internalTransactions: InternalTransaction<F>[]
}


export type Log<F extends FieldSelection = {}> = base.Log<F> & {
    id: string
    block: BlockHeader<F>
    transaction?: Transaction<F>
    getTransaction(): Transaction<F>
}


export type InternalTransaction<F extends FieldSelection = {}> = base.InternalTransaction<F> & {
    id: string
    block: BlockHeader<F>
    transaction?: Transaction<F>
    getTransaction(): Transaction<F>
}


export interface Block<F extends FieldSelection = {}> {
    header: BlockHeader<F>
    transactions: Transaction<F>[]
    logs: Log<F>[]
    internalTransactions: InternalTransaction<F>[]
}
