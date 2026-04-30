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
    size: number,
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
    l1BlockNumber?: number,
    // Tempo-specific block header fields
    mainBlockGeneralGasLimit?: Qty,
    sharedGasLimit?: Qty,
    timestampMillisPart?: Qty,
}


export interface AccessListItem {
    address: Bytes20,
    storageKeys: Bytes[]
}


export interface EIP7702Authorization {
    chainId: Qty,
    address: Bytes20,
    nonce: bigint,
    yParity: number,
    r: Bytes32,
    s: Bytes32
}


export interface TempoCall {
    to?: Bytes20,
    value: Qty,
    input: Bytes
}


export interface TempoSecp256k1Signature {
    type: 'secp256k1',
    r: Bytes,
    s: Bytes,
    yParity?: number,
    v?: number,
}


export interface TempoP256Signature {
    type: 'p256',
    r: Bytes,
    s: Bytes,
    pubKeyX: Bytes,
    pubKeyY: Bytes,
    preHash: boolean,
}


export interface TempoWebAuthnSignature {
    type: 'webAuthn',
    r: Bytes,
    s: Bytes,
    pubKeyX: Bytes,
    pubKeyY: Bytes,
    webauthnData: Bytes,
}


export type TempoPrimitiveSignature =
    | TempoSecp256k1Signature
    | TempoP256Signature
    | TempoWebAuthnSignature


export interface TempoKeychainSignature {
    userAddress: Bytes20,
    signature: TempoPrimitiveSignature,
    version?: string
}


export type TempoSignature = TempoPrimitiveSignature | TempoKeychainSignature


export interface TempoSignedAuthorization {
    chainId: Qty,
    address: Bytes20,
    nonce: number,
    signature: TempoSignature
}


export interface TempoTokenLimit {
    token: Bytes20,
    limit: Qty
}


export interface TempoSignedKeyAuthorization {
    chainId: Qty,
    keyType: string,
    keyId: Bytes20,
    expiry?: Qty,
    limits?: TempoTokenLimit[],
    signature: TempoPrimitiveSignature
}


export interface TempoFeePayerSignature {
    v: number,
    r: Bytes,
    s: Bytes
}


export interface Transaction {
    transactionIndex: number,
    hash: Bytes32,
    nonce: number,
    from: Bytes20,
    to?: Bytes20,
    // Optional for Tempo 0x76 transactions which use batched `calls` instead of `input`
    input?: Bytes,
    // Optional for Tempo 0x76 transactions which use batched `calls`
    value?: Qty,
    type?: number,
    gas: Qty,
    gasPrice?: Qty,
    maxFeePerGas?: Qty,
    maxPriorityFeePerGas?: Qty,
    v?: Qty,
    r?: Bytes32,
    s?: Bytes32,
    yParity?: number,
    accessList?: AccessListItem[],
    chainId?: number,
    maxFeePerBlobGas?: Qty,
    blobVersionedHashes?: Bytes32[],
    authorizationList?: EIP7702Authorization[],
    // Tempo 0x76 transaction fields
    calls?: TempoCall[],
    nonceKey?: Bytes,
    signature?: TempoSignature,
    feeToken?: Bytes20,
    feePayerSignature?: TempoFeePayerSignature,
    validBefore?: Qty,
    validAfter?: Qty,
    aaAuthorizationList?: TempoSignedAuthorization[],
    keyAuthorization?: TempoSignedKeyAuthorization,
    // transaction receipt
    contractAddress?: Bytes20,
    cumulativeGasUsed?: Qty,
    effectiveGasPrice?: Qty,
    gasUsed?: Qty,
    logsBloom?: Bytes
    status?: number,
    blobGasUsed?: Qty,
    blobGasPrice?: Qty,
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


export interface TraceCreateAction {
    from: Bytes20,
    value?: Qty,
    gas: Qty,
    init: Bytes,
    creationMethod?: 'create' | 'create2'
}


export interface TraceCreateResult {
    gasUsed: Qty,
    code?: Bytes,
    address?: Bytes20
}


export interface TraceCallAction {
    from: Bytes20,
    to: Bytes20,
    value?: Qty,
    gas: Qty,
    input: Bytes,
    callType: string
}


export interface TraceCallResult {
    gasUsed?: Qty,
    output?: Bytes
}


export interface TraceRewardAction {
    author: Bytes20,
    value: Qty,
    rewardType: 'block' | 'uncle' | 'emptyStep' | 'external'
}


export interface TraceSelfdestructAction {
    address: Bytes20
    refundAddress: Bytes20
    balance?: Qty
}


export interface Trace {
    transactionIndex: number,
    traceAddress: number[],
    type: 'create' | 'call' | 'reward' | 'selfdestruct',
    subtraces: number,
    error?: string,
    revertReason?: string,
    action: TraceCreateAction | TraceCallAction | TraceRewardAction | TraceSelfdestructAction,
    result?: TraceCreateResult | TraceCallResult
}


interface StateDiffBase {
    transactionIndex: number,
    address: Bytes20,
    key: 'balance' | 'code' | 'nonce' | Bytes32
}


export interface StateDiffNoChange extends StateDiffBase {
    kind: '='
}


export interface StateDiffAdd extends StateDiffBase {
    kind: '+'
    next: Bytes
}


export interface StateDiffChange extends StateDiffBase {
    kind: '*'
    prev: Bytes
    next: Bytes
}


export interface StateDiffDelete extends StateDiffBase {
    kind: '-'
    prev: Bytes
}


export type StateDiff = StateDiffNoChange | StateDiffAdd | StateDiffChange | StateDiffDelete


export interface Block {
    header: BlockHeader,
    transactions: Transaction[],
    logs: Log[],
    traces?: Trace[],
    stateDiffs?: StateDiff[]
}
