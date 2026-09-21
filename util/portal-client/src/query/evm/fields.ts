import type {AddPrefix, GetFields, RemovePrefix, Select, Selector, Simplify} from '../type-util'
import type * as data from './data'

type BlockRequiredFields = 'number' | 'hash' | 'parentHash'

export interface FieldSelection {
    block?: Selector<Exclude<keyof data.BlockHeader, BlockRequiredFields>>
    transaction?: Selector<keyof data.Transaction>
    log?: Selector<keyof data.Log>
    trace?: Selector<
        | keyof data.TraceBase
        | AddPrefix<'create', keyof data.TraceCreateAction>
        | AddPrefix<'createResult', keyof data.TraceCreateResult>
        | AddPrefix<'call', keyof data.TraceCallAction>
        | AddPrefix<'callResult', keyof data.TraceCallResult>
        | AddPrefix<'suicide', keyof data.TraceSuicideAction>
        | AddPrefix<'reward', keyof data.TraceRewardAction>
    >
    stateDiff?: Selector<Exclude<keyof data.StateDiff, 'kind'>>
}

export type BlockHeader<F extends FieldSelection> = Simplify<
    Pick<data.BlockHeader, BlockRequiredFields> & Select<data.BlockHeader, GetFields<F['block']>>
>

export type Transaction<F extends FieldSelection> = Select<data.Transaction, GetFields<F['transaction']>>

export type Log<F extends FieldSelection> = Select<data.Log, GetFields<F['log']>>

export type TraceCreateAction<F extends FieldSelection> = Select<
    data.TraceCreateAction,
    RemovePrefix<'create', GetFields<F['trace']>>
>

export type TraceCreateResult<F extends FieldSelection> = Select<
    data.TraceCreateResult,
    RemovePrefix<'createResult', GetFields<F['trace']>>
>

export type TraceCallAction<F extends FieldSelection> = Select<
    data.TraceCallAction,
    RemovePrefix<'call', GetFields<F['trace']>>
>

export type TraceCallResult<F extends FieldSelection> = Select<
    data.TraceCallResult,
    RemovePrefix<'callResult', GetFields<F['trace']>>
>

export type TraceSuicideAction<F extends FieldSelection> = Select<
    data.TraceSuicideAction,
    RemovePrefix<'suicide', GetFields<F['trace']>>
>

export type TraceRewardAction<F extends FieldSelection> = Select<
    data.TraceRewardAction,
    RemovePrefix<'reward', GetFields<F['trace']>>
>

type TraceBase<F extends FieldSelection, Type> = {type: Type} & Select<data.TraceBase, GetFields<F['trace']>>

type RemoveEmptyObjects<T> = {
    [K in keyof T as {} extends T[K] ? never : K]: T[K]
}

export type TraceCreate<F extends FieldSelection> = Simplify<
    TraceBase<F, 'create'> &
        RemoveEmptyObjects<{
            action: TraceCreateAction<F>
            result?: TraceCreateResult<F>
        }>
>

export type TraceCall<F extends FieldSelection> = Simplify<
    TraceBase<F, 'call'> &
        RemoveEmptyObjects<{
            action: TraceCallAction<F>
            result?: TraceCallResult<F>
        }>
>

export type TraceSuicide<F extends FieldSelection> = Simplify<
    TraceBase<F, 'suicide'> &
        RemoveEmptyObjects<{
            action: TraceSuicideAction<F>
        }>
>

export type TraceReward<F extends FieldSelection> = Simplify<
    TraceBase<F, 'reward'> & RemoveEmptyObjects<{action: TraceRewardAction<F>}>
>

export type Trace<F extends FieldSelection> = TraceCreate<F> | TraceCall<F> | TraceSuicide<F> | TraceReward<F>

export type StateDiff<F extends FieldSelection> = Simplify<
    Pick<data.StateDiff, 'kind'> & Select<data.StateDiff, GetFields<F['stateDiff']>>
>

export interface Block<F extends FieldSelection> {
    header: BlockHeader<F>
    transactions: Transaction<F>[]
    logs: Log<F>[]
    traces: Trace<F>[]
    stateDiffs: StateDiff<F>[]
}
