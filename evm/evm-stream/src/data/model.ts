import type {
    BlockRequiredFields,
    LogRequiredFields,
    TraceRequiredFields,
    StateDiffRequiredFields,
    TransactionRequiredFields,
} from './partial'
import type {
    EvmBlockHeader,
    EvmTransaction,
    EvmLog,
    EvmTrace,
    EvmTraceBase,
    EvmTraceCreateAction,
    EvmTraceCreateResult,
    EvmTraceCallAction,
    EvmTraceCallResult,
    EvmTraceSuicideAction,
    EvmTraceRewardAction,
    EvmStateDiff,
    EvmStateDiffBase,
} from './evm'
import type {GetFields, Select, Selector, Simplify} from './type-util'

type AddPrefix<Prefix extends string, S extends string> = `${Prefix}${Capitalize<S>}`

export interface FieldSelection {
    block?: Selector<Exclude<keyof EvmBlockHeader, BlockRequiredFields>>
    transaction?: Selector<Exclude<keyof EvmTransaction, TransactionRequiredFields>>
    log?: Selector<Exclude<keyof EvmLog, LogRequiredFields>>
    trace?: Selector<
        | Exclude<keyof EvmTraceBase, TraceRequiredFields>
        | AddPrefix<'create', keyof EvmTraceCreateAction>
        | AddPrefix<'createResult', keyof EvmTraceCreateResult>
        | AddPrefix<'call', keyof EvmTraceCallAction>
        | AddPrefix<'callResult', keyof EvmTraceCallResult>
        | AddPrefix<'suicide', keyof EvmTraceSuicideAction>
        | AddPrefix<'reward', keyof EvmTraceRewardAction>
    >
    stateDiff?: Selector<Exclude<keyof EvmStateDiff, StateDiffRequiredFields>>
}

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

type Item<Data, RequiredFields extends keyof Data, F extends FieldSelection, K extends keyof FieldSelection> = Simplify<
    Pick<Data, RequiredFields> & Select<Data, GetFields<FieldSelection, typeof DEFAULT_FIELDS, F, K>>
>

export type BlockHeader<F extends FieldSelection = {}> = Item<EvmBlockHeader, BlockRequiredFields, F, 'block'>

export type Transaction<F extends FieldSelection = {}> = Item<
    EvmTransaction,
    TransactionRequiredFields,
    F,
    'transaction'
>

export type Log<F extends FieldSelection = {}> = Item<EvmLog, LogRequiredFields, F, 'log'>

type RemovePrefix<Prefix extends string, T> = T extends `${Prefix}${infer S}` ? Uncapitalize<S> : never

export type TraceCreateAction<F extends FieldSelection = {}> = Select<
    EvmTraceCreateAction,
    RemovePrefix<'create', GetFields<FieldSelection, typeof DEFAULT_FIELDS, F, 'trace'>>
>

export type TraceCreateResult<F extends FieldSelection = {}> = Select<
    EvmTraceCreateResult,
    RemovePrefix<'createResult', GetFields<FieldSelection, typeof DEFAULT_FIELDS, F, 'trace'>>
>

export type TraceCallAction<F extends FieldSelection = {}> = Select<
    EvmTraceCallAction,
    RemovePrefix<'call', GetFields<FieldSelection, typeof DEFAULT_FIELDS, F, 'trace'>>
>

export type TraceCallResult<F extends FieldSelection = {}> = Select<
    EvmTraceCallResult,
    RemovePrefix<'callResult', GetFields<FieldSelection, typeof DEFAULT_FIELDS, F, 'trace'>>
>

export type TraceSuicideAction<F extends FieldSelection = {}> = Select<
    EvmTraceSuicideAction,
    RemovePrefix<'suicide', GetFields<FieldSelection, typeof DEFAULT_FIELDS, F, 'trace'>>
>

export type TraceRewardAction<F extends FieldSelection = {}> = Select<
    EvmTraceRewardAction,
    RemovePrefix<'reward', GetFields<FieldSelection, typeof DEFAULT_FIELDS, F, 'trace'>>
>

type TraceBase<F extends FieldSelection = {}> = Pick<EvmTraceBase, Exclude<TraceRequiredFields, 'type'>> &
    Select<EvmTraceBase, GetFields<FieldSelection, typeof DEFAULT_FIELDS, F, 'trace'>>

type RemoveEmptyObjects<T> = {
    [K in keyof T as {} extends T[K] ? never : K]: T[K]
}

export type TraceCreate<F extends FieldSelection = {}> = Simplify<
    TraceBase<F> & {type: 'create'} & RemoveEmptyObjects<{action: TraceCreateAction<F>; result?: TraceCreateResult<F>}>
>

export type TraceCall<F extends FieldSelection = {}> = Simplify<
    TraceBase<F> & {type: 'call'} & RemoveEmptyObjects<{action: TraceCallAction<F>; result?: TraceCallResult<F>}>
>

export type TraceSuicide<F extends FieldSelection = {}> = Simplify<
    TraceBase<F> & {type: 'suicide'} & RemoveEmptyObjects<{action: TraceSuicideAction<F>}>
>

export type TraceReward<F extends FieldSelection = {}> = Simplify<
    TraceBase<F> & {type: 'reward'} & RemoveEmptyObjects<{action: TraceRewardAction<F>}>
>

export type Trace<F extends FieldSelection = {}> = TraceCreate<F> | TraceCall<F> | TraceSuicide<F> | TraceReward<F>

export type StateDiff<F extends FieldSelection = {}> = Simplify<
    EvmStateDiffBase & Select<EvmStateDiff, GetFields<FieldSelection, typeof DEFAULT_FIELDS, F, 'stateDiff'>>
>

export interface Block<F extends FieldSelection = {}> {
    header: BlockHeader<F>
    transactions: Transaction<F>[]
    logs: Log<F>[]
    traces: Trace<F>[]
    stateDiffs: StateDiff<F>[]
}
