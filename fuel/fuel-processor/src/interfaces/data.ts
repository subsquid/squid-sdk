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


type AddPrefix<Prefix extends string, S extends string> = `${Prefix}${Capitalize<S>}`


export interface FieldSelection {
    block?: Selector<Exclude<keyof data.BlockHeader, BlockRequiredFields>>
    transaction?: Selector<Exclude<keyof data.Transaction, TransactionRequiredFields>>
    receipt?: Selector<Exclude<keyof data.Receipt, ReceiptRequiredFields>>
    input?: Selector<
        AddPrefix<'coin', Exclude<keyof data.InputCoin, InputRequiredFields>> |
        AddPrefix<'contract', Exclude<keyof data.InputContract, InputRequiredFields>> |
        AddPrefix<'message', Exclude<keyof data.InputMessage, InputRequiredFields>>
    >
    output?: Selector<
        AddPrefix<'coin', Exclude<keyof data.CoinOutput, OutputRequiredFields>> |
        AddPrefix<'contract', Exclude<keyof data.ContractOutput, OutputRequiredFields>> |
        AddPrefix<'change', Exclude<keyof data.ChangeOutput, OutputRequiredFields>> |
        AddPrefix<'variable', Exclude<keyof data.VariableOutput, OutputRequiredFields>> |
        AddPrefix<'contractCreated', Exclude<keyof data.ContractCreated, OutputRequiredFields | 'contract'> | 'contractId'>
    >
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
