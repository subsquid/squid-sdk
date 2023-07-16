import * as base from '@subsquid/substrate-data'

export type Simplify<T> = {
    [K in keyof T]: T[K]
} & {}


export type BlockRequiredFields = 'height' | 'hash' | 'parentHash' | 'specName' | 'specVersion'
export type ExtrinsicRequiredFields = 'index'
export type CallRequiredFields = 'extrinsicIndex' | 'address'
export type EventRequiredFields = 'index' | 'extrinsicIndex' | 'callAddress'


type MakePartial<T, Required extends keyof T> = Simplify<
    Pick<T, Required> &
    {
        [K in keyof T as K extends Required ? never : K]+?: T[K]
    }
>


export type PartialBlockHeader = MakePartial<base.BlockHeader, BlockRequiredFields>
export type PartialExtrinsic = MakePartial<base.Extrinsic, ExtrinsicRequiredFields>
export type PartialCall = MakePartial<base.Call, CallRequiredFields>
export type PartialEvent = MakePartial<base.Event, EventRequiredFields>


export interface PartialBlock {
    header: PartialBlockHeader
    extrinsics?: PartialExtrinsic[]
    calls?: PartialCall[]
    events?: PartialEvent[]
}
