import type {Codec as ScaleCodec} from "@subsquid/scale-codec"
import type {
    ChainDescription,
    Extrinsic as _Extrinsic,
    ExtrinsicSignature as _ExtrinsicSignature,
    SpecVersion
} from "@subsquid/substrate-metadata"
import type * as eac from "@subsquid/substrate-metadata/lib/events-and-calls"


export interface SpecInfo {
    specVersion: SpecVersion
    description: ChainDescription
    rawMetadata: string
    scaleCodec: ScaleCodec
    events: eac.Registry
    calls: eac.Registry
}


export namespace sub {
    export type EventRecordPhase = {
        __kind: 'ApplyExtrinsic'
        value: number
    } | {
        __kind: 'Initialization'
    } | {
        __kind: 'Finalization'
    }


    export interface EventRecord {
        phase: EventRecordPhase
        event: {__kind: string, value: {__kind: string} & any}
    }


    export interface BlockHeader {
        parentHash: string
    }


    export interface Block {
        header: BlockHeader
        extrinsics: string[]
    }


    export interface SignedBlock {
        block: Block
    }


    export interface RuntimeVersion {
        specVersion: SpecVersion
    }


    export type Extrinsic = _Extrinsic
    export type ExtrinsicSignature = _ExtrinsicSignature


    export interface Call {
        __kind: string
        value: {__kind: string} & any
    }
}








