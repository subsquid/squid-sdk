export type Bytes = string
export type Bytes4 = string
export type Bytes8 = string
export type Bytes32 = string
export type Address20 = string
export type Hash32 = string
export type HexNumber = string


export interface Block {
    header: BlockHeader
    transactions: Tx[]
    logs: Log[]
    last?: boolean
}


export interface BlockHeader {
    number: number
    hash: Hash32
    parentHash: Hash32
    nonce: Bytes8
    sha3Uncles: Hash32
    logsBloom: Bytes
    transactionsRoot: Hash32
    stateRoot: Hash32
    receiptsRoot: Hash32
    miner: Address20
    gasUsed: bigint
    gasLimit: bigint
    size: number
    timestamp: number
    extraData: Bytes
}


export interface Tx {
    blockNumber: number
    transactionIndex: number
    hash: Hash32
    gas: bigint
    gasPrice: bigint
    from: Address20
    to: Address20 | null
    sighash?: Bytes4
    input: Bytes
    nonce: bigint
    value: bigint
    v: bigint
    r: bigint
    s: bigint
}


export interface Log {
    blockNumber: number
    logIndex: number
    transactionIndex: number
    address: Address20
    data: Bytes
    topic0?: Bytes32
    topic1?: Bytes32
    topic2?: Bytes32
    topic3?: Bytes32
}


export namespace rpc {
    export interface Block {
        number: HexNumber
        hash: Hash32
        parentHash: Hash32
        nonce: Bytes8
        sha3Uncles: Hash32
        logsBloom: Bytes
        transactionsRoot: Hash32
        stateRoot: Hash32
        receiptsRoot: Hash32
        miner: Address20
        gasUsed: HexNumber
        gasLimit: HexNumber
        size: HexNumber
        timestamp: HexNumber
        extraData: Bytes
        transactions: Tx[]
    }

    export interface Tx {
        blockHash: Hash32
        blockNumber: HexNumber
        transactionIndex: HexNumber
        hash: Hash32
        gas: HexNumber
        gasPrice: HexNumber
        from: Address20
        to: Address20 | null
        input: Bytes
        nonce: HexNumber
        value: HexNumber
        v: HexNumber
        r: HexNumber
        s: HexNumber
    }

    export interface Log {
        blockHash: Hash32
        blockNumber: HexNumber
        logIndex: HexNumber
        transactionIndex: HexNumber
        transactionHash: Hash32
        address: Address20
        data: Bytes
        topics: Bytes32[]
    }
}
