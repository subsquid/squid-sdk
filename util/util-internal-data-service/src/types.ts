export interface BlockRef {
    number: number
    hash: string
}


export interface BlockHeader extends BlockRef {
    parentNumber: number
    parentHash: string
    timestamp?: number
}


export interface Block extends BlockHeader {
    jsonLineZstd: Uint8Array
}


export class InvalidBaseBlock {
    constructor(public readonly prev: BlockRef[]) {}
}


export interface DataResponse {
    finalizedHead?: BlockRef
    head?: AsyncIterable<Block[]>
    tail?: Block[]
    /**
     * Releases resources backing `head` (e.g. backfill worker threads).
     *
     * Must be called when the response processing ends, no matter how,
     * as `head` might never be iterated (hence never get a chance to clean up after itself).
     */
    close?: () => Promise<void>
}
