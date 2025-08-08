import * as data from './data'
import type {GetFields, Select, Selector, Simplify} from './type-util'


export interface FieldSelection {
    block?: Selector<keyof data.BlockHeader>
    transaction?: Selector<keyof data.Transaction>
    instruction?: Selector<keyof data.Instruction>
    balance?: Selector<keyof data.Balance>
    tokenBalance?: Selector<keyof data.TokenBalance>
}


export const DEFAULT_FIELDS = {
    block: {
        hash: true,
        parentHash: true,
        parentSlot: true,
        timestamp: true
    },
    transaction: {
        signatures: true,
        err: true
    },
    instruction: {
        instructionAddress: true,
        programId: true,
        accounts: true,
        data: true,
        isCommitted: true
    },
    balance: {
        account: true,
        pre: true,
        post: true
    },
    tokenBalance: {
        account: true,
        preMint: true,
        preDecimals: true,
        preOwner: true,
        preAmount: true,
        postMint: true,
        postDecimals: true,
        postOwner: true,
        postAmount: true
    }
} as const


type Item<
    Data,
    F extends FieldSelection,
    K extends keyof FieldSelection
> = Simplify<
    Select<Data, GetFields<FieldSelection, typeof DEFAULT_FIELDS, F, K>>
>


export type BlockHeader<F extends FieldSelection = {}> = Item<
    data.BlockHeader,
    F,
    'block'
>


export type Transaction<F extends FieldSelection = {}> = Item<
    data.Transaction,
    F,
    'transaction'
>


export type Instruction<F extends FieldSelection = {}> = Item<
    data.Instruction,
    F,
    'instruction'
>


export type Balance<F extends FieldSelection = {}> = Item<
    data.Balance,
    F,
    'balance'
>


export type TokenBalance<F extends FieldSelection = {}> = Item<
    data.TokenBalance,
    F,
    'tokenBalance'
>


export type DataMessage<F extends FieldSelection = {}> = BlockMessage<F> | TransactionMessage<F>


export type BlockMessage<F extends FieldSelection = {}> = {
    type: 'block'
    slot: number
} & BlockHeader<F>


export interface TransactionMessage<F extends FieldSelection = {}> {
    type: 'transaction'
    slot: number
    transactionIndex: number
    transaction?: Transaction<F>
    instructions?: Instruction<F>[]
    balances?: Balance<F>[]
    tokenBalances?: TokenBalance<F>[]
}
