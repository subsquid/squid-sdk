import {Bytes, Bytes8, Bytes20, Bytes32, Qty} from '@subsquid/evm-rpc'


export interface Withdrawal {
    address: Bytes20,
    amount: Qty,
    index: Qty,
    validatorIndex: Qty
}


export interface BlockHeader {
    number: number,
    hash: Bytes32,
    parentHash: Bytes32,
    timestamp: number,
    transactionsRoot: Bytes32,
    receiptsRoot: Bytes32,
    stateRoot: Bytes32,
    logsBloom: Bytes,
    sha3Uncles: Bytes32,
    extraData: Bytes,
    miner: Bytes20,
    nonce?: Bytes8,
    mixHash?: Bytes32,
    size: bigint,
    gasLimit: Qty,
    gasUsed: Qty,
    difficulty?: Qty,
    totalDifficulty?: Qty,
    baseFeePerGas?: Qty,
    uncles?: Bytes32[],
    withdrawals?: Withdrawal[],
    withdrawalsRoot?: Bytes32,
    blobGasUsed?: Qty,
    excessBlobGas?: Qty,
    parentBeaconBlockRoot?: Bytes32,
    requestsHash?: Bytes32,
    l1BlockNumber?: number
}


export interface Access {
    address: Bytes20,
    storageKeys: Bytes[]
}


export interface EIP7702Authorization {
    chainId: number,
    address: Bytes20,
    nonce: number,
    yParity: number,
    r: Bytes32,
    s: Bytes32
}


export interface Transaction {
    transactionIndex: number,
    hash: Bytes32,
    nonce: number,
    from: Bytes20,
    to?: Bytes20,
    input: Bytes,
    sighash?: Bytes,
    value: Qty,
    type: number,
    gas: Qty,
    gasPrice: Qty,
    maxFeePerGas?: Qty,
    maxPriorityFeePerGas?: Qty,
    v: Qty,
    r: Bytes32,
    s: Bytes32,
    yParity?: number,
    accessList?: Access[],
    chainId?: number,
    maxFeePerBlobGas?: Qty,
    blobVersionedHashes?: Bytes32[],
    authorizationList?: EIP7702Authorization[],
    // transaction receipt
    contractAddress?: Bytes20,
    cumulativeGasUsed?: Qty,
    effectiveGasPrice?: Qty,
    gasUsed?: Qty,
    status?: number,
    l1BaseFeeScalar?: number,
    l1BlobBaseFee?: Qty,
    l1BlobBaseFeeScalar?: number,
    l1Fee?: Qty,
    l1FeeScalar?: number,
    l1GasPrice?: Qty,
    l1GasUsed?: Qty
}


export interface Log {
    logIndex: number
    transactionIndex: number
    transactionHash: Bytes32
    address: Bytes20
    data: Bytes
    topics: Bytes32[]
}


export interface TraceActionCreate {
    from: Bytes20,
    value: Qty,
    gas: Qty,
    init: Bytes,
    creationMethod?: 'create' | 'create2'
}


export interface TraceResultCreate {
    gasUsed: Qty,
    code: Bytes,
    address: Bytes20
}


export interface TraceActionCall {
    from: Bytes20,
    to: Bytes20,
    value: Qty,
    gas: Qty,
    input: Bytes,
    sighash?: Bytes,
    callType: 'call' | 'callcode' | 'delegatecall' | 'staticcall'
}


export interface TraceResultCall {
    gasUsed: Qty,
    output: Bytes
}


export interface TraceActionReward {
    author: Bytes20,
    value: Qty,
    rewardType: 'block' | 'uncle' | 'emptyStep' | 'external'
}


export interface TraceActionSelfdestruct {
    address: Bytes20
    refundAddress: Bytes20
    balance: Qty
}


export interface Trace {
    transactionIndex: number,
    traceAddress: number[],
    type: 'create' | 'call' | 'reward' | 'selfdestruct',
    subtraces: number,
    error?: string,
    revertReason?: string,
    action: TraceActionCreate | TraceActionCall | TraceActionReward | TraceActionSelfdestruct,
    result?: TraceResultCreate | TraceResultCall
}


export interface StateDiff {
    transactionIndex: number,
    address: Bytes20,
    key: 'balance' | 'code' | 'nonce' | Bytes,
    kind: '=' | '+' | '-' | '*',
    prev?: Bytes,
    next?: Bytes
}


export interface Block {
    header: BlockHeader,
    transactions: Transaction[],
    logs: Log[],
    traces: Trace[],
    stateDiffs: StateDiff[]
}
