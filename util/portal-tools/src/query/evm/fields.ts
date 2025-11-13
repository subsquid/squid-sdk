import type {AddPrefix, GetFields, RemovePrefix, Select, Selector, Simplify} from '../type-util'
import type * as data from './data'


type BlockRequiredFields = 'number' | 'hash' | 'parentHash'


export interface EvmFieldSelection {
    block?: Selector<Exclude<keyof data.BlockHeader, BlockRequiredFields>>
    transaction?: Selector<keyof data.Transaction>
    log?: Selector<keyof data.Log>
    trace?: Selector<
        keyof data.TraceBase |
        AddPrefix<'create', keyof data.TraceCreateAction> |
        AddPrefix<'createResult', keyof data.TraceCreateResult> |
        AddPrefix<'call', keyof data.TraceCallAction> |
        AddPrefix<'callResult', keyof data.TraceCallResult> |
        AddPrefix<'suicide', keyof data.TraceSuicideAction> |
        AddPrefix<'reward', keyof data.TraceRewardAction>
    >
    stateDiff?: Selector<Exclude<keyof data.StateDiff, 'kind'>>
}


export type EvmBlockHeader<F extends EvmFieldSelection> = Simplify<
    Pick<data.BlockHeader, BlockRequiredFields> &
    Select<data.BlockHeader, GetFields<F['block']>>
>


export type EvmTransaction<F extends EvmFieldSelection> = Select<
    data.Transaction,
    GetFields<F['transaction']>
>


export type EvmLog<F extends EvmFieldSelection> = Select<
    data.Log,
    GetFields<F['log']>
>


export type EvmTraceCreateAction<F extends EvmFieldSelection> = Select<
    data.TraceCreateAction,
    RemovePrefix<'create', GetFields<F['trace']>>
>


export type EvmTraceCreateResult<F extends EvmFieldSelection> = Select<
    data.TraceCreateResult,
    RemovePrefix<'createResult', GetFields<F['trace']>>
>


export type EvmTraceCallAction<F extends EvmFieldSelection> = Select<
    data.TraceCallAction,
    RemovePrefix<'call', GetFields<F['trace']>>
>


export type EvmTraceCallResult<F extends EvmFieldSelection> = Select<
    data.TraceCallResult,
    RemovePrefix<'callResult', GetFields<F['trace']>>
>


export type EvmTraceSuicideAction<F extends EvmFieldSelection> = Select<
    data.TraceSuicideAction,
    RemovePrefix<'suicide', GetFields<F['trace']>>
>


export type EvmTraceRewardAction<F extends EvmFieldSelection> = Select<
    data.TraceRewardAction,
    RemovePrefix<'reward', GetFields<F['trace']>>
>


type TraceBase<F extends EvmFieldSelection, Type> = {type: Type} & Select<
    data.TraceBase,
    GetFields<F['trace']>
>


type RemoveEmptyObjects<T> = {
    [K in keyof T as {} extends T[K] ? never : K]: T[K]
}


export type EvmTraceCreate<F extends EvmFieldSelection> = Simplify<
    TraceBase<F, 'create'> &
    RemoveEmptyObjects<{
        action: EvmTraceCreateAction<F>,
        result?: EvmTraceCreateResult<F>
    }>
>


export type EvmTraceCall<F extends EvmFieldSelection> = Simplify<
    TraceBase<F, 'call'> &
    RemoveEmptyObjects<{
        action: EvmTraceCallAction<F>,
        result?: EvmTraceCallResult<F>
    }>
>


export type EvmTraceSuicide<F extends EvmFieldSelection> = Simplify<
    TraceBase<F, 'suicide'> &
    RemoveEmptyObjects<{
        action: EvmTraceSuicideAction<F>
    }>
>


export type EvmTraceReward<F extends EvmFieldSelection> = Simplify<
    TraceBase<F, 'reward'> &
    RemoveEmptyObjects<{action: EvmTraceRewardAction<F>}>
>


export type EvmTrace<F extends EvmFieldSelection> =
    EvmTraceCreate<F> |
    EvmTraceCall<F> |
    EvmTraceSuicide<F> |
    EvmTraceReward<F>


export type EvmStateDiff<F extends EvmFieldSelection> = Simplify<
    Pick<data.StateDiff, 'kind'> &
    Select<data.StateDiff, GetFields<F['stateDiff']>>
>


export interface EvmBlock<F extends EvmFieldSelection> {
    header: EvmBlockHeader<F>
    transactions?: EvmTransaction<F>[]
    logs?: EvmLog<F>[]
    traces?: EvmTrace<F>[]
    stateDiffs?: EvmStateDiff<F>[]
}
