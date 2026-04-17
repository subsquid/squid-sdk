import type {Bytes} from '../common/data'

/**
 * @example 'Balances.Transfer'
 */
export type QualifiedName = string & {}

export interface BlockHeader {
    /**
     * Block number (height)
     */
    number: number
    /**
     * Block hash
     */
    hash: Bytes
    /**
     * Hash of the parent block
     */
    parentHash: Bytes
    /**
     * Root hash of the state merkle tree
     */
    stateRoot: Bytes
    /**
     * Root hash of the extrinsics merkle tree
     */
    extrinsicsRoot: Bytes
    digest: {logs: Bytes[]}
    specName: string
    specVersion: number
    implName: string
    implVersion: number
    /**
     * Block timestamp as set by `timestamp.now()` (unix epoch ms, compatible with `Date`).
     */
    timestamp?: number
    /**
     * Account address of block validator
     */
    validator?: Bytes
}

export interface ExtrinsicSignature {
    address: Bytes
    signature: unknown
    signedExtensions: unknown
}

export interface Extrinsic {
    /**
     * Ordinal index in the extrinsics array of the current block
     */
    index: number
    version: number
    signature?: ExtrinsicSignature
    fee?: bigint
    tip?: bigint
    error?: unknown
    success?: boolean
    /**
     * Blake2b 128-bit hash of the raw extrinsic
     */
    hash?: Bytes
}

export interface Call {
    extrinsicIndex: number
    address: number[]
    name: QualifiedName
    args: unknown
    origin?: unknown
    /**
     * Call error.
     *
     * Absence of error doesn't imply that the call was executed successfully,
     * check {@link success} property for that.
     */
    error?: unknown
    success?: boolean
}

export interface Event {
    /**
     * Ordinal index in the event array of the current block
     */
    index: number
    /**
     * Event name
     */
    name: QualifiedName
    args: unknown
    phase: 'Initialization' | 'ApplyExtrinsic' | 'Finalization'
    extrinsicIndex?: number
    callAddress?: number[]
    /**
     * This field is not supported by all currently deployed archives.
     * Requesting it may cause internal error.
     */
    topics: Bytes[]
}
