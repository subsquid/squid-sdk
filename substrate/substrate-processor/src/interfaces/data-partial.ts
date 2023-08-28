import * as base from '@subsquid/substrate-data'


export type Simplify<T> = {
    [K in keyof T]: T[K]
} & {}


export type BlockRequiredFields =
    'height' | 'hash' | 'parentHash' |
    'specName' | 'specVersion' |
    'implName' | 'implVersion'


export type ExtrinsicRequiredFields = 'index'
export type CallRequiredFields = 'extrinsicIndex' | 'address'
export type EventRequiredFields = 'index' | 'extrinsicIndex' | 'callAddress'


type MakePartial<T, Required extends keyof T, IsArchive extends boolean = false> = Simplify<
    Pick<T, Required> &
    {
        [K in keyof T as K extends Required ? never : K]+?:
            IsArchive extends true
                ? bigint extends T[K] ? string : T[K]
                : T[K]
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


export type ArchiveBlockHeader = MakePartial<
    Omit<base.BlockHeader, 'height'>,
    Exclude<BlockRequiredFields, 'height'>, true
> & base.WithRuntime & {number: number}

export type ArchiveExtrinsic = MakePartial<base.Extrinsic, ExtrinsicRequiredFields, true>
export type ArchivePartialCall = MakePartial<base.Call, CallRequiredFields, true>
export type ArchiveEvent = MakePartial<base.Event, EventRequiredFields, true>


export interface ArchiveBlock {
    header: ArchiveBlockHeader
    extrinsics?: ArchiveExtrinsic[]
    calls?: ArchivePartialCall[]
    events?: ArchiveEvent[]
}
