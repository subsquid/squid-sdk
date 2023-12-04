import {BlockHeader, Transaction, InternalTransaction, Log} from '@subsquid/tron-data'


export type Simplify<T> = {
    [K in keyof T]: T[K]
} & {}


export type BlockRequiredFields = 'height' | 'hash' | 'parentHash'
export type TransactionRequiredFields = 'hash'
export type InternalTransactionRequiredFields = 'transactionHash'
export type LogRequiredFields = 'logIndex' | 'transactionHash'


type MakePartial<T, Required extends keyof T, IsArchive extends boolean = false> = Simplify<
    Pick<T, Required> &
    {
        [K in keyof T as K extends Required ? never : K]+?:
            IsArchive extends true
                ? bigint extends T[K] ? string : T[K]
                : T[K]
    }
>


export type PartialBlockHeader = MakePartial<BlockHeader, BlockRequiredFields>
export type PartialTransaction = MakePartial<Transaction, TransactionRequiredFields>
export type PartialInternalTransaction = MakePartial<InternalTransaction, InternalTransactionRequiredFields>
export type PartialLog = MakePartial<Log, LogRequiredFields>


export interface PartialBlock {
    header: PartialBlockHeader
    transactions?: PartialTransaction[]
    internalTransactions?: PartialInternalTransaction[]
    logs?: PartialLog[]
}


export type ArchiveBlockHeader = MakePartial<
    Omit<BlockHeader, 'height'>,
    Exclude<BlockRequiredFields, 'height'>, true
> & {number: number}

export type ArchiveTransaction = MakePartial<Transaction, TransactionRequiredFields, true>
export type ArchivePartialInternalTransaction = MakePartial<InternalTransaction, InternalTransactionRequiredFields, true>
export type ArchiveLog = MakePartial<Log, LogRequiredFields, true>


export interface ArchiveBlock {
    header: ArchiveBlockHeader
    transactions?: ArchiveTransaction[]
    internalTransactions?: ArchivePartialInternalTransaction[]
    logs?: ArchiveLog[]
}
