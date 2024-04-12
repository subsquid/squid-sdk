import type * as data from '@subsquid/fuel-data/lib/data'
import type {
    BlockRequiredFields,
    ReceiptRequiredFields,
    InputRequiredFields,
    OutputRequiredFields,
    TransactionRequiredFields
} from './data-partial'
import type {GetFields, Select, Selector, Simplify} from './util'


/**
 * Hex encoded binary string
 */
export type Bytes = string


export interface FieldSelection {
    block?: Selector<Exclude<keyof data.BlockHeader, BlockRequiredFields>>
    transaction?: Selector<Exclude<keyof data.Transaction, TransactionRequiredFields>>
    receipt?: Selector<Exclude<keyof data.Receipt, ReceiptRequiredFields>>
    input?: Selector<Exclude<keyof data.TransactionInput, InputRequiredFields>>
    output?: Selector<Exclude<keyof data.TransactionOutput, OutputRequiredFields>>
}


export const DEFAULT_FIELDS = {
    block: {},
    transaction: {},
    receipt: {},
    input: {},
    output: {},
} as const


type Item<
    Data,
    RequiredFields extends keyof Data,
    F extends FieldSelection,
    K extends keyof FieldSelection
> =
    {id: string} &
    Pick<Data, RequiredFields> &
    Select<Data, GetFields<FieldSelection, typeof DEFAULT_FIELDS, F, K>>


export type BlockHeader<F extends FieldSelection = {}> = Simplify<
    Item<data.BlockHeader, BlockRequiredFields, F, 'block'>
>


export type Transaction<F extends FieldSelection = {}> = Simplify<
    Item<data.Transaction, TransactionRequiredFields, F, 'transaction'> &
    {
        block: BlockHeader<F>
        receipts: Receipt<F>[]
        inputs: Input<F>[]
        outputs: Output<F>[]
    }
>


export type Receipt<F extends FieldSelection = {}> = Simplify<
    Item<data.Receipt, ReceiptRequiredFields, F, 'receipt'> &
    {
        block: BlockHeader<F>
        transaction?: Transaction<F>
        getTransaction(): Transaction<F>
    }
>


export type Input<F extends FieldSelection = {}> = Simplify<
    Item<data.TransactionInput, InputRequiredFields, F, 'input'> &
    {
        block: BlockHeader<F>
        transaction?: Transaction<F>
        getTransaction(): Transaction<F>
    }
>


export type Output<F extends FieldSelection = {}> = Simplify<
    Item<data.TransactionOutput, OutputRequiredFields, F, 'output'> &
    {
        block: BlockHeader<F>
        transaction?: Transaction<F>
        getTransaction(): Transaction<F>
    }
>


export interface Block<F extends FieldSelection = {}> {
    header: BlockHeader<F>
    transactions: Transaction<F>[]
    receipts: Receipt<F>[]
    inputs: Input<F>[]
    outputs: Output<F>[]
}
