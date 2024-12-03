export interface BlockRef {
    number: number
    hash: string
}


export interface BlockHeader extends BlockRef {
    parentNumber: number
    parentHash: string
    timestamp?: number
    isFinal?: boolean
}


export interface Block extends BlockHeader {
    jsonLine: string
    jsonLineByteLength: number
}

