import type {GetFields, Select, Selector, Simplify} from '../type-util'
import type * as data from './data'

type BlockRequiredFields = 'number' | 'hash' | 'parentHash' | 'parentNumber'

export interface FieldSelection {
    block?: Selector<Exclude<keyof data.BlockHeader, BlockRequiredFields>>
    transaction?: Selector<keyof data.Transaction>
    instruction?: Selector<keyof data.Instruction>
    log?: Selector<keyof data.LogMessage>
    balance?: Selector<keyof data.Balance>
    tokenBalance?: Selector<keyof data.TokenBalance>
    reward?: Selector<keyof data.Reward>
}

export type BlockHeader<F extends FieldSelection> = Simplify<
    Pick<data.BlockHeader, BlockRequiredFields> & Select<data.BlockHeader, GetFields<F['block']>>
>

type Item<T, F extends FieldSelection, K extends keyof F> = Select<T, GetFields<F[K]>>

export type Transaction<F extends FieldSelection> = Item<data.Transaction, F, 'transaction'>

export type Instruction<F extends FieldSelection> = Item<data.Instruction, F, 'instruction'>

export type LogMessage<F extends FieldSelection> = Item<data.LogMessage, F, 'log'>

export type Balance<F extends FieldSelection> = Item<data.Balance, F, 'balance'>

export type TokenBalance<F extends FieldSelection> = Item<data.TokenBalance, F, 'tokenBalance'>

export type Reward<F extends FieldSelection> = Item<data.Reward, F, 'reward'>

export interface Block<F extends FieldSelection> {
    header: BlockHeader<F>
    transactions: Transaction<F>[]
    instructions: Instruction<F>[]
    logs: LogMessage<F>[]
    balances: Balance<F>[]
    tokenBalances: TokenBalance<F>[]
    rewards: Reward<F>[]
}
