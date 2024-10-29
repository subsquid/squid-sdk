import type * as data from '@subsquid/starknet-normalization'
import type {MakePartial} from './util'

export type BlockRequiredFields = 'height' | 'hash'
export type TransactionRequiredFields = 'transactionIndex'
export type EventRequiredFields = 'transactionIndex' | 'eventIndex'

export type PartialBlockHeader = MakePartial<data.BlockHeader, BlockRequiredFields>
export type PartialTransaction = MakePartial<data.Transaction, TransactionRequiredFields>
export type PartialEvent = MakePartial<data.Event, EventRequiredFields>

export interface PartialBlock {
    header: PartialBlockHeader
    transactions?: PartialTransaction[]
    events?: PartialEvent[]
}
