import type * as base from '@subsquid/substrate-data'


type Simplify<T> = {
    [K in keyof T]: T[K]
} & {}


type Selector<Props extends string, Exclusion extends string = ''> = {
    [P in Exclude<Props, Exclusion>]?: boolean
}


type BlockRequiredFields = 'height' | 'hash' | 'parentHash' | 'specId'
type ExtrinsicRequiredFields = 'index'
type CallRequiredFields = 'extrinsicIndex' | 'address'
type EventRequiredFields = 'index' | 'extrinsicIndex' | 'callAddress'


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
        args: true,
        callAddress: true
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
    Select<base.BlockHeader, GetFields<F, 'block'>>
>


interface FullExtrinsic extends base.Extrinsic {
    success: boolean
    hash: string
}


export type Extrinsic<F extends FieldSelection = {}> = Simplify<
    {id: string} &
    Pick<FullExtrinsic, ExtrinsicRequiredFields> &
    Select<FullExtrinsic, GetFields<F, 'extrinsic'>>
>


interface FullCall extends base.Call {
    success: boolean
}


export type Call<F extends FieldSelection = {}> = Simplify<
    {id: string} &
    Pick<FullCall, CallRequiredFields> &
    Select<FullCall, GetFields<F, 'call'>>
>


interface ApplyExtrinsicEvent extends base.Event {
    phase: 'ApplyExtrinsic'
    extrinsicIndex: number
    callAddress: number[]
}


interface NonExtrinsicEvent extends base.Event {
    phase: 'Initialization' | 'Finalization'
    extrinsicIndex?: undefined
    callAddress?: undefined
}


type BaseEvent = ApplyExtrinsicEvent | NonExtrinsicEvent


export type Event<F extends FieldSelection = {}> = Simplify<
    {id: string} &
    Pick<BaseEvent, EventRequiredFields> &
    Select<BaseEvent, GetFields<F, 'event'>>
>


export interface BlockData<F extends FieldSelection = {}> {
    header: BlockHeader<F>
    extrinsics: Extrinsic<F>[]
    calls: Call<F>[]
    events: Event<F>[]
}


type MakePartial<T, Required extends keyof T> = Simplify<
    {id: string} &
    Pick<T, Required> &
    {
        [K in keyof T as K extends Required ? never : K]+?: T[K]
    }
>


export type PartialBlockHeader = MakePartial<base.BlockHeader, BlockRequiredFields>
export type PartialExtrinsic = MakePartial<base.Extrinsic, ExtrinsicRequiredFields>
export type PartialCall = MakePartial<base.Call, CallRequiredFields>
export type PartialEvent = MakePartial<base.Event, EventRequiredFields>


export interface PartialBlockData {
    header: PartialBlockHeader
    extrinsics: PartialExtrinsic[]
    calls: PartialCall[]
    events: PartialEvent[]
}
