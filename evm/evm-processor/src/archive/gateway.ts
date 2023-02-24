
export interface BatchRequest {
    fromBlock: number
    toBlock?: number
    includeAllBlocks: boolean
    logs: LogRequest[]
    transactions: TransactionRequest[]
}


export interface BatchResponse {
    data: BlockData[][]
    nextBlock: number
    archiveHeight: number
}


export interface LogRequest {
    address?: string[]
    topics: string[][]
    fieldSelection: FieldSelection
}


export interface TransactionRequest {
    to?: string[]
    from?: string[]
    sighash?: string[]
    fieldSelection: FieldSelection
}


export interface FieldSelection {
    block?: BlockFieldSelection | null
    transaction?: TransactionFieldSelection | null
    log?: LogFieldSelection | null
}


export type BlockFieldSelection = {[P in keyof Block]?: boolean}


export type LogFieldSelection = {[P in keyof Log]?: boolean}


export type TransactionFieldSelection = {[P in keyof Transaction]?: boolean}


export interface Block {
    number: number
    hash: string
    parentHash: string
    nonce?: string
    sha3Uncles: string
    logsBloom: string
    transactionsRoot: string
    stateRoot: string
    receiptsRoot: string
    miner: string
    difficulty?: string
    totalDifficulty?: string
    extraData: string
    size: string
    gasLimit: string
    gasUsed: string
    timestamp: string
    mixHash?: string
    baseFeePerGas?: string
}


export interface Transaction {
    from: string
    gas: string
    gasPrice?: string
    hash: string
    input: string
    nonce: string
    to?: string
    index: number
    value: bigint
    type: number
    chainId?: number
    v: string
    r: string
    s: string
    maxPriorityFeePerGas?: string
    maxFeePerGas?: string
    yParity?: number
}


export interface Log {
    address: string
    data: string
    index: number
    removed: boolean
    topics: string[]
    transactionIndex: number
    transactionHash: string
}


export interface BlockData {
    block: Block
    logs: Log[]
    transactions: Transaction[]
}
