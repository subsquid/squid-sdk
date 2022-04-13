import type {SpecVersion} from "@subsquid/substrate-metadata"

/**
 * Defines the version of a blockchain's Runtime
 * 
 * @property specName: string, defining the name of a Runtime spec
 * @property specVersion: a {@link SpecVersion}, defining the version number of a Runtime spec
 */
export interface SubstrateRuntimeVersion {
    specName: string
    specVersion: SpecVersion
}

/**
 * Represents a block of a Substrate blockchain, with essential metadata.
 * 
 * @property id: Unique block id, following the format <block height>-<first hex digits of the hash>
 * @property hash: Current block hash
 * @property height: Block heigh
 * @property timestamp: Block timestamp as set by timestamp.now()
 * @property parentHash: Hash of the parent block
 * @property stateRoot: State Merkle root
 * @property extrinsicsRoot: Extrinsic Merkle root
 * @property runtimeVersion: Substrate runtime version {@link SubstrateRuntimeVersion}
 * @property lastRuntimeUpgrade: Raw JSON with last runtime upgrade information
 * @property events: An array with basic event information {@link EventInfo}
 * @property extrinsics: An array with basic extrinsic information {@link ExtrinsicInfo}
 */
export interface SubstrateBlock {
    /**
     * Unique block id, following the format <block height>-<first hex digits of the hash>
     */
    id: string

    /**
     * Current block hash
     */
    hash: string

    /**
     * Block height
     */
    height: number

    /**
     * Block timestamp as set by timestamp.now()
     */
    timestamp: number

    /**
     * Hash of the parent block
     */
    parentHash: string

    /**
     * State Merkle root
     */
    stateRoot: string

    /**
     * Extrinsics Merkle root
     */
    extrinsicsRoot: string

    /**
     * Substrate runtime version
     */
    runtimeVersion: SubstrateRuntimeVersion

    /**
     * Raw JSON with last runtime upgrade information
     */
    lastRuntimeUpgrade: unknown

    /**
     * An array with basic event information
     */
    events: EventInfo[]

    /**
     * An array with basic extrinsic information
     */
    extrinsics: ExtrinsicInfo[]
}


export type QualifiedName = string

/**
 * Basic event information
 * 
 * @property id: Event id
 * @property name: Event name
 * @property extrinsic: name of the extrinsic that triggered the event 
 * @property extrinsicId: id of the extrinsic that triggered the event
 */
export interface EventInfo {
    id: string
    name: QualifiedName
    extrinsic: QualifiedName
    extrinsicId: string
}

/**
 * Basic extrinsic information
 * 
 * @property id: Extrinsic id
 * @property name: Extrinsic id
 */
export interface ExtrinsicInfo {
    id: string
    name: QualifiedName
}

/**
 * Represents an event of a Substrate blockchain, with essential metadata.
 * 
 * @property id: Event id, in the form <blockNumber>-<index>
 * @property name: Event name, in the form section.method
 * @property method: Event method (as defined in the runtime metadata)
 * @property section: Event section
 * @property params: Array of raw JSON object with event parameters
 * @property indexInBlock: Ordinal index in the event array of the current block
 * @property blockNumber: Block height it appeared in
 * @property extrinsic: If it was emitted in the ApplyExtrinsic phase, the underlying extrinsic information
 * @property blockTimestamp: Timestamp of the block, as set by call timestamp.now()
 */
export interface SubstrateEvent {
    /**
     * Event id, in the form <blockNumber>-<index>
     */
    id: string
    /**
     * Event name, in the form section.method
     */
    name: QualifiedName
    /**
     * Event method (as defined in the runtime metadata)
     */
    method: string
    /**
     * Event section
     */
    section?: string
    /**
     * Array of raw JSON object with event parameters
     */
    params: EventParam[]
    /**
     * Ordinal index in the event array of the current block
     */
    indexInBlock: number
    /**
     * Block height it appeared in
     */
    blockNumber: number
    /**
     * If it was emitted in the ApplyExtrinsic phase, the underlying extrinsic information
     */
    extrinsic?: SubstrateExtrinsic
    /**
     * Timestamp of the block, as set by call timestamp.now()
     */
    blockTimestamp: number

}

/**
 * Represents an Extrinsic of a Substrate blockchain, with essential metadata.
 * 
 * @property id: Extrinsic id, in the form <blockNumber>-<index>
 * @property name: Extrinsic name, in the form (`${section}.${method}`)
 * @property method: Extrinsic method (as defined in the runtime metadata)
 * @property section: Extrinsic section
 * @property versionInfo: extrinsic version information (optional)
 * @property era: Raw JSON with extrinsic era (optional)
 * @property signer: Hex string representing the extrinsic signer
 * @property signature: Hex string with the signature (optional)
 * @property args: An array of raw JSON with extrinsic arguments
 * @property hash: Hex string of the extrinsic hash
 * @property tip: Extrinsic tip
 * @property indexInBlock: Ordinal index in the event array of the current block
 */
export interface SubstrateExtrinsic {
    /**
     * extrinsic id
     */
    id: string
    /**
     * extrinsic name (`${section}.${method}`)
     */
    name: QualifiedName
    /**
     * extrinsic method
     */
    method: string
    /**
     * extrinsic section
     */
    section: string
    /**
     * extrinsic version information
     */
    versionInfo?: string
    /**
     * Raw JSON with extrinsic era
     */
    era?: unknown
    /**
     * Hex string representing the extrinsic signer
     */
    signer: string
    /**
     * Hex string with the signature
     */
    signature?: string
    /**
     * An array of raw JSON with extrinsic arguments
     */
    args: ExtrinsicArg[]
    /**
     * Hex string of the extrinsic hash
     */
    hash?: string
    /**
     * Extrinsic tip
     */
    tip: bigint
    /**
     * Ordinal index in the event array of the current block
     */
    indexInBlock: number
}

/**
 * Defines event parameters
 * 
 * @property type
 * @property name
 * @property value
 */
export interface EventParam {
    type: string
    name: string
    value: unknown
}

/**
 * Defines extrinsic arguments
 * 
 * @property type
 * @property name
 * @property value
 */
export interface ExtrinsicArg {
    type: string
    name: string
    value: unknown
}
