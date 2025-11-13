import type {GetFields, Select, Selector, Simplify} from '../type-util'
import type * as data from './data'


type BlockRequiredFields = 'number' | 'hash' | 'parentHash' | 'parentNumber'


export interface SolanaFieldSelection {
    block?: Selector<Exclude<keyof data.BlockHeader, BlockRequiredFields>>
    transaction?: Selector<keyof data.Transaction>
    instruction?: Selector<keyof data.Instruction>
    log?: Selector<keyof data.LogMessage>
    balance?: Selector<keyof data.Balance>
    tokenBalance?: Selector<keyof data.TokenBalance>
    reward?: Selector<keyof data.Reward>
}


export type SolanaBlockHeader<F extends SolanaFieldSelection> = Simplify<
    Pick<data.BlockHeader, BlockRequiredFields> &
    Select<data.BlockHeader, GetFields<F['block']>>
>


type Item<T, F extends SolanaFieldSelection, K extends keyof F> = Select<T, GetFields<F[K]>>


export type SolanaTransaction<F extends SolanaFieldSelection> = Item<
    data.Transaction,
    F,
    'transaction'
>


export type SolanaInstruction<F extends SolanaFieldSelection> = Item<
    data.Instruction,
    F,
    'instruction'
>


export type SolanaLogMessage<F extends SolanaFieldSelection> = Item<
    data.LogMessage,
    F,
    'log'
>


export type SolanaBalance<F extends SolanaFieldSelection> = Item<
    data.Balance,
    F,
    'balance'
>


export type SolanaTokenBalance<F extends SolanaFieldSelection > = Item<
    data.TokenBalance,
    F,
    'tokenBalance'
>


export type SolanaReward<F extends SolanaFieldSelection> = Item<
    data.Reward,
    F,
    'reward'
>


export interface SolanaBlock<F extends SolanaFieldSelection> {
    header: SolanaBlockHeader<F>
    transactions?: SolanaTransaction<F>[]
    instructions?: SolanaInstruction<F>[]
    logs?: SolanaLogMessage<F>[]
    balances?: SolanaBalance<F>[]
    tokenBalances?: SolanaTokenBalance<F>[]
    rewards?: SolanaReward<F>[]
}
