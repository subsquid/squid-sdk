import {FieldSelection} from '@subsquid/fuel-stream'
import * as base from '@subsquid/fuel-stream'


export type BlockHeader<F extends FieldSelection = {}> = base.BlockHeader<F>


export type Transaction<F extends FieldSelection = {}> = base.Transaction<F> & {
    id: string
    block: BlockHeader<F>
    receipts: Receipt<F>[]
    inputs: Input<F>[]
    outputs: Output<F>[]
}


export type Receipt<F extends FieldSelection = {}> = base.Receipt<F> & {
    id: string
    block: BlockHeader<F>
    transaction?: Transaction<F>
    getTransaction(): Transaction<F>
}


export type Input<F extends FieldSelection = {}> = base.Input<F> & {
    id: string
    block: BlockHeader<F>
    transaction?: Transaction<F>
    getTransaction(): Transaction<F>
}


export type Output<F extends FieldSelection = {}> = base.Output<F> & {
    id: string
    block: BlockHeader<F>
    transaction?: Transaction<F>
    getTransaction(): Transaction<F>
}


export interface Block<F extends FieldSelection = {}> {
    header: BlockHeader<F>
    transactions: Transaction<F>[]
    receipts: Receipt<F>[]
    inputs: Input<F>[]
    outputs: Output<F>[]
}
