import type {AugmentedBlock} from '@subsquid/evm-objects'
import type * as stream from '@subsquid/evm-stream'

export type BlockRequiredFields = 'number' | 'height' | 'hash' | 'parentHash'
export type TransactionRequiredFields = 'transactionIndex'
export type LogRequiredFields = 'logIndex' | 'transactionIndex'
export type TraceRequiredFields = 'transactionIndex' | 'traceAddress' | 'type'
export type StateDiffRequiredFields = 'transactionIndex' | 'address' | 'key'

export interface FieldSelection extends stream.FieldSelection {}

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
} as const

export type DefaultFields = typeof DEFAULT_FIELDS
type EmptySelection = Record<never, never>

type ExcludeUndefined<T> = {
    [K in keyof T as undefined extends T[K] ? never : K]: T[K]
}

type MergeDefault<T, D> = undefined extends T ? D : Omit<D, keyof ExcludeUndefined<T>> & ExcludeUndefined<T>
type ForceStateDiffKind<T> = Omit<T, 'kind'> & {kind: true}

export type FieldSelectionWithDefaults<F extends FieldSelection = EmptySelection> = {
    block: MergeDefault<F['block'], DefaultFields['block']>
    transaction: MergeDefault<F['transaction'], DefaultFields['transaction']>
    log: MergeDefault<F['log'], DefaultFields['log']>
    trace: MergeDefault<F['trace'], DefaultFields['trace']>
    stateDiff: ForceStateDiffKind<MergeDefault<F['stateDiff'], DefaultFields['stateDiff']>>
}

type Trues<T> = {
    [K in keyof T as true extends T[K] ? K : never]: true
}

export type BlockData<F extends FieldSelection = EmptySelection> = AugmentedBlock<
    stream.Block<FieldSelectionWithDefaults<F>>
>

export type BlockHeader<F extends FieldSelection = EmptySelection> = BlockData<F>['header']

export type Transaction<F extends FieldSelection = EmptySelection> = BlockData<F>['transactions'][number]

export type Log<F extends FieldSelection = EmptySelection> = BlockData<F>['logs'][number]

export type Trace<F extends FieldSelection = EmptySelection> = BlockData<F>['traces'][number]

export type TraceCreate<F extends FieldSelection = EmptySelection> = Extract<Trace<F>, {type: 'create'}>

export type TraceCall<F extends FieldSelection = EmptySelection> = Extract<Trace<F>, {type: 'call'}>

export type TraceSuicide<F extends FieldSelection = EmptySelection> = Extract<Trace<F>, {type: 'suicide'}>

export type TraceReward<F extends FieldSelection = EmptySelection> = Extract<Trace<F>, {type: 'reward'}>

export type TraceCreateAction<F extends FieldSelection = EmptySelection> = stream.TraceCreateAction<
    FieldSelectionWithDefaults<F>
>

export type TraceCreateResult<F extends FieldSelection = EmptySelection> = stream.TraceCreateResult<
    FieldSelectionWithDefaults<F>
>

export type TraceCallAction<F extends FieldSelection = EmptySelection> = stream.TraceCallAction<
    FieldSelectionWithDefaults<F>
>

export type TraceCallResult<F extends FieldSelection = EmptySelection> = stream.TraceCallResult<
    FieldSelectionWithDefaults<F>
>

export type TraceSuicideAction<F extends FieldSelection = EmptySelection> = stream.TraceSuicideAction<
    FieldSelectionWithDefaults<F>
>

export type TraceRewardAction<F extends FieldSelection = EmptySelection> = stream.TraceRewardAction<
    FieldSelectionWithDefaults<F>
>

export type StateDiff<F extends FieldSelection = EmptySelection> = BlockData<F>['stateDiffs'][number]

export type AllFields = {
    block: Trues<NonNullable<FieldSelection['block']>>
    transaction: Trues<NonNullable<FieldSelection['transaction']>>
    log: Trues<NonNullable<FieldSelection['log']>>
    trace: Trues<NonNullable<FieldSelection['trace']>>
    stateDiff: Trues<NonNullable<FieldSelection['stateDiff']>>
}
