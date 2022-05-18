import type {Codec as ScaleCodec} from "@subsquid/scale-codec"
import type {
    ChainDescription,
    Extrinsic as _Extrinsic,
    ExtrinsicSignature as _ExtrinsicSignature,
    SpecVersion
} from "@subsquid/substrate-metadata"
import type * as eac from "@subsquid/substrate-metadata/lib/events-and-calls"


export interface Spec {
    specId: string
    rawMetadata: string
    description: ChainDescription
    scaleCodec: ScaleCodec
    events: eac.Registry
    calls: eac.Registry
}


export namespace sub {
    export interface BlockHeader {
        digest: {logs: string[]}
        extrinsicRoot: string
        number: string
        parentHash: string
        stateRoot: string
    }


    export interface Block {
        header: BlockHeader
        extrinsics: string[]
    }


    export interface SignedBlock {
        block: Block
    }


    export interface RuntimeVersion {
        specName: string
        specVersion: SpecVersion
    }


    export interface EventRecord {
        phase: EventRecordPhase
        event: Event
    }


    export type EventRecordPhase = {
        __kind: 'ApplyExtrinsic'
        value: number
    } | {
        __kind: 'Initialization'
    } | {
        __kind: 'Finalization'
    }


    export interface Event {
        __kind: string
        value: {__kind: string} & any
    }


    export type Extrinsic = _Extrinsic
    export type ExtrinsicSignature = _ExtrinsicSignature


    export interface Call {
        __kind: string
        value: {__kind: string} & any
    }
}
