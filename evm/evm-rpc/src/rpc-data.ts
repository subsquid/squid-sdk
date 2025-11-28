import {
    array,
    BOOLEAN,
    BYTES,
    constant,
    GetSrcType,
    NAT,
    nullable,
    object,
    oneOf,
    option,
    QTY,
    record,
    SMALL_QTY,
    STRING,
    STRING_FLOAT,
    Validator,
    ref
} from '@subsquid/util-internal-validation'
import {Bytes} from './types'


export const AccessItem = object({
    address: BYTES,
    storageKeys: array(BYTES),
})


export type AccessItem = GetSrcType<typeof AccessItem>


export const FrontierAccessItem = object({
    address: BYTES,
    // at least bittensor network has snake_case intead of camelCase
    // potentially other frontier networks can be affected
    storage_keys: array(BYTES)
})


export type FrontierAccessItem = GetSrcType<typeof FrontierAccessItem>


export type AccessListItem = AccessItem | FrontierAccessItem


export const EIP7702Authorization = object({
    chainId: QTY,
    address: BYTES,
    nonce: SMALL_QTY,
    yParity: SMALL_QTY,
    r: BYTES,
    s: BYTES
})


export type EIP7702Authorization = GetSrcType<typeof EIP7702Authorization>


export const Transaction = object({
    blockNumber: SMALL_QTY,
    blockHash: BYTES,
    hash: BYTES,
    transactionIndex: SMALL_QTY,
    chainId: option(SMALL_QTY),
    from: BYTES,
    to: option(BYTES),
    gas: QTY,
    gasPrice: option(QTY),
    input: BYTES,
    maxFeePerGas: option(QTY),
    maxPriorityFeePerGas: option(QTY),
    nonce: SMALL_QTY,
    v: option(QTY),
    r: option(BYTES),
    s: option(BYTES),
    type: option(SMALL_QTY),
    value: QTY,
    yParity: option(SMALL_QTY),
    accessList: option(array(oneOf({
        evm: AccessItem,
        frontier: FrontierAccessItem,
    }))),
    maxFeePerBlobGas: option(QTY),
    blobVersionedHashes: option(array(BYTES)),
    authorizationList: option(array(EIP7702Authorization)),
    requestId: option(BYTES),
    ticketId: option(BYTES),
    refundTo: option(BYTES),
    maxRefund: option(QTY),
    submissionFeeRefund: option(QTY),
    l1BaseFee: option(QTY),
    depositValue: option(QTY),
    retryTo: option(BYTES),
    retryValue: option(QTY),
    beneficiary: option(BYTES),
    maxSubmissionFee: option(QTY),
    retryData: option(BYTES),
    sourceHash: option(BYTES),
    mint: option(QTY)
})


export type Transaction = GetSrcType<typeof Transaction>


export const Withdrawal = object({
    address: BYTES,
    amount: QTY,
    index: QTY,
    validatorIndex: QTY
})


export type Withdrawal = GetSrcType<typeof Withdrawal>


export const Log = object({
    blockHash: BYTES,
    blockNumber: SMALL_QTY,
    transactionHash: BYTES,
    transactionIndex: SMALL_QTY,
    logIndex: SMALL_QTY,
    address: BYTES,
    topics: array(BYTES),
    data: BYTES,
    removed: BOOLEAN
})


export type Log = GetSrcType<typeof Log>


export const Receipt = object({
    blockHash: BYTES,
    blockNumber: SMALL_QTY,
    transactionHash: BYTES,
    transactionIndex: SMALL_QTY,
    contractAddress: nullable(BYTES),
    cumulativeGasUsed: QTY,
    from: BYTES,
    gasUsed: QTY,
    effectiveGasPrice: QTY,
    logs: array(Log),
    logsBloom: BYTES,
    status: SMALL_QTY,
    to: nullable(BYTES),
    type: SMALL_QTY,
    l1Fee: option(QTY),
    l1FeeScalar: option(STRING_FLOAT),
    l1BaseFeeScalar: option(SMALL_QTY),
    l1BlobBaseFee: option(QTY),
    l1BlobBaseFeeScalar: option(SMALL_QTY),
    l1GasPrice: option(QTY),
    l1GasUsed: option(QTY),
    depositNonce: option(QTY),
    depositReceiptVersion: option(QTY)
})


export type Receipt = GetSrcType<typeof Receipt>


export const TraceActionCreate = object({
    from: BYTES,
    value: QTY,
    gas: QTY,
    init: BYTES,
    creation_method: option(oneOf({
        create: constant('create'),
        create2: constant('create2')
    }))
})


export type TraceActionCreate = GetSrcType<typeof TraceActionCreate>


export const TraceActionCall = object({
    callType: oneOf({
        call: constant('call'),
        callcode: constant('callcode'),
        delegatecall: constant('delegatecall'),
        staticcall: constant('staticcall')
    }),
    from: BYTES,
    gas: QTY,
    input: BYTES,
    to: BYTES,
    value: QTY
})


export type TraceActionCall = GetSrcType<typeof TraceActionCall>


export const TraceActionReward = object({
    author: BYTES,
    rewardType: oneOf({
        block: constant('block'),
        uncle: constant('uncle'),
        emptyStep: constant('emptyStep'),
        external: constant('external')
    }),
    value: QTY
})


export type TraceActionReward = GetSrcType<typeof TraceActionReward>


export const TraceActionSelfdestruct = object({
    address: BYTES,
    balance: QTY,
    refundAddress: BYTES
})


export type TraceActionSelfdestruct = GetSrcType<typeof TraceActionSelfdestruct>


export const TraceResultCreate = object({
    gasUsed: QTY,
    code: BYTES,
    address: BYTES
})


