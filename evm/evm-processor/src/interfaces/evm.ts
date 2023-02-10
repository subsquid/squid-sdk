export interface EvmBlock {
    id: string
    height: number
    hash: string
    parentHash: string
    nonce?: bigint
    sha3Uncles: string
    logsBloom: string
    transactionsRoot: string
    stateRoot: string
    receiptsRoot: string
    miner: string
    difficulty?: string
    totalDifficulty?: string
    extraData: string
    size: bigint
    gasLimit: bigint
    gasUsed: bigint
    timestamp: number
    mixHash?: string
    baseFeePerGas?: bigint
}

export interface EvmTransaction {
    id: string
    from?: string
    gas: bigint
    gasPrice?: bigint
    hash: string
    input: string
    nonce: bigint
    to?: string
    index: number
    value: bigint
    type: number
    chainId?: number
    v: bigint
    r: string
    s: string
    maxPriorityFeePerGas?: bigint
    maxFeePerGas?: bigint
    yParity?: number
    status?: number
}

export interface EvmLog {
    id: string
    address: string
    data: string
    index: number
    removed?: boolean
    topics: string[]
    transactionIndex: number
}
