import type * as data from '@subsquid/solana-normalization'
import type {MakePartial} from './type-util'


export type BlockRequiredFields = 'height' | 'hash' | 'parentHash'
export type TransactionRequiredFields = 'transactionIndex'
export type InstructionRequiredFields = 'transactionIndex' | 'instructionAddress'
export type LogRequiredFields = 'transactionIndex' | 'logIndex' | 'instructionAddress'
export type BalanceRequiredFields = 'transactionIndex' | 'account'
export type TokenBalanceRequiredFields = 'transactionIndex' | 'account'
export type RewardRequiredFields = 'pubkey'


export type PartialBlockHeader = MakePartial<data.BlockHeader, BlockRequiredFields>
export type PartialTransaction = MakePartial<data.Transaction, TransactionRequiredFields>
export type PartialInstruction = MakePartial<data.Instruction, InstructionRequiredFields>
export type PartialLogMessage = MakePartial<data.LogMessage, LogRequiredFields>
export type PartialBalance = MakePartial<data.Balance, BalanceRequiredFields>
export type PartialTokenBalance = MakePartial<data.TokenBalance, TokenBalanceRequiredFields>
export type PartialReward = MakePartial<data.Reward, RewardRequiredFields>


export interface PartialBlock {
    header: PartialBlockHeader
    transactions: PartialTransaction[]
    instructions: PartialInstruction[]
    logs: PartialLogMessage[]
    balances: PartialBalance[]
    tokenBalances: PartialTokenBalance[]
    rewards: PartialReward[]
}
