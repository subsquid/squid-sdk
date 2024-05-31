import type * as data from '@subsquid/fuel-normalization'
import type {
    BlockRequiredFields,
    ReceiptRequiredFields,
    InputRequiredFields,
    OutputRequiredFields,
    TransactionRequiredFields
} from './data-partial'
import type {GetFields, Select, Selector, Simplify, TrueFields} from './util'


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
        AddPrefix<'contractCreated', Exclude<keyof data.ContractCreated, OutputRequiredFields>>
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


type RemovePrefix<Prefix extends string, T>
    = T extends `${Prefix}${infer S}`
        ? Uncapitalize<S>
        : never


export type InputCoin<F extends FieldSelection> = Simplify<
    Pick<data.InputCoin, InputRequiredFields> &
    {type: 'InputCoin'} &
    Select<data.InputCoin, RemovePrefix<'coin', TrueFields<F['input']>>>
>


export type InputContract<F extends FieldSelection> = Simplify<
    Pick<data.InputContract, InputRequiredFields> &
    {type: 'InputContract'} &
    Select<data.InputContract, RemovePrefix<'contract', TrueFields<F['input']>>>
>


export type InputMessage<F extends FieldSelection> = Simplify<
    Pick<data.InputMessage, InputRequiredFields> &
    {type: 'InputMessage'} &
    Select<data.InputCoin, RemovePrefix<'coin', TrueFields<F['input']>>>
>


export type Input<F extends FieldSelection = {}> =
    InputCoin<F> |
    InputContract<F> |
    InputMessage<F>


export type CoinOutput<F extends FieldSelection> = Simplify<
    Pick<data.CoinOutput, OutputRequiredFields> &
    {type: 'CoinOutput'} &
    Select<data.CoinOutput, RemovePrefix<'coin', TrueFields<F['output']>>>
>


export type ChangeOutput<F extends FieldSelection> = Simplify<
    Pick<data.ChangeOutput, OutputRequiredFields> &
    {type: 'ChangeOutput'} &
    Select<data.ChangeOutput, RemovePrefix<'change', TrueFields<F['output']>>>
>


export type ContractOutput<F extends FieldSelection> = Simplify<
    Pick<data.ContractOutput, OutputRequiredFields> &
    {type: 'ContractOutput'} &
    Select<data.ContractOutput, RemovePrefix<'contract', TrueFields<F['output']>>>
>


export type VariableOutput<F extends FieldSelection> = Simplify<
    Pick<data.VariableOutput, OutputRequiredFields> &
    {type: 'VariableOutput'} &
    Select<data.VariableOutput, RemovePrefix<'variable', TrueFields<F['output']>>>
>


export type ContractCreated<F extends FieldSelection> = Simplify<
    Pick<data.ContractCreated, OutputRequiredFields> &
    {type: 'ContractCreated'} &
    Select<data.ContractCreated, RemovePrefix<'contractCreated', TrueFields<F['output']>>>
>


export type Output<F extends FieldSelection = {}> =
    CoinOutput<F> |
    ContractOutput<F> |
    ChangeOutput<F> |
    VariableOutput<F> |
    ContractCreated<F>


export interface Block<F extends FieldSelection = {}> {
    header: BlockHeader<F>
    transactions: Transaction<F>[]
    receipts: Receipt<F>[]
    inputs: Input<F>[]
    outputs: Output<F>[]
}
