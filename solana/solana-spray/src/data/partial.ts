import {Balance, BlockHeader, Instruction, LogMessage, Reward, TokenBalance, Transaction} from './data'
import {MakePartial} from './type-util'


export interface PartialBlock {
    slot: number
    header?: MakePartial<BlockHeader>
    transactions: MakePartial<Transaction>[]
    instructions: MakePartial<Instruction>[]
    balances: MakePartial<Balance>[]
    tokenBalances: MakePartial<TokenBalance>[]
    logs: MakePartial<LogMessage>[]
    rewards: MakePartial<Reward>[]
}
