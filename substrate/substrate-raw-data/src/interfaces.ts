/**
 * Hex encoded binary data
 */
export type Bytes = string


/**
 * Hex encoded hash (typically 32 bytes)
 */
export type Hash = string


/**
 * Hex encoded integer value
 */
export type Qty = string


export interface BlockHeader {
    number: Qty
    parentHash: Hash
    stateRoot: Hash
    extrinsicsRoot: Hash
    digest: {logs: Bytes[]}
}


export interface Block {
    header: BlockHeader
    extrinsics: Bytes[]
}


export interface PartialBlock {
    header: BlockHeader
    extrinsics?: Bytes[]
}


/**
 * Result of `chain_getBlock`
 */
export interface GetBlockResult {
    block: Block
}


export interface PartialGetBlockResult {
    block: PartialBlock
}


export interface RuntimeVersionId {
    specName: string
    specVersion: number
    implName: string
    implVersion: number
}


export interface RuntimeVersion extends RuntimeVersionId {
    transactionVersion: number
    stateVersion: number
    apis: [apiId: string, apiVersion: number][]
}


export interface BlockData {
    hash: Hash
    height: number
    block: PartialGetBlockResult
    runtimeVersion?: RuntimeVersion
    metadata?: Bytes
    /**
     * Contents of `System.Events` storage
     */
    events?: Bytes
}


export interface BlockBatch {
    blocks: BlockData[]
    isHead: boolean
}


export interface DataRequest {
    extrinsics?: boolean
    events?: boolean
    traces?: boolean
    metadata?: boolean
    runtimeVersion?: boolean
}


export interface HashAndHeight {
    hash: Hash
    height: number
}
