import {EvmTopicSet} from './dataHandlers'

export interface QueryResponse {
    data: BatchBlock[][]
    metrics: any
    nextBlock: number
    archiveHeight: number
}

export interface BatchRequest {
    fromBlock: number
    toBlock?: number
    logs: LogRequest[]
    transactions: TransactionRequest[]
    includeAllBlocks: boolean
}

export interface LogRequest {
    address: string[] | null
    topics: EvmTopicSet
    fieldSelection: FieldSelection
}

export interface TransactionRequest {
    address: string[] | null
    sighash?: string[]
    fieldSelection: FieldSelection
}

export interface FieldSelection {
    block?: BlockFieldSelection | null
    transaction?: TransactionFieldSelection | null
    log?: LogFieldSelection | null
}

export type BlockFieldSelection = {[P in keyof Block]?: true}

export type LogFieldSelection = {[P in keyof Log]?: true}

export type TransactionFieldSelection = {[P in keyof Transaction]?: true}

export interface Block {
    number: number
    hash?: string
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
    from?: string
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

export interface BatchBlock {
    block: Block
    logs: Log[]
    transactions: Transaction[]
}

export const FULL_SELECTION = {
    block: {
        number: true,
        hash: true,
        parentHash: true,
        nonce: true,
        sha3Uncles: true,
        logsBloom: true,
        transactionsRoot: true,
        stateRoot: true,
        receiptsRoot: true,
        miner: true,
        difficulty: true,
        totalDifficulty: true,
        extraData: true,
        size: true,
        gasLimit: true,
        gasUsed: true,
        timestamp: true,
        mixHash: true,
        baseFeePerGas: true,
    },
    log: {
        address: true,
        data: true,
        index: true,
        removed: true,
        topics: true,
        transactionIndex: true,
    },
    transaction: {
        from: true,
        gas: true,
        gasPrice: true,
        hash: true,
        input: true,
        nonce: true,
        to: true,
        index: true,
        value: true,
        kind: true,
        chainId: true,
        v: true,
        r: true,
        s: true,
        maxPriorityFeePerGas: true,
        maxFeePerGas: true,
        yParity: true,
    },
}
