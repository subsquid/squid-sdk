import type {Bytes, Hash} from '@subsquid/substrate-data-raw'
import {Runtime} from '@subsquid/substrate-runtime'


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
    args: unknown
    origin?: any
    /**
     * Call error.
     *
     * Absence of error doesn't imply that the call was executed successfully,
     * check {@link success} property for that.
     */
    error?: any
    success?: boolean
    _ethereumTransactTo?: Bytes
    _ethereumTransactSighash?: Bytes
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
    args: unknown
    phase: 'Initialization' | 'ApplyExtrinsic' | 'Finalization'
    extrinsicIndex?: number
    callAddress?: number[]
    _evmLogAddress?: Bytes
    _evmLogTopics?: Bytes[]
    _contractAddress?: Bytes
    _gearProgramId?: Bytes
}


export class Block {
    #runtime: Runtime
    #runtimeOfPrevBlock: Runtime

    header: BlockHeader
    extrinsics?: Extrinsic[]
    calls?: Call[]
    events?: Event[]

    constructor(
        runtime: Runtime,
        runtimeOfPrevBlock: Runtime,
        header: BlockHeader
    ) {
        this.#runtime = runtime
        this.#runtimeOfPrevBlock = runtimeOfPrevBlock
        this.header = header
    }

    get runtime(): Runtime {
        return this.#runtime
    }

    get runtimeOfPrevBlock(): Runtime {
        return this.#runtimeOfPrevBlock
    }
}


export interface DataRequest {
    blockValidator?: boolean
    blockTimestamp?: boolean
    events?: boolean
    calls?: boolean
    extrinsicHash?: boolean
    extrinsicFee?: boolean
}
