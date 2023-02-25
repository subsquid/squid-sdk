import {Bytes32, EvmAddress, EvmBlock, EvmLog, EvmTransaction} from './evm'


type Simplify<T> = {
    [K in keyof T]: T[K]
} & {}


type Selector<T> = {
    [K in keyof T]?: boolean
}


export type BlockFields = Simplify<Omit<Selector<EvmBlock>, 'id'>>
export type LogFields = Simplify<Omit<Selector<EvmLog>, 'id'> & {transaction?: boolean}>
export type TransactionFields = Omit<Selector<EvmTransaction>, 'id'>


export type Fields = {
    block?: BlockFields
    log?: LogFields
    transaction?: TransactionFields
}


export const DEFAULT_FIELDS = {
    block: {
        height: true,
        hash: true,
        parentHash: true,
        timestamp: true
    },
    log: {
        transactionIndex: true,
        transactionHash: true,
        index: true,
        address: true,
        topics: true,
        data: true
    },
    transaction: {
        index: true,
        from: true,
        to: true,
        input: true,
        hash: true,
        nonce: true,
        status: true,
        type: true
    }
} as const


type DefaultFields = typeof DEFAULT_FIELDS


type ExcludeUndefined<T> = {
    [K in keyof T as undefined extends T[K] ? never : K]: T[K]
} & {}


type MergeDefault<T, D> = Simplify<
    undefined extends T ? D : Omit<D, keyof ExcludeUndefined<T>> & ExcludeUndefined<T>
>


type AddOption<T> = {
    [P in keyof T as undefined extends T[P] ? P : never]+?: T[P]
} & {
    [P in keyof T as undefined extends T[P] ? never : P]: T[P]
}


type Select<T, F> = {id: string} & AddOption<{
    -readonly [K in keyof F as true extends F[K] ? K : never]: K extends keyof T ? T[K] : never
}>


export type BlockHeader<F extends Fields = {}> = Simplify<
    Select<EvmBlock, MergeDefault<F['block'], DefaultFields['block']>>
>


export type Transaction<F extends Fields = {}> = Simplify<
    Select<EvmTransaction, MergeDefault<F['transaction'], DefaultFields['transaction']>>
>


export type Log<F extends Fields = {}> = Simplify<
    Select<EvmLog, Omit<MergeDefault<F['log'], DefaultFields['log']>, 'transaction'>>
>


export type LogItem<F extends Fields = {}> = Simplify<
    {
        kind: 'log'
        log: Log<F>
    } &
    (
        F['log'] extends LogFields
            ? F['log']['transaction'] extends true
                ? {transaction: Transaction<F>}
                : {}
            : {}
    )
>


export type TransactionItem<F extends Fields = {}> = {
    kind: 'transaction',
    transaction: Transaction<F>
}


export type BlockItem<F extends Fields = {}> = LogItem<F> | TransactionItem<F>


export type BlockData<F extends Fields = {}> = {
    header: BlockHeader<F>
    items: BlockItem<F>[]
}


export interface FullLogItem {
    kind: 'log'
    log: EvmLog
    transaction: EvmTransaction
}


export interface FullTransactionItem {
    kind: 'transaction'
    transaction: EvmTransaction
}


export interface FullBlockData {
    header: EvmBlock
    items: (FullLogItem | FullTransactionItem)[]
}


export interface DataRequest {
    includeAllBlocks?: boolean
    logs?: LogItemRequest[]
    transactions?: TransactionItemRequest[]
    fields?: Fields
}


export interface LogItemRequest {
    address?: EvmAddress[]
    filter?: EvmTopicSet
}


export type EvmTopicSet = Bytes32[][]


export interface TransactionItemRequest {
    to?: EvmAddress[]
    from?: EvmAddress[]
    sighash?: Bytes32[]
}
