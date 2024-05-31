import type {Hash} from '@subsquid/substrate-data-raw'
import type {Bytes, Runtime, QualifiedName} from '@subsquid/substrate-runtime'
import type {IOrigin} from '../types/system'


export {Bytes, Hash, QualifiedName}


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
    validator?: Hash
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


export interface ExtrinsicSignature {
    address: unknown
    signature: unknown
    signedExtensions: unknown
}


export interface Call {
    extrinsicIndex: number
    address: number[]
    name: QualifiedName
    args: unknown
    origin?: IOrigin
    /**
     * Call error.
     *
     * Absence of error doesn't imply that the call was executed successfully,
     * check {@link success} property for that.
     */
    error?: unknown
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
    args: unknown
    phase: 'Initialization' | 'ApplyExtrinsic' | 'Finalization'
    extrinsicIndex?: number
    callAddress?: number[]
    /**
     * This field is not supported by all currently deployed archives.
     * Requesting it may cause internal error.
     */
    topics: Bytes[]
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
    extrinsics?: {
        hash?: boolean
        fee?: boolean
    }
}
