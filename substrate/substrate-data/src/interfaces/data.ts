import type {Bytes, Hash} from '@subsquid/substrate-data-raw'
import type {Runtime} from '../runtime'


export {Bytes, Hash}


export type QualifiedName = string


export interface BlockHeader {
    /**
     * Block height
     */
    height: number
    /**
     * Block hash
     */
    hash: Hash
    /**
     * Hash of the parent block
     */
    parentHash: Hash
    /**
     * Root hash of the state merkle tree
     */
    stateRoot: Hash
    /**
     * Root hash of the extrinsics merkle tree
     */
    extrinsicsRoot: Hash
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


export interface Extrinsic {
    /**
     * Ordinal index in the extrinsics array of the current block
     */
    index: number
    version: number
    signature?: ExtrinsicSignature
    fee?: bigint
    tip?: bigint
    error?: any
    success?: boolean
    /**
     * Blake2b 128-bit hash of the raw extrinsic
     */
    hash?: string
}


export interface ExtrinsicSignature {
    address: any
    signature: any
    signedExtensions: any
}


export interface Call {
    extrinsicIndex: number
    address: number[]
    name: QualifiedName
    /**
     * JSON encoded call arguments
     */
    args: any
    origin?: any
    /**
     * Call error.
     *
     * Absence of error doesn't imply that the call was executed successfully,
     * check {@link success} property for that.
     */
    error?: any
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
    /**
     * JSON encoded event arguments
     */
    args: any
    phase: 'Initialization' | 'ApplyExtrinsic' | 'Finalization'
    extrinsicIndex?: number
    callAddress?: number[]
}


export interface Block {
    header: BlockHeader
    extrinsics?: Extrinsic[]
    calls?: Call[]
    events?: Event[]
}


export interface DataRequest {
    blockValidator?: boolean
    blockTimestamp?: boolean
    events?: boolean
    calls?: boolean
    extrinsicHash?: boolean
    extrinsicFee?: boolean
}


export interface WithRuntime {
    runtime: Runtime
    prevRuntime: Runtime
}
