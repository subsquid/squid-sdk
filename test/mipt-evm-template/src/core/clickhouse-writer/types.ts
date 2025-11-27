

export interface BlockHeader {
    number: number
    hash: string
    parentHash: string
    parentNumber?: number
    timestamp?: number
}


export interface Block {
    header: BlockHeader
    tables: Record<string, object[]>
}
