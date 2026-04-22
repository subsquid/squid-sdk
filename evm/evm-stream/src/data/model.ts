import type {
    BlockRequiredFields,
    LogRequiredFields,
    StateDiffRequiredFields,
    TraceRequiredFields,
    TransactionRequiredFields,
} from './partial'
import type {
    EvmBlockHeader,
    EvmLog,
    EvmStateDiff,
    EvmStateDiffBase,
    EvmTraceBase,
    EvmTraceCallAction,
    EvmTraceCallResult,
    EvmTraceCreateAction,
    EvmTraceCreateResult,
    EvmTraceRewardAction,
    EvmTraceSuicideAction,
    EvmTransaction,
} from './evm'
import type {GetFields, Select, Selector, Simplify} from './type-util'

/** Namespaced string built from a `Prefix` and a `Capitalize`d payload. */
type Prefixed<Prefix extends string, S extends string> = `${Prefix}${Capitalize<S>}`

/** Inverse of `Prefixed`. Returns `never` when the prefix does not match. */
type Unprefixed<Prefix extends string, T> = T extends `${Prefix}${infer S}` ? Uncapitalize<S> : never

/**
 * User-facing field selection. Each section is an optional `Selector`
 * over that section's non-required fields.
 */
export interface FieldSelection {
    block?: Selector<Exclude<keyof EvmBlockHeader, BlockRequiredFields>>
    transaction?: Selector<Exclude<keyof EvmTransaction, TransactionRequiredFields>>
    log?: Selector<Exclude<keyof EvmLog, LogRequiredFields>>
    trace?: Selector<
        | Exclude<keyof EvmTraceBase, TraceRequiredFields>
        | Prefixed<'create', keyof EvmTraceCreateAction>
        | Prefixed<'createResult', keyof EvmTraceCreateResult>
        | Prefixed<'call', keyof EvmTraceCallAction>
        | Prefixed<'callResult', keyof EvmTraceCallResult>
        | Prefixed<'suicide', keyof EvmTraceSuicideAction>
        | Prefixed<'reward', keyof EvmTraceRewardAction>
    >
    stateDiff?: Selector<Exclude<keyof EvmStateDiff, StateDiffRequiredFields>>
}

export type FieldKey = keyof FieldSelection

/**
 * Default field set applied when {@link DataSourceBuilder#setFields} is not
 * called.  `as const` preserves the literal `true` values so they feed through
 * {@link GetFields} correctly.
 */
export const DEFAULT_FIELDS = {
    block: {
        timestamp: true,
    },
    log: {
        address: true,
        topics: true,
        data: true,
    },
    transaction: {
        from: true,
        to: true,
        hash: true,
    },
    trace: {
        error: true,
    },
    stateDiff: {
        kind: true,
        next: true,
        prev: true,
    },
} as const satisfies FieldSelection

/**
 * A concrete item type derived from a raw data shape, the always-present
 * required keys, and a per-section field selection.
 */
type Item<Data, Required extends keyof Data, F extends FieldSelection, K extends FieldKey> = Simplify<
    Pick<Data, Required> & Select<Data, GetFields<F, K>>
>

export type BlockHeader<F extends FieldSelection = {}> = Item<EvmBlockHeader, BlockRequiredFields, F, 'block'>

export type Transaction<F extends FieldSelection = {}> = Item<EvmTransaction, TransactionRequiredFields, F, 'transaction'>

export type Log<F extends FieldSelection = {}> = Item<EvmLog, LogRequiredFields, F, 'log'>

type TraceActionFields<Prefix extends string, F extends FieldSelection> = Unprefixed<Prefix, GetFields<F, 'trace'>>

export type TraceCreateAction<F extends FieldSelection = {}> = Select<
    EvmTraceCreateAction,
    TraceActionFields<'create', F>
>

export type TraceCreateResult<F extends FieldSelection = {}> = Select<
    EvmTraceCreateResult,
    TraceActionFields<'createResult', F>
>

export type TraceCallAction<F extends FieldSelection = {}> = Select<EvmTraceCallAction, TraceActionFields<'call', F>>

export type TraceCallResult<F extends FieldSelection = {}> = Select<
    EvmTraceCallResult,
    TraceActionFields<'callResult', F>
>

export type TraceSuicideAction<F extends FieldSelection = {}> = Select<
    EvmTraceSuicideAction,
    TraceActionFields<'suicide', F>
>

export type TraceRewardAction<F extends FieldSelection = {}> = Select<
    EvmTraceRewardAction,
    TraceActionFields<'reward', F>
>

type TraceBase<F extends FieldSelection = {}> = Simplify<
    Pick<EvmTraceBase, Exclude<TraceRequiredFields, 'type'>> & Select<EvmTraceBase, GetFields<F, 'trace'>>
>

/** Drops keys whose value type is the empty object (i.e. no fields selected). */
type OmitEmpty<T> = {
    [K in keyof T as {} extends T[K] ? never : K]: T[K]
}

export type TraceCreate<F extends FieldSelection = {}> = Simplify<
    TraceBase<F> & {type: 'create'} & OmitEmpty<{action: TraceCreateAction<F>; result?: TraceCreateResult<F>}>
>

export type TraceCall<F extends FieldSelection = {}> = Simplify<
    TraceBase<F> & {type: 'call'} & OmitEmpty<{action: TraceCallAction<F>; result?: TraceCallResult<F>}>
>

export type TraceSuicide<F extends FieldSelection = {}> = Simplify<
    TraceBase<F> & {type: 'suicide'} & OmitEmpty<{action: TraceSuicideAction<F>}>
>

export type TraceReward<F extends FieldSelection = {}> = Simplify<
    TraceBase<F> & {type: 'reward'} & OmitEmpty<{action: TraceRewardAction<F>}>
>

export type Trace<F extends FieldSelection = {}> = TraceCreate<F> | TraceCall<F> | TraceSuicide<F> | TraceReward<F>

export type StateDiff<F extends FieldSelection = {}> = Simplify<
    EvmStateDiffBase & Select<EvmStateDiff, GetFields<F, 'stateDiff'>>
>

export interface Block<F extends FieldSelection = {}> {
    header: BlockHeader<F>
    transactions: Transaction<F>[]
    logs: Log<F>[]
    traces: Trace<F>[]
    stateDiffs: StateDiff<F>[]
}
