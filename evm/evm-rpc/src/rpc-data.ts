import {
    ANY,
    ANY_NAT,
    array,
    B58,
    B64,
    BIG_NAT,
    BOOLEAN,
    BYTES,
    constant,
    GetSrcType,
    INT,
    NAT,
    nullable,
    object,
    oneOf,
    option,
    record,
    STRING,
    tuple
} from '@subsquid/util-internal-validation'


export const Access = object({
    address: BYTES,
    storageKeys: array(BYTES)
})


export type Access = GetSrcType<typeof Access>


export const EIP7702Authorization = object({
    chainId: BYTES,
    address: BYTES,
    nonce: BYTES,
    yParity: BYTES,
    r: BYTES,
    s: BYTES,
})


export type EIP7702Authorization = GetSrcType<typeof EIP7702Authorization>


export const Transaction = object({
    accessList: option(array(Access)),
    blockHash: BYTES,
    blockNumber: BYTES,
    chainId: option(BYTES),
    from: BYTES,
    gas: BYTES,
    gasPrice: BYTES,
    hash: BYTES,
    input: BYTES,
    maxFeePerGas: option(BYTES),
    maxPriorityFeePerGas: option(BYTES),
    nonce: BYTES,
    r: BYTES,
    s: BYTES,
    to: nullable(BYTES),
    transactionIndex: BYTES,
    type: BYTES,
    v: BYTES,
    value: BYTES,
    yParity: option(BYTES),

    maxFeePerBlobGas: option(BYTES),
    blobVersionedHashes: option(array(BYTES)),
    authorizationList: option(array(EIP7702Authorization)),
})


export type Transaction = GetSrcType<typeof Transaction>


export const Withdrawal = object(
    {
        address: BYTES,
        amount: BYTES,
        index: BYTES,
        validatorIndex: BYTES,
    }
)


export type Withdrawal = GetSrcType<typeof Withdrawal>


export const Log = object({
    address: BYTES,
    topics: array(BYTES),
    data: BYTES,
    blockNumber: BYTES,
    transactionHash: BYTES,
    transactionIndex: BYTES,
    blockHash: BYTES,
    logIndex: BYTES,
    removed: BOOLEAN
})


export type Log = GetSrcType<typeof Log>


export const Receipt = object({
    blockHash: BYTES,
    blockNumber: BYTES,
    contractAddress: nullable(BYTES),
    cumulativeGasUsed: BYTES,
    from: BYTES,
    gasUsed: BYTES,
    effectiveGasPrice: BYTES,
    logs: array(Log),
    logsBloom: BYTES,
    status: BYTES,
    to: nullable(BYTES),
    transactionHash: BYTES,
    transactionIndex: BYTES,
    type: BYTES,


    l1BaseFeeScalar: option(BYTES),
    l1BlobBaseFee: option(BYTES),
    l1BlobBaseFeeScalar: option(BYTES),
    l1Fee: option(BYTES),
    l1FeeScalar: option(BYTES),
    l1GasPrice: option(BYTES),
    l1GasUsed: option(BYTES),
})


export type Receipt = GetSrcType<typeof Receipt>


export const TraceActionCreate = object({
    from: BYTES,
    value: BYTES,
    gas: BYTES,
    init: BYTES,
    creation_method: option(oneOf({
        create: constant("create"),
        create2: constant("create2")
    }))
})


export type TraceActionCreate = GetSrcType<typeof TraceActionCreate>


export const TraceActionCall = object({
    callType: oneOf({
        'call': constant("call"),
        'callcode': constant("callcode"),
        'delegatecall': constant("delegatecall"),
        'staticcall': constant("staticcall")
    }),
    from: BYTES,
    gas: BYTES,
    input: BYTES,
    to: BYTES,
    value: BYTES
})


export type TraceActionCall = GetSrcType<typeof TraceActionCall>


export const TraceActionReward = object({
    author: BYTES,
    rewardType: oneOf({
        'block': constant("block"),
        'uncle': constant("uncle"),
        'emptyStep': constant("emptyStep"),
        'external': constant("external")
    }),
    value: BYTES
})


