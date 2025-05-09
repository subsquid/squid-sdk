export type Base58Bytes = string
export type Qty = number
export type Hash32 = string
export type Bytes = string
export type Bytes8 = string
export type Bytes32 = string
export type Address20 = string

export interface BlockHeader {
    number: Qty,
    hash: Hash32,
    parentHash: Hash32,
    timestamp: Qty,
    transactionsRoot: Hash32,
    receiptsRoot: Hash32,
    stateRoot: Hash32,
    logsBloom: Bytes,
    sha3Uncles: Hash32,
    extraData: Bytes,
    miner: Address20,
    nonce: Bytes8 | null,
    mixHash: Bytes | null,
    size: Qty,
    gasLimit: Bytes,
    gasUsed: Bytes,
    difficulty: Bytes | null,
    totalDifficulty: Bytes | null,
    baseFeePerGas: Bytes | null,
    // withdrawalsRoot: Bytes | null,
    blobGasUsed: Bytes | null,
    excessBlobGas: Bytes | null,
    // parentBeaconBlockRoot: Bytes | null,
    l1BlockNumber: Qty | null,
}

export interface Access {
    address: Address20,
    storageKeys: Bytes[]
}

export interface EIP7702Authorization {
    chainId: Qty,
    address: Address20,
    nonce: Qty,
    yParity: Qty,
    r: Bytes32,
    s: Bytes32,
}

export interface Transaction {
    transactionIndex: Qty,
    hash: Hash32,
    nonce: Qty,
    from: Address20,
    to: Address20 | null | undefined,
    input: Bytes,
    value: Bytes,
    type: Qty | null,
    gas: Bytes,
    gasPrice: Bytes | null,
    maxFeePerGas: Bytes | null,
    maxPriorityFeePerGas: Bytes | null,
    v: Bytes | null,
    r: Bytes32 | null,
    s: Bytes32 | null,
    yParity: Qty | null,
    // accessList: Access[] | undefined,
    chainId: Qty | null,
    maxFeePerBlobGas: Bytes | null,
    blobVersionedHashes: Hash32[] | null,
    authorizationList: EIP7702Authorization[] | undefined,

    contractAddress: Bytes | null,
    cumulativeGasUsed: Bytes,
    effectiveGasPrice: Bytes,
    gasUsed: Bytes,
    sighash: Bytes | null,
    status: 0 | 1 | null,

    l1BaseFeeScalar: Qty | null,
    l1BlobBaseFee: Bytes | null,
    l1BlobBaseFeeScalar: Qty | null,
    l1Fee: Bytes | null,
    l1FeeScalar: Qty | null,
    l1GasPrice: Bytes | null,
    l1GasUsed: Bytes | null,

}

export interface Log {
    logIndex: Qty
    transactionIndex: Qty
    transactionHash: Hash32
    address: Address20
    data: Bytes
    topics: Bytes32[]
}

export interface TraceActionCreate {
    from: Address20,
    value: Bytes | null,
    gas: Bytes,
    init: Bytes,
    creation_method: 'create' | 'create2' | undefined
}

export interface TraceActionCall {
    from: Address20,
    to: Address20,
    value: Bytes | null,
    gas: Bytes,
    input: Bytes,
    callType: 'call' | 'callcode' | 'delegatecall' | 'staticcall',
    sighash: Bytes | null,
    type: 'call' | 'callcode' | 'delegatecall' | 'staticcall',
}

export interface TraceActionReward {
    author: Address20,
    value: Qty,
    rewardType: 'block' | 'uncle' | 'emptyStep' | 'external'
}

export interface TraceActionSelfdestruct {
    address: Address20
    refundAddress: Address20
    balance: Qty
}

export interface TraceResultCreate {
    gasUsed: Bytes,
    code: Bytes,
    address: Address20
}

export interface TraceResultCall {
    gasUsed: Bytes,
    output: Bytes | null
}

export interface Trace {
    transactionIndex: Qty,
    traceAddress: Qty[],
    type: "create" | "call" | "reward" | "selfdestruct",
    subtraces: Qty,
    error: string | null,
    revertReason: string | null,
    action: TraceActionCreate | TraceActionCall | TraceActionReward | TraceActionSelfdestruct,
    result: TraceResultCreate | TraceResultCall | undefined
}

export interface StateDiff {
    transactionIndex: Qty,
    address: Address20,
    key: "balance" | "code" | "nonce" | Bytes,
    kind: "=" | "+" | "-" | "*",
    prev: Bytes | null,
    next: Bytes | null
}

export interface Block {
    header: BlockHeader,
    transactions: Transaction[],
    logs: Log[] | undefined,
    traces: Trace[] | undefined,
    stateDiffs: StateDiff[] | undefined
}
