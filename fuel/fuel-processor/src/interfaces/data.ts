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
    block: {
        // slot: true,
        // parentSlot: true,
        // timestamp: true
    },
    transaction: {
        // signatures: true,
        // err: true
    },
    receipt: {
        // programId: true,
        // accounts: true,
        // data: true,
        // isCommitted: true
    },
    input: {
    //     programId: true,
    //     kind: true,
    //     message: true
    },
    output: {
    //     pre: true,
    //     post: true
    },
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
        // instructions: Instruction<F>[]
        // balances: Balance<F>[]
        // tokenBalances: TokenBalance<F>[]
    }
>


export type Receipt<F extends FieldSelection = {}> = Simplify<
    Item<data.Receipt, ReceiptRequiredFields, F, 'receipt'> &
    (['data'] extends [GetFields<FieldSelection, typeof DEFAULT_FIELDS, F, 'receipt'>] ? {
        d1: Bytes
        d2: Bytes
        d4: Bytes
        d8: Bytes
    } : {}) &
    {
        block: BlockHeader<F>
        transaction?: Transaction<F>
        getTransaction(): Transaction<F>
        inner: Receipt<F>[]
        parent?: Receipt<F>
    }
>


// export type LogMessage<F extends FieldSelection = {}> = Simplify<
//     Item<data.LogMessage, LogRequiredFields, F, 'log'> &
//     {
//         block: BlockHeader<F>
//         transaction?: Transaction<F>
//         getTransaction(): Transaction<F>
//         instruction?: Instruction<F>
//         getInstruction(): Instruction<F>
//     }
// >


// export type Balance<F extends FieldSelection = {}> = Simplify<
//     Item<data.Balance, BalanceRequiredFields, F, 'balance'> &
//     {
//         block: BlockHeader<F>
//         transaction?: Transaction<F>
//         getTransaction(): Transaction<F>
//     }
// >


// export type TokenBalance<F extends FieldSelection = {}> = Simplify<
//     Item<data.TokenBalance, TokenBalanceRequiredFields, F, 'tokenBalance'> &
//     {
//         block: BlockHeader<F>
//         transaction?: Transaction<F>
//         getTransaction(): Transaction<F>
//     }
// >


// export type Reward<F extends FieldSelection = {}> = Simplify<
//     Item<data.Reward, RewardRequiredFields, F, 'reward'>
// >


export interface Block<F extends FieldSelection = {}> {
    header: BlockHeader<F>
    transactions: Transaction<F>[]
    receipts: Receipt<F>[]
    // logs: LogMessage<F>[]
    // balances: Balance<F>[]
    // tokenBalances: TokenBalance<F>[]
    // rewards: Reward<F>[]
}
