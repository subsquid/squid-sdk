import type {PortalStreamHeaders} from './portal-api'


export interface QueryBase {
    fromBlock: number
    toBlock?: number
    parentBlockHash?: string
    includeAllBlocks?: boolean
}


export interface BlockRef {
    number: number
    hash: string
}


export interface BlockHeader extends BlockRef {
    parentHash: string
    parentNumber?: number
}


export interface BlockBase {
    header: BlockHeader
}


export interface DataBatch<B extends BlockBase = BlockBase> extends PortalStreamHeaders {
    blocks: B[]
    byteSize: number
    itemSize: number
    startStream: number
    endStream: number
    startTime: number
    endTime: number
    firstByteTime: number
}


/**
 * Hex binary string
 */
export type Bytes = string & {}


/**
 * 32 bytes as a hex string
 */
export type Bytes32 = string & {}


/**
 * 20 bytes as a hex string
 */
export type Bytes20 = string & {}


/**
 * 8 bytes as a hex string
 */
export type Bytes8 = string & {}


/**
 * Base58 encoded byte string
 */
export type Base58Bytes = string & {}
