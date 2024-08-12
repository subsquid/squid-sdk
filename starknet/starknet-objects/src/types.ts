import {FieldSelection} from '@subsquid/starknet-stream'
import * as base from '@subsquid/starknet-stream'

export type BlockHeader<F extends FieldSelection = {}> = base.BlockHeader<F>

export type Transaction<F extends FieldSelection = {}> = base.Transaction<F> & {
    id: string
    block: BlockHeader<F>
}

export type Event<F extends FieldSelection = {}> = base.Event<F> & {
    id: string
    block: BlockHeader<F>
    transaction?: Transaction<F>
    getTransaction(): Transaction<F>
}

export interface Block<F extends FieldSelection = {}> {
    header: BlockHeader<F>
    transactions: Transaction<F>[]
    events: Event<F>[]
}
