import type * as data from '@subsquid/solana-data/lib/normalization'
import type {
    BalanceRequiredFields,
    BlockRequiredFields,
    InstructionRequiredFields,
    LogRequiredFields,
    RewardRequiredFields,
    TokenBalanceRequiredFields,
    TransactionRequiredFields
} from './data-partial'
import type {GetFields, Selector, Select, Simplify} from './util'


export interface FieldSelection {
    block?: Selector<Exclude<keyof data.BlockHeader, BlockRequiredFields>>
    transaction?: Selector<Exclude<keyof data.Transaction, TransactionRequiredFields>>
    instruction?: Selector<Exclude<keyof data.Instruction, InstructionRequiredFields>>
    log?: Selector<Exclude<keyof data.LogMessage, LogRequiredFields>>
    balance?: Selector<Exclude<keyof data.Balance, BalanceRequiredFields>>
    tokenBalance?: Selector<Exclude<keyof data.TokenBalance, TokenBalanceRequiredFields>>
    reward?: Selector<Exclude<keyof data.Reward, RewardRequiredFields>>
}


export const DEFAULT_FIELDS = {
    block: {
        slot: true,
        parentSlot: true,
        timestamp: true
    },
    transaction: {
        signatures: true,
        err: true
    },
    instruction: {
        programId: true,
        accounts: true,
        data: true,
        isCommitted: true
    },
    log: {
        programId: true,
        kind: true,
        message: true
    },
    balance: {
        pre: true,
        post: true
    },
    tokenBalance: {
        mint: true,
        owner: true,
        decimals: true,
        pre: true,
        post: true
    },
    reward: {
        lamports: true,
        rewardType: true
    }
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
    Item<data.Transaction, TransactionRequiredFields, F, 'transaction'>
>


export type Instruction<F extends FieldSelection = {}> = Simplify<
    Item<data.Instruction, InstructionRequiredFields, F, 'instruction'>
>


export type LogMessage<F extends FieldSelection = {}> = Simplify<
    Item<data.LogMessage, LogRequiredFields, F, 'log'>
>


export type Balance<F extends FieldSelection = {}> = Simplify<
    Item<data.Balance, BalanceRequiredFields, F, 'balance'>
>


export type TokenBalance<F extends FieldSelection = {}> = Simplify<
    Item<data.TokenBalance, TokenBalanceRequiredFields, F, 'tokenBalance'>
>


export type Reward<F extends FieldSelection = {}> = Simplify<
    Item<data.Reward, RewardRequiredFields, F, 'reward'>
>


export interface Block<F extends FieldSelection = {}> {
    header: BlockHeader<F>
    transactions: Transaction<F>[]
    instructions: Instruction<F>[]
    logs: LogMessage<F>[]
    balances: Balance<F>[]
    // tokenBalances: TokenBalance<F>[]
    // rewards: Reward<F>[]
}
