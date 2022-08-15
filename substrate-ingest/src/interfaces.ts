import type {Codec as ScaleCodec} from "@subsquid/scale-codec"
import type {
    ChainDescription,
    Extrinsic as _Extrinsic,
    ExtrinsicSignature as _ExtrinsicSignature
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
        number: string
        parentHash: string
        stateRoot: string
        extrinsicsRoot: string
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
        specVersion: number
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


    export interface DispatchInfo {
        weight: bigint
        class: {
            __kind: 'Normal' | 'Operational' | 'Mandatory'
        }
        paysFee: boolean | {
            __kind: 'Yes' | 'No'
        }
    }


    export type DigestItem = DigestItem_PreRuntime | DigestItem_Consensus | DigestItem_Seal | DigestItem_Other | DigestItem_RuntimeEnvironmentUpdated


    export interface DigestItem_PreRuntime {
        __kind: 'PreRuntime'
        value: [Uint8Array, Uint8Array]
    }


    export interface DigestItem_Consensus {
        __kind: 'Consensus'
        value: [Uint8Array, Uint8Array]
    }


    export interface DigestItem_Seal {
        __kind: 'Seal'
        value: [Uint8Array, Uint8Array]
    }


    export interface DigestItem_Other {
        __kind: 'Other'
        value: Uint8Array
    }


    export interface DigestItem_RuntimeEnvironmentUpdated {
        __kind: 'RuntimeEnvironmentUpdated'
    }


    export interface SignedOrigin {
        __kind: 'system'
        value: {
            __kind: 'Signed'
            value: Uint8Array
        }
    }

    export interface RootOrigin {
        __kind: 'system'
        value: {
            __kind: 'Root'
        }
    }


    export interface NoneOrigin {
        __kind: 'system'
        value: {
            __kind: 'None'
        }
    }
}