export type TraceResultCreate = GetSrcType<typeof TraceResultCreate>


export const TraceResultCall = object({
    gasUsed: QTY,
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
    blockHash: option(BYTES),
    blockNumber: option(NAT),
    result: option(oneOf({
        create: TraceResultCreate,
        call: TraceResultCall
    })),
    subtraces: NAT,
    traceAddress: array(NAT),
    transactionHash: option(BYTES),
    transactionPosition: option(NAT),
    type: oneOf({
        create: constant('create'),
        call: constant('call'),
        reward: constant('reward'),
        selfdestruct: constant('suicide')
    }),
    error: option(STRING)
})


export type TraceFrame = GetSrcType<typeof TraceFrame>


export const TraceAddDiff = object({
    '+': BYTES
})


export type TraceAddDiff = GetSrcType<typeof TraceAddDiff>


export const TraceChangeValue = object({
    'from': BYTES,
    'to': BYTES
})


export type TraceChangeValue = GetSrcType<typeof TraceChangeValue>


export const TraceChangeDiff = object({
    '*': TraceChangeValue
})


export type TraceChangeDiff = GetSrcType<typeof TraceChangeDiff>


export const TraceDeleteDiff = object({
    '-': BYTES
})


export type TraceDeleteDiff = GetSrcType<typeof TraceDeleteDiff>


export const TraceDiff = oneOf({
    same: constant('='),
    add: TraceAddDiff,
    change: TraceChangeDiff,
    delete: TraceDeleteDiff
})


export type TraceDiff = GetSrcType<typeof TraceDiff>


export const TraceStateDiff = object({
    balance: TraceDiff,
    code: TraceDiff,
    nonce: TraceDiff,
    storage: record(BYTES, TraceDiff)
})


export type TraceStateDiff = GetSrcType<typeof TraceStateDiff>


export const TraceTransactionReplay = object({
    output: option(BYTES),
    stateDiff: option(record(BYTES, TraceStateDiff)),
    trace: option(array(TraceFrame)),
    transactionHash: option(BYTES)
})


export type TraceTransactionReplay = GetSrcType<typeof TraceTransactionReplay>


export const DebugStateMap = object({
    balance: option(QTY),
    code: option(BYTES),
    nonce: option(NAT),
    storage: option(record(BYTES, BYTES))
})


export type DebugStateMap = GetSrcType<typeof DebugStateMap>


export const DebugStateDiff = object({
    pre: record(BYTES, DebugStateMap),
    post: record(BYTES, DebugStateMap)
})


export type DebugStateDiff = GetSrcType<typeof DebugStateDiff>


export const DebugStateDiffResult = object({
    result: DebugStateDiff,
    txHash: option(BYTES)
})


export type DebugStateDiffResult = GetSrcType<typeof DebugStateDiffResult>


export const DebugFrame: Validator<DebugFrame> = object({
    type: STRING,
    from: BYTES,
    to: option(BYTES),
    input: BYTES,
    output: option(BYTES),
    error: option(STRING),
    revertReason: option(STRING),
    value: option(BYTES),
    gas: BYTES,
    gasUsed: option(BYTES),
    calls: option(array(ref(() => DebugFrame)))
})


export interface DebugFrame {
    type: string
    from: Bytes
    to?: Bytes | null
    input: Bytes
    output?: Bytes | null
    error?: string | null
    revertReason?: string | null
    value?: Bytes | null
    gas: Bytes
    gasUsed?: Bytes | null
    calls?: DebugFrame[] | null
}


export const DebugFrameResult = object({
    result: DebugFrame,
    txHash: option(BYTES)
})


export type DebugFrameResult = GetSrcType<typeof DebugFrameResult>


export const GetBlock = object({
    number: SMALL_QTY,
    hash: BYTES,
    parentHash: BYTES,
    difficulty: option(QTY),
    totalDifficulty: option(QTY),
    excessBlobGas: option(QTY),
    extraData: BYTES,
    gasLimit: QTY,
    gasUsed: QTY,
    sha3Uncles: BYTES,
    logsBloom: BYTES,
    transactionsRoot: BYTES,
    receiptsRoot: BYTES,
    stateRoot: BYTES,
    miner: BYTES,
    mixHash: option(BYTES),
    nonce: option(BYTES),
    baseFeePerGas: option(QTY),
    blobGasUsed: option(QTY),
    parentBeaconBlockRoot: option(BYTES),
    size: QTY,
    timestamp: QTY,
    transactions: oneOf({
        justHashes: array(BYTES),
        fullTransactions: array(Transaction)
    }),
    uncles: array(BYTES),
    withdrawals: option(array(Withdrawal)),
    withdrawalsRoot: option(BYTES),
    requestsHash: option(BYTES),
    l1BlockNumber: option(SMALL_QTY)
})


export type GetBlock = GetSrcType<typeof GetBlock>


export interface TraceReplayTraces {
    trace?: boolean
    stateDiff?: boolean
}


export function getTraceTransactionReplayValidator(tracers: TraceReplayTraces): Validator<TraceTransactionReplay> {
    return object({
        transactionHash: option(BYTES),
        ...project(tracers, {
            trace: array(TraceFrame),
            stateDiff: record(BYTES, TraceStateDiff)
        })
    }) as unknown as Validator<TraceTransactionReplay>
}


export function project<T extends object, F extends {[K in keyof T]?: boolean}>(
    fields: F | undefined,
    obj: T
): Partial<T> {
    if (fields == null) return {}
    let result: Partial<T> = {}
    let key: keyof T
    for (key in obj) {
        if (fields[key]) {
            result[key] = obj[key]
        }
    }
    return result
}
