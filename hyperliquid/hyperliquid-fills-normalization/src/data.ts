export type Bytes = string


export interface Fill {
    fillIndex: number
    user: Bytes
    coin: string
    px: number
    sz: number
    side: 'B' | 'A'
    time: number
    startPosition: number
    dir: string
    closedPnl: number
    hash: Bytes
    oid: number
    crossed: boolean
    fee: number
    builderFee?: number
    tid: number
    cloid?: Bytes
    feeToken: string
    builder?: Bytes
    twapId?: number
}


export interface BlockHeader {
    number: number
    hash: Bytes
    parentHash: Bytes
    timestamp: number
}


export interface Block {
    header: BlockHeader
    fills: Fill[]
}
