export interface BlockHeader_ {
    height: number
    hash: string
    parentHash: string
    timestamp: number
}


export interface Log_ {
    logIndex: number
    transactionIndex: number
    transactionHash: string
    address: string
    data: string
    topics: string[]
}


export interface Transaction_ {
    hash: string
    timestamp: number
}


export interface InternalTransaction_ {
    transactionHash: string
}
