import {
    EvmBlock,
    EvmLog,
    EvmStateDiff, EvmStateDiffBase,
    EvmTraceBase,
    EvmTraceCallAction,
    EvmTraceCallResult,
    EvmTraceCreateAction,
    EvmTraceCreateResult,
    EvmTraceRewardAction,
    EvmTraceSuicideAction,
    EvmTransaction
} from './evm'


type Simplify<T> = {
    [K in keyof T]: T[K]
} & {}


type Selector<Props extends string, Exclusion extends string = 'id'> = {
    [P in Exclude<Props, Exclusion>]?: boolean
}


type AddPrefix<Prefix extends string, S extends string> = `${Prefix}${Capitalize<S>}`


type BlockRequiredFields = 'height' | 'hash' | 'parentHash'
type TransactionRequiredFields = 'transactionIndex'
type LogRequiredFields = 'logIndex' | 'transactionIndex'
type TraceRequiredFields = 'transactionIndex' | 'traceAddress' | 'type'
type StateDiffRequiredFields = 'transactionIndex' | 'address' | 'key'


export interface FieldSelection {
    block?: Selector<keyof EvmBlock, BlockRequiredFields>
    transaction?: Selector<keyof EvmTransaction, TransactionRequiredFields>
    log?: Selector<keyof EvmLog, LogRequiredFields>
    trace?: Selector<
        keyof EvmTraceBase |
        AddPrefix<'create', keyof EvmTraceCreateAction> |
        AddPrefix<'createResult', keyof EvmTraceCreateResult> |
        AddPrefix<'call', keyof EvmTraceCallAction> |
        AddPrefix<'callResult', keyof EvmTraceCallResult> |
        AddPrefix<'suicide', keyof EvmTraceSuicideAction> |
        AddPrefix<'reward', keyof EvmTraceRewardAction>,
        TraceRequiredFields
    >
    stateDiff?: Selector<keyof EvmStateDiff, StateDiffRequiredFields>
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
        from: true,
        to: true,
        hash: true
    },
    trace: {
        error: true
    },
    stateDiff: {
        kind: true,
        next: true,
        prev: true
    }
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
    Pick<EvmBlock, BlockRequiredFields> &
    Select<EvmBlock, GetFields<F, 'block'>>
>


export type Transaction<F extends FieldSelection = {}> = Simplify<
    {id: string} &
    Pick<EvmTransaction, TransactionRequiredFields> &
    Select<EvmTransaction, GetFields<F, 'transaction'>> &
    {block: BlockHeader<F>}
>


export type Log<F extends FieldSelection = {}> = Simplify<
    {id: string} &
    Pick<EvmLog, LogRequiredFields> &
    Select<EvmLog, GetFields<F, 'log'>> &
    {block: BlockHeader<F>, transaction?: Transaction<F>}
>


type RemovePrefix<Prefix extends string, T>
    = T extends `${Prefix}${infer S}`
        ? Uncapitalize<S>
        : never


export type TraceCreateAction<F extends FieldSelection = {}> = Select<
    EvmTraceCreateAction,
    RemovePrefix<'create', GetFields<F, 'trace'>>
>


export type TraceCreateResult<F extends FieldSelection = {}> = Select<
    EvmTraceCreateResult,
    RemovePrefix<'createResult', GetFields<F, 'trace'>>
>


export type TraceCallAction<F extends FieldSelection = {}> = Select<
    EvmTraceCallAction,
    RemovePrefix<'call', GetFields<F, 'trace'>>
>


export type TraceCallResult<F extends FieldSelection = {}> = Select<
    EvmTraceCallResult,
    RemovePrefix<'callResult', GetFields<F, 'trace'>>
>


export type TraceSuicideAction<F extends FieldSelection = {}> = Select<
    EvmTraceSuicideAction,
    RemovePrefix<'suicide', GetFields<F, 'trace'>>
>


export type TraceRewardAction<F extends FieldSelection = {}> = Select<
    EvmTraceRewardAction,
    RemovePrefix<'reward', GetFields<F, 'trace'>>
>


type TraceBase<F extends FieldSelection = {}> =
    Pick<EvmTraceBase, Exclude<TraceRequiredFields, 'type'>> &
    Select<EvmTraceBase, GetFields<F, 'trace'>> &
    {block: BlockHeader<F>, transaction?: Transaction<F>}


type RemoveEmptyObjects<T> = {
    [K in keyof T as {} extends T[K] ? never : K]: T[K]
}


export type TraceCreate<F extends FieldSelection = {}> = Simplify<
    TraceBase<F> &
    {type: 'create'} &
    RemoveEmptyObjects<{action: TraceCreateAction<F>, result?: TraceCreateResult<F>}>
>


export type TraceCall<F extends FieldSelection = {}> = Simplify<
    TraceBase<F> &
    {type: 'call'} &
    RemoveEmptyObjects<{action: TraceCallAction<F>, result?: TraceCallResult<F>}>
>


export type TraceSuicide<F extends FieldSelection = {}> = Simplify<
    TraceBase<F> &
    {type: 'suicide'} &
    RemoveEmptyObjects<{action: TraceSuicideAction<F>}>
>


export type TraceReward<F extends FieldSelection = {}> = Simplify<
    TraceBase<F> &
    {type: 'reward'} &
    RemoveEmptyObjects<{action: TraceRewardAction<F>}>
>


export type Trace<F extends FieldSelection = {}> =
    TraceCreate<F> |
    TraceCall<F> |
    TraceSuicide<F> |
    TraceReward<F>


export type StateDiff<F extends FieldSelection = {}> = Simplify<
    EvmStateDiffBase &
    Select<EvmStateDiff, GetFields<F, 'stateDiff'>> &
    {block: BlockHeader<F>, transaction?: Transaction<F>}
>


export type BlockData<F extends FieldSelection = {}> = {
    header: BlockHeader<F>
    transactions: Transaction<F>[]
    logs: Log<F>[]
    traces: Trace<F>[]
    stateDiffs: StateDiff<F>[]
}


export type AllFields = {
    block: Trues<FieldSelection['block']>
    transaction: Trues<FieldSelection['transaction']>
    log: Trues<FieldSelection['log']>
    trace: Trues<FieldSelection['trace']>
    stateDiff: Trues<FieldSelection['stateDiff']>
}


type Trues<T> = {
    [K in keyof Exclude<T, undefined>]-?: true
}
