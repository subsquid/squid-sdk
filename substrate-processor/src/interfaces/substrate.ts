import type {SpecVersion} from "@subsquid/substrate-metadata"


export type QualifiedName = string


export interface SubstrateRuntimeVersion {
    specName: string
    specVersion: SpecVersion
}


export interface SubstrateBlock extends SubstrateRuntimeVersion {
    /**
     * Unique block id, following the format <block height>-<first hex digits of the hash>
     */
    id: string
    /**
     * Block height
     */
    height: number
    /**
     * Current block hash
     */
    hash: string
    /**
     * Hash of the parent block
     */
    parentHash: string
    /**
     * Block timestamp as set by timestamp.now()
     */
    timestamp: number
}


interface EventBase {
    /**
     * Event id, in the form <blockNumber>-<index>
     */
    id: string
    /**
     * Event name
     */
    name: QualifiedName
    /**
     * Ordinal index in the event array of the current block
     */
    indexInBlock: number
    /**
     * JSON encoded event arguments
     */
    args: any
}


export interface SubstrateInitializationEvent extends EventBase {
    phase: 'Initialization'
    extrinsic?: undefined
    call?: undefined
}


export interface SubstrateApplyExtrinsicEvent extends EventBase {
    phase: 'ApplyExtrinsic'
    extrinsic: SubstrateExtrinsic
    call: SubstrateCall
}


export interface SubstrateFinalizationEvent extends EventBase {
    phase: 'Finalization'
    extrinsic?: undefined
    call?: undefined
}


export type SubstrateEvent =
    SubstrateInitializationEvent |
    SubstrateApplyExtrinsicEvent |
    SubstrateFinalizationEvent


export interface SubstrateExtrinsic {
    id: string
    version: number
    /**
     * Blake2b 128-bit hash of the raw extrinsic
     */
    hash: string
    /**
     * Ordinal index in the event array of the current block
     */
    indexInBlock: number
    call: SubstrateCall
    signature?: SubstrateExtrinsicSignature
    success: boolean
}


export interface SubstrateExtrinsicSignature {
    address: any
    signature: any
    signedExtensions: any
}


export interface SubstrateCall {
    id: string
    name: QualifiedName
    /**
     * JSON encoded call arguments
     */
    args: any
    success: boolean
    parent?: SubstrateCall
}
