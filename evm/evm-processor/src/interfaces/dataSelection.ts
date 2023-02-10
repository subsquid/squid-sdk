import type {EvmLog, EvmTransaction} from './evm'

type Req<T> = {
    [P in keyof T]?: unknown
}

type PlainReq<T> = {
    [P in keyof T]?: true
}

type Select<T, R extends Req<T>, K = false> = {
    [P in keyof T as R[P] extends true ? P : P extends K ? P : never]: T[P]
}

export type WithProp<K extends string, V> = [V] extends [never]
    ? {}
    : {
          [k in K]: V
      }

export type TransactionRequest = Omit<PlainReq<EvmTransaction>, keyof TransactionDefaultRequest>

export type LogRequest = Omit<PlainReq<EvmLog>, keyof LogDefaultRequest>

type TransactionFields<R extends TransactionRequest> = Select<EvmTransaction, R, keyof TransactionDefaultRequest>

export type TransactionType<R> = R extends true
    ? EvmTransaction
    : R extends TransactionRequest
    ? TransactionFields<R>
    : never

type LogFields<R extends LogRequest> = Select<EvmLog, R, keyof LogDefaultRequest>

type LogType<R> = R extends LogRequest ? LogFields<R> : LogFields<{}>

export interface TransactionDataRequest {
    transaction: TransactionRequest
}

export type TransactionData<R extends TransactionDataRequest = {transaction: {}}> = WithProp<
    'transaction',
    TransactionType<R['transaction']>
>

export interface LogDataRequest {
    evmLog: LogRequest
    transaction?: TransactionRequest
}

export type LogData<R extends LogDataRequest = {evmLog: {}}> = WithProp<'evmLog', LogType<R['evmLog']>> &
    WithProp<'transaction', TransactionType<R['transaction']>>

type WithKind<K, T> = {kind: K} & {
    [P in keyof T]: T[P]
}

export type LogItem<R = false> = WithKind<'evmLog', R extends LogDataRequest ? LogData<R> : LogData<{evmLog: {}}>> & {
    address: string
}

export type TransactionItem<R = false> = WithKind<
    'transaction',
    R extends TransactionDataRequest ? TransactionData<R> : TransactionData<{transaction: {}}>
> & {address: string}

export type ItemMerge<A, B, R> = [A] extends [never]
    ? B
    : [B] extends [never]
    ? A
    : [Exclude<R, undefined | boolean>] extends [never]
    ? A
    : undefined extends A
    ? undefined | ObjectItemMerge<Exclude<A, undefined>, Exclude<B, undefined>, Exclude<R, undefined | boolean>>
    : ObjectItemMerge<A, B, Exclude<R, undefined | boolean>>

type ObjectItemMerge<A, B, R> = {
    [K in keyof A | keyof B]: K extends keyof A
        ? K extends keyof B
            ? K extends keyof R
                ? ItemMerge<A[K], B[K], R[K]>
                : A[K]
            : A[K]
        : K extends keyof B
        ? B[K]
        : never
}

type ItemKind = {
    kind: string
}

type AddItem<T extends ItemKind, I extends ItemKind, R> =
    | (T extends Pick<I, 'kind'> ? ItemMerge<T, I, R> : T)
    | Exclude<I, Pick<T, 'kind'>>

export type AddLogItem<T extends ItemKind, I extends ItemKind> = AddItem<T, I, LogDataRequest>
export type AddTransactionItem<T extends ItemKind, I extends ItemKind> = AddItem<T, I, TransactionDataRequest>

export interface DataSelection<R> {
    data: R
}

export interface NoDataSelection {
    data?: undefined
}

export interface MayBeDataSelection<R> {
    data?: R
}

export const DEFAULT_REQUEST = {
    block: {
        number: true,
        hash: true,
        parentHash: true,
        nonce: true,
        sha3Uncles: true,
        logsBloom: true,
        transactionsRoot: true,
        stateRoot: true,
        receiptsRoot: true,
        miner: true,
        difficulty: true,
        totalDifficulty: true,
        extraData: true,
        size: true,
        gasLimit: true,
        gasUsed: true,
        timestamp: true,
        mixHash: true,
        baseFeePerGas: true
    },
    evmLog: {
        address: true,
        index: true,
        transactionIndex: true,
    },
    transaction: {
        to: true,
        index: true,
    },
} as const

type LogDefaultRequest = typeof DEFAULT_REQUEST.evmLog & {id: true}
type TransactionDefaultRequest = typeof DEFAULT_REQUEST.transaction & {id: true}
