import type * as data from '@subsquid/tron-normalization'
import type {MakePartial} from './util'


export type BlockRequiredFields = 'height' | 'hash' | 'parentHash'
export type TransactionRequiredFields = 'transactionIndex'
export type LogRequiredFields = 'transactionIndex' | 'logIndex'
export type InternalTransactionRequiredFields = 'transactionIndex' | 'internalTransactionIndex'


export type PartialBlockHeader = MakePartial<data.BlockHeader, BlockRequiredFields>
export type PartialTransaction = MakePartial<data.Transaction, TransactionRequiredFields>
export type PartialLog = MakePartial<data.Log, LogRequiredFields>
export type PartialInternalTransaction = MakePartial<data.InternalTransaction, InternalTransactionRequiredFields>


export interface PartialBlock {
    header: PartialBlockHeader
    transactions?: PartialTransaction[]
    logs?: PartialLog[]
    internalTransactions?: PartialInternalTransaction[]
}
