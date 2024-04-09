import type * as base from '@subsquid/substrate-data'
import {Runtime} from '@subsquid/substrate-runtime'
import {
    BlockRequiredFields,
    CallRequiredFields,
    EventRequiredFields,
    ExtrinsicRequiredFields,
    Simplify
} from './data-partial'


type Selector<Props extends string, Exclusion extends string = ''> = {
    [P in Exclude<Props, Exclusion> as P extends `_${string}` ? never : P]?: boolean
}


export interface FieldSelection {
    block?: Selector<keyof base.BlockHeader, BlockRequiredFields>
    extrinsic?: Selector<keyof base.Extrinsic, ExtrinsicRequiredFields>
    call?: Selector<keyof base.Call, CallRequiredFields>
    event?: Selector<keyof base.Event, EventRequiredFields>
}


export const DEFAULT_FIELDS = {
    block: {},
    extrinsic: {},
    call: {
        name: true,
        args: true
    },
    event: {
        name: true,
        args: true
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
    Pick<base.BlockHeader, BlockRequiredFields> &
    Select<base.BlockHeader, GetFields<F, 'block'>> &
    {
        _runtime: Runtime
        _runtimeOfPrevBlock: Runtime
        getParent(): ParentBlockHeader
    }
>


export interface ParentBlockHeader {
    _runtime: Runtime
    hash: base.Bytes
    height: number
}


interface FullExtrinsic extends base.Extrinsic {
    success: boolean
    hash: base.Bytes
}


export type Extrinsic<F extends FieldSelection = {}> = Simplify<
    {id: string} &
    Pick<FullExtrinsic, ExtrinsicRequiredFields> &
    Select<FullExtrinsic, GetFields<F, 'extrinsic'>> &
    {
        block: BlockHeader<F>
        call?: Call<F>
        getCall(): Call<F>
        subcalls: Call<F>[]
        events: Event<F>[]
    }
>


export type Json = any


interface FullCall extends base.Call {
    success: boolean
    args: Json
    origin?: Json
    error?: Json
}


export type Call<F extends FieldSelection = {}> = Simplify<
    {id: string} &
    Pick<FullCall, CallRequiredFields> &
    Select<FullCall, GetFields<F, 'call'>> &
    {
        block: BlockHeader<F>
        extrinsic?: Extrinsic<F>
        getExtrinsic(): Extrinsic<F>
        parentCall?: Call<F>
        getParentCall(): Call<F>
        subcalls: Call<F>[]
        events: Event<F>[]
    }
>


interface ApplyExtrinsicEvent extends base.Event {
    args: Json
    phase: 'ApplyExtrinsic'
    extrinsicIndex: number
    callAddress?: number[]
}


interface NonExtrinsicEvent extends base.Event {
    args: Json
    phase: 'Initialization' | 'Finalization'
    extrinsicIndex?: undefined
    callAddress?: undefined
}


type BaseEvent = ApplyExtrinsicEvent | NonExtrinsicEvent


export type Event<F extends FieldSelection = {}> = Simplify<
    {id: string} &
    Pick<BaseEvent, EventRequiredFields> &
    Select<BaseEvent, GetFields<F, 'event'>> &
    {
        block: BlockHeader<F>
        call?: Call<F>
        getCall(): Call<F>
        extrinsic?: Extrinsic<F>
        getExtrinsic(): Extrinsic<F>
    }
>


export interface Block<F extends FieldSelection = {}> {
    header: BlockHeader<F>
    extrinsics: Extrinsic<F>[]
    calls: Call<F>[]
    events: Event<F>[]
}