export type TraceActionReward = GetSrcType<typeof TraceActionReward>


export const TraceActionSelfdestruct = object({
    address: BYTES,
    balance: BYTES,
    refundAddress: BYTES
})


export type TraceActionSelfdestruct = GetSrcType<typeof TraceActionSelfdestruct>


export const TraceResultCreate = object({
    gasUsed: BYTES,
    code: BYTES,
    address: BYTES
})


export type TraceResultCreate = GetSrcType<typeof TraceResultCreate>


export const TraceResultCall = object({
    gasUsed: BYTES,
    output: BYTES
})


export type TraceResultCall = GetSrcType<typeof TraceResultCall>


export const TraceFrame = object({
    action: oneOf({
        create: TraceActionCreate,
        call: TraceActionCall,
        reward: TraceActionReward,
        selfdestruct: TraceActionSelfdestruct
    }),
    blockHash: BYTES,
    blockNumber: NAT,
    result: option(oneOf({
        create: TraceResultCreate,
        call: TraceResultCall
    })),
    subtraces: NAT,
    traceAddress: array(NAT),
    transactionHash: nullable(BYTES),
    transactionPosition: NAT,
    type: oneOf({
        create: constant("create"),
        call: constant("call"),
        reward: constant("reward"),
        selfdestruct: constant("suicide")
    }),
    error: option(STRING),
})


export type TraceFrame = GetSrcType<typeof TraceFrame>


export const TraceAddDiff = object({
    "+": BYTES
})


export type TraceAddDiff = GetSrcType<typeof TraceAddDiff>


export const TraceChangeValue = object({
    "from": BYTES,
    "to": BYTES
})


export type TraceChangeValue = GetSrcType<typeof TraceChangeValue>


export const TraceChangeDiff = object({
    "*": TraceChangeValue
})


export type TraceChangeDiff = GetSrcType<typeof TraceChangeDiff>


export const TraceDeleteDiff = object({
    "-": BYTES
})


export type TraceDeleteDiff = GetSrcType<typeof TraceDeleteDiff>


export const TraceDiff = oneOf({
    same: constant("="),
    add: TraceAddDiff,
    change: TraceChangeDiff,
    delete: TraceDeleteDiff
})


export type TraceDiff = GetSrcType<typeof TraceDiff>


export const StateDiff = object({
    balance: TraceDiff,
    code: TraceDiff,
    nonce: TraceDiff,
    storage: record(BYTES, TraceDiff)
})


export type StateDiff = GetSrcType<typeof StateDiff>


export const TraceTransactionReplay = object({
    output: option(BYTES),
    stateDiff: option(record(BYTES, StateDiff)),
    trace: option(array(TraceFrame)),
    transactionHash: BYTES,
})


export type TraceTransactionReplay = GetSrcType<typeof TraceTransactionReplay>


export const GetBlock = object({
    baseFeePerGas: option(BYTES),
    blobGasUsed: option(BYTES),
    difficulty: option(BYTES),
    excessBlobGas: option(BYTES),
    extraData: BYTES,
    gasLimit: BYTES,
    gasUsed: BYTES,
    hash: BYTES,
    logsBloom: BYTES,
    miner: BYTES,
    mixHash: option(BYTES),
    nonce: option(BYTES),
    number: BYTES,
    parentBeaconBlockRoot: option(BYTES),
    parentHash: BYTES,
    receiptsRoot: BYTES,
    sha3Uncles: BYTES,
    size: BYTES,
    stateRoot: BYTES,
    timestamp: BYTES,
    transactions: oneOf({
        justHashes: array(BYTES),
        fullTransactions: array(Transaction)
    }),
    transactionsRoot: BYTES,
    uncles: array(BYTES),
    withdrawals: option(array(Withdrawal)),
    withdrawalsRoot: option(BYTES),

    l1BlockNumber: option(BYTES),
    totalDifficulty: option(BYTES),
})


export type GetBlock = GetSrcType<typeof GetBlock>
