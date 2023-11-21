import type * as base from '@subsquid/substrate-data'
import {
    BlockRequiredFields,
    InternalTransactionRequiredFields,
    LogRequiredFields,
    TransactionRequiredFields,
    Simplify
} from './data-partial'
import {BlockHeader_, InternalTransaction_, Transaction_, Log_} from './base'


type Selector<Props extends string, Exclusion extends string = ''> = {
    [P in Exclude<Props, Exclusion> as P extends `_${string}` ? never : P]?: boolean
}


export interface FieldSelection {
    block?: Selector<keyof BlockHeader_, BlockRequiredFields>
    transaction?: Selector<keyof Transaction_, TransactionRequiredFields>
    internalTransaction?: Selector<keyof InternalTransaction_, InternalTransactionRequiredFields>
    log?: Selector<keyof Log_, LogRequiredFields>
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
    Pick<BlockHeader_, BlockRequiredFields> &
    Select<BlockHeader_, GetFields<F, 'block'>>
>


export type Log<F extends FieldSelection = {}> = Simplify<
    {id: string} &
    Pick<Log_, LogRequiredFields> &
    Select<Log_, GetFields<F, 'log'>> &
    {block: BlockHeader<F>, transaction?: Transaction<F>}
>


export type Transaction<F extends FieldSelection = {}> = Simplify<
    Pick<Transaction_, TransactionRequiredFields> &
    Select<Transaction_, GetFields<F, 'transaction'>> &
    {block: BlockHeader<F>}
>


export type InternalTransaction<F extends FieldSelection = {}> = Simplify<
    Pick<InternalTransaction_, InternalTransactionRequiredFields> &
    Select<InternalTransaction_, GetFields<F, 'internalTransaction'>> &
    {block: BlockHeader<F>, transaction?: Transaction<F>}
>


export interface Block<F extends FieldSelection = {}> {
    header: BlockHeader<F>
    logs: Log<F>[]
    transactions: Transaction<F>[]
    internalTransactions: InternalTransaction<F>[]
}
