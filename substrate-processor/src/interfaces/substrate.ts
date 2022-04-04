export type QualifiedName = string


/**
 * Runtime spec id formatted as `<spec_name>@<spec_version>`
 */
export type SpecId = string


export interface SubstrateBlock {
    /**
     * Unique block id, following the format `<block height>-<first hex digits of the hash>`
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
     * Block timestamp as set by `timestamp.now()`
     */
    timestamp: number
    /**
     * Runtime spec id formatted as `{spec_name}@{spec_version}`
     */
    specId: SpecId
    /**
     * Account address of block validator
     */
    validator?: string
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
    /**
     * Event position in a joint list of events, calls and extrinsics,
     * which determines data handlers execution order.
     */
    pos: number
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
     * Ordinal index in the extrinsics array of the current block
     */
    indexInBlock: number
    call: SubstrateCall
    signature?: SubstrateExtrinsicSignature
    success: boolean
    /**
     * Extrinsic position in a joint list of events, calls and extrinsics,
     * which determines data handlers execution order.
     */
    pos: number
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
    /**
     * Call position in a joint list of events, calls and extrinsics,
     * which determines data handlers execution order.
     */
    pos: number
}
