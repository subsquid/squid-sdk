import * as base from '@subsquid/tron-data'
import {
    BlockRequiredFields,
    InternalTransactionRequiredFields,
    LogRequiredFields,
    TransactionRequiredFields,
    Simplify
} from './data-partial'


type Selector<Props extends string, Exclusion extends string = ''> = {
    [P in Exclude<Props, Exclusion> as P extends `_${string}` ? never : P]?: boolean
}


export interface FieldSelection {
    block?: Selector<keyof base.BlockHeader, BlockRequiredFields>
    transaction?: Selector<keyof base.Transaction, TransactionRequiredFields>
    internalTransaction?: Selector<keyof base.InternalTransaction, InternalTransactionRequiredFields>
    log?: Selector<keyof base.Log, LogRequiredFields>
}


export const DEFAULT_FIELDS = {
    block: {
        timestamp: true
    },
    log: {
        address: true,
        topics: true,
        data: true
    },
    transaction: {
        hash: true,
        type: true
    },
    internalTransaction: {}
} as const


type DefaultFields = typeof DEFAULT_FIELDS


type ExcludeUndefined<T> = {
    [K in keyof T as undefined extends T[K] ? never : K]: T[K]
} & {}


type MergeDefault<T, D> = Simplify<
    undefined extends T ? D : Omit<D, keyof ExcludeUndefined<T>> & ExcludeUndefined<T>
>


type TrueFields<F> = keyof {
    [K in keyof F as true extends F[K] ? K : never]: true
}


type GetFields<F extends FieldSelection, P extends keyof DefaultFields>
    = TrueFields<MergeDefault<F[P], DefaultFields[P]>>


type Select<T, F> = T extends any ? Simplify<Pick<T, Extract<keyof T, F>>> : never


export type BlockHeader<F extends FieldSelection = {}> = Simplify<
    {id: string} &
    Pick<base.BlockHeader, BlockRequiredFields> &
    Select<base.BlockHeader, GetFields<F, 'block'>>
>


export type Log<F extends FieldSelection = {}> = Simplify<
    {id: string} &
    Pick<base.Log, LogRequiredFields> &
    Select<base.Log, GetFields<F, 'log'>> &
    {block: BlockHeader<F>, transaction?: Transaction<F>}
>


export type Transaction<F extends FieldSelection = {}> = Simplify<
    Pick<base.Transaction, TransactionRequiredFields> &
    Select<base.Transaction, GetFields<F, 'transaction'>> &
    {block: BlockHeader<F>}
>


export type InternalTransaction<F extends FieldSelection = {}> = Simplify<
    Pick<base.InternalTransaction, InternalTransactionRequiredFields> &
    Select<base.InternalTransaction, GetFields<F, 'internalTransaction'>> &
    {block: BlockHeader<F>, transaction?: Transaction<F>}
>


export interface Block<F extends FieldSelection = {}> {
    header: BlockHeader<F>
    logs: Log<F>[]
    transactions: Transaction<F>[]
    internalTransactions: InternalTransaction<F>[]
}
