export type Bytes = string
export type Bytes32 = string
export type EvmAddress = string


export interface EvmBlock {
    id: string
    height: number
    hash: Bytes32
    parentHash: Bytes32
    nonce?: bigint
    sha3Uncles: Bytes32
    logsBloom: Bytes
    transactionsRoot: Bytes32
    stateRoot: Bytes32
    receiptsRoot: Bytes32
    miner: EvmAddress
    difficulty?: bigint
    totalDifficulty?: bigint
    extraData: Bytes
    size: bigint
    gasLimit: bigint
    gasUsed: bigint
    timestamp: number
    mixHash?: Bytes32
    baseFeePerGas?: bigint
}


export interface EvmTransaction {
    id: string
    from: EvmAddress
    gas: bigint
    gasPrice?: bigint
    hash: Bytes32
    input: Bytes
    nonce: bigint
    to?: EvmAddress
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
    index: number
    transactionIndex: number
    transactionHash: string
    address: EvmAddress
    topics: Bytes32[]
    data: Bytes
}
