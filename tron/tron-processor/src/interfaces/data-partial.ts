import {BlockHeader_, Transaction_, InternalTransaction_, Log_} from './base'


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


export type PartialBlockHeader = MakePartial<BlockHeader_, BlockRequiredFields>
export type PartialTransaction = MakePartial<Transaction_, TransactionRequiredFields>
export type PartialInternalTransaction = MakePartial<InternalTransaction_, InternalTransactionRequiredFields>
export type PartialLog = MakePartial<Log_, LogRequiredFields>


export interface PartialBlock {
    header: PartialBlockHeader
    transactions?: PartialTransaction[]
    internalTransactions?: PartialInternalTransaction[]
    logs?: PartialLog[]
}


export type ArchiveBlockHeader = MakePartial<
    Omit<BlockHeader_, 'height'>,
    Exclude<BlockRequiredFields, 'height'>, true
> & {number: number}

export type ArchiveTransaction = MakePartial<Transaction_, TransactionRequiredFields, true>
export type ArchivePartialInternalTransaction = MakePartial<InternalTransaction_, InternalTransactionRequiredFields, true>
export type ArchiveLog = MakePartial<Log_, LogRequiredFields, true>


export interface ArchiveBlock {
    header: ArchiveBlockHeader
    transactions?: ArchiveTransaction[]
    internalTransactions?: ArchivePartialInternalTransaction[]
    logs?: ArchiveLog[]
}
