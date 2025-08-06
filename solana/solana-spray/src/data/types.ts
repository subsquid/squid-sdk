import * as data from './data'
import type {GetFields, Select, Selector, Simplify} from './type-util'


type BlockHeaderRequiredFields = 'slot'
type TransactionRequiredFields = 'transactionIndex'
type InstructionRequiredFields = 'transactionIndex' | 'instructionAddress'
type LogRequiredFields = 'transactionIndex' | 'logIndex' | 'instructionAddress'
type BalanceRequiredFields = 'transactionIndex' | 'account'
type TokenBalanceRequiredFields = 'transactionIndex' | 'account'
type RewardRequiredFields = 'pubkey'


export interface FieldSelection {
    block?: Selector<Exclude<keyof data.BlockHeader, BlockHeaderRequiredFields>>
    transaction?: Selector<Exclude<keyof data.Transaction, TransactionRequiredFields>>
    instruction?: Selector<Exclude<keyof data.Instruction, InstructionRequiredFields>>
    log?: Selector<Exclude<keyof data.LogMessage, LogRequiredFields>>
    balance?: Selector<Exclude<keyof data.Balance, BalanceRequiredFields>>
    tokenBalance?: Selector<Exclude<keyof data.TokenBalance, TokenBalanceRequiredFields>>
    reward?: Selector<Exclude<keyof data.Reward, RewardRequiredFields>>
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
        preMint: true,
        preDecimals: true,
        preOwner: true,
        preAmount: true,
        postMint: true,
        postDecimals: true,
        postOwner: true,
        postAmount: true
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
> = Simplify<
    Pick<Data, RequiredFields> &
    Select<Data, GetFields<FieldSelection, typeof DEFAULT_FIELDS, F, K>>
>


export type BlockHeader<F extends FieldSelection = {}> = Item<
    data.BlockHeader,
    BlockHeaderRequiredFields,
    F,
    'block'
>


export type Transaction<F extends FieldSelection = {}> = Item<
    data.Transaction,
    TransactionRequiredFields,
    F,
    'transaction'
>


export type Instruction<F extends FieldSelection = {}> = Item<
    data.Instruction,
    InstructionRequiredFields,
    F,
    'instruction'
>


export type LogMessage<F extends FieldSelection = {}> = Item<
    data.LogMessage,
    LogRequiredFields,
    F,
    'log'
>


export type Balance<F extends FieldSelection = {}> = Item<
    data.Balance,
    BalanceRequiredFields,
    F,
    'balance'
>


export type TokenBalance<F extends FieldSelection = {}> = Item<
    data.TokenBalance,
    TokenBalanceRequiredFields,
    F,
    'tokenBalance'
>


export type Reward<F extends FieldSelection = {}> = Item<
    data.Reward,
    RewardRequiredFields,
    F,
    'reward'
>


export interface Block<F extends FieldSelection = {}> {
    slot: number
    header?: BlockHeader<F>
    transactions: Transaction<F>[]
    instructions: Instruction<F>[]
    logs: LogMessage<F>[]
    balances: Balance<F>[]
    tokenBalances: TokenBalance<F>[]
    rewards: Reward<F>[]
}
