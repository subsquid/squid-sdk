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
    jsonLineGzip: Uint8Array
}


export class InvalidBaseBlock {
    constructor(public readonly prev: BlockRef[]) {}
}


export interface DataResponse {
    finalizedHead?: BlockRef
    head?: AsyncIterable<Block>
    tail?: Block[]
}
