import type * as data from '@subsquid/tron-normalization'
import type {
    BlockRequiredFields,
    LogRequiredFields,
    InternalTransactionRequiredFields,
    TransactionRequiredFields
} from './data-partial'
import type {GetFields, Select, Selector, Simplify} from './util'


/**
 * Hex encoded binary string
 */
export type Bytes = string


export interface FieldSelection {
    block?: Selector<Exclude<keyof data.BlockHeader, BlockRequiredFields>>
    transaction?: Selector<Exclude<keyof data.Transaction, TransactionRequiredFields>>
    log?: Selector<Exclude<keyof data.Log, LogRequiredFields>>
    internalTransaction?: Selector<Exclude<keyof data.InternalTransaction, InternalTransactionRequiredFields>>
}


export const DEFAULT_FIELDS = {
    block: {
        parentHash: true,
        timestamp: true
    },
    transaction: {
        hash: true,
        type: true
    },
    log: {
        address: true,
        data: true,
        topics: true
    },
    internalTransaction: {
        callerAddress: true,
        transferToAddress: true
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
    BlockRequiredFields,
    F,
    'block'
>


export type Transaction<F extends FieldSelection = {}> = Item<
    data.Transaction,
    TransactionRequiredFields,
    F,
    'transaction'
> & {
    id: string
    block: BlockHeader<F>,
    logs?: Log<F>[]
    internalTransactions: InternalTransaction<F>[]
}


export type Log<F extends FieldSelection = {}> = Item<
    data.Log,
    LogRequiredFields,
    F,
    'log'
> & {
    id: string
    block: BlockHeader<F>,
    transaction?: Transaction<F>
    getTransaction(): Transaction<F>
}


export type InternalTransaction<F extends FieldSelection = {}> = Item<
    data.InternalTransaction,
    InternalTransactionRequiredFields,
    F,
    'internalTransaction'
> & {
    id: string
    block: BlockHeader<F>,
    transaction?: Transaction<F>
    getTransaction(): Transaction<F>
}


export interface Block<F extends FieldSelection = {}> {
    header: BlockHeader<F>
    transactions: Transaction<F>[]
    logs: Log<F>[]
    internalTransactions: InternalTransaction<F>[]
}
