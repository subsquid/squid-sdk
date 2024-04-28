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
    block: {
        time: true
    },
    transaction: {
        hash: true,
        type: true,
        status: true
    },
    receipt: {
        receiptType: true
    },
    input: {},
    output: {},
} as const


type Item<
    Data,
    RequiredFields extends keyof Data,
    F extends FieldSelection,
    K extends keyof FieldSelection
> = Simplify<
    Pick<Data, RequiredFields> &
    Select<Data, GetFields<FieldSelection, typeof DEFAULT_FIELDS, F, K>>
>


export type BlockHeader<F extends FieldSelection = {}> = Item<
    data.BlockHeader,
    BlockRequiredFields,
    F,
    'block'
>


export type Transaction<F extends FieldSelection = {}> = Item<
    data.Transaction,
    TransactionRequiredFields,
    F,
    'transaction'
>


export type Receipt<F extends FieldSelection = {}> = Item<
    data.Receipt,
    ReceiptRequiredFields,
    F,
    'receipt'
>


export type Input<F extends FieldSelection = {}> = Item<
    data.TransactionInput,
    InputRequiredFields,
    F,
    'input'
>


export type Output<F extends FieldSelection = {}> = Item<
    data.TransactionOutput,
    OutputRequiredFields,
    F,
    'output'
>


export interface Block<F extends FieldSelection = {}> {
    header: BlockHeader<F>
    transactions: Transaction<F>[]
    receipts: Receipt<F>[]
    inputs: Input<F>[]
    outputs: Output<F>[]
}
