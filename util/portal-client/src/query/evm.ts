import type {Select, Selector, Trues, Hex, ConditionalOmit, Simplify, PortalBlock, PortalQuery} from './common'

type AddPrefix<Prefix extends string, S> = S extends string ? `${Prefix}${Capitalize<S>}` : never

type RemovePrefix<Prefix extends string, T> = T extends `${Prefix}${infer S}` ? Uncapitalize<S> : never

type RemoveKeysPrefix<Prefix extends string, T> = {
    [K in keyof T as RemovePrefix<Prefix, K>]: T[K]
}

export type BlockHeaderFields = {
    number: number
    hash: Hex
    parentHash: Hex
    timestamp: number
    transactionsRoot: Hex
    receiptsRoot: Hex
    stateRoot: Hex
    logsBloom: Hex
    sha3Uncles: Hex
    extraData: Hex
    miner: Hex
    nonce: Hex
    mixHash: Hex
    size: bigint
    gasLimit: bigint
    gasUsed: bigint
    difficulty: bigint
    totalDifficulty: bigint
    baseFeePerGas: bigint
    blobGasUsed: bigint
    excessBlobGas: bigint
    l1BlockNumber?: number
}

export type TransactionFields = {
    transactionIndex: number
    hash: Hex
    nonce: number
    from: Hex
    to?: Hex
    input: Hex
    value: bigint
    gas: bigint
    gasPrice: bigint
    maxFeePerGas?: bigint
    maxPriorityFeePerGas?: bigint
    v: bigint
    r: Hex
    s: Hex
    yParity?: number
    chainId?: number
    sighash?: Hex
    contractAddress?: Hex
    gasUsed: bigint
    cumulativeGasUsed: bigint
    effectiveGasPrice: bigint
    type: number
    status: number
    blobVersionedHashes: Hex[]

    l1Fee?: bigint
    l1FeeScalar?: number
    l1GasPrice?: bigint
    l1GasUsed?: bigint
    l1BlobBaseFee?: bigint
    l1BlobBaseFeeScalar?: number
    l1BaseFeeScalar?: number
}

export type LogFields = {
    logIndex: number
    transactionIndex: number
    transactionHash: Hex
    address: Hex
    data: Hex
    topics: Hex[]
}

export type TraceBaseFields = {
    type: string
    transactionIndex: number
    traceAddress: number[]
    subtraces: number
    error: string | null
    revertReason?: string
}

export type TraceCreateFields = TraceBaseFields & {
    type: 'create'
}

export type TraceCreateActionFields = {
    from: Hex
    value: bigint
    gas: bigint
    init: Hex
}

export type TraceCreateResultFields = {
    gasUsed: bigint
    code: Hex
    address: Hex
}

export type TraceCallFields = TraceBaseFields & {
    type: 'call'
}

export type TraceCallActionFields = {
    callType: string
    from: Hex
    to: Hex
    value?: bigint
    gas: bigint
    input: Hex
    sighash: Hex
}

export type TraceCallResultFields = {
    gasUsed: bigint
    output: Hex
}

export type TraceSuicideFields = TraceBaseFields & {
    type: 'suicide'
}

export type TraceSuicideActionFields = {
    address: Hex
    refundAddress: Hex
    balance: bigint
}

export type TraceRewardFields = TraceBaseFields & {
    type: 'reward'
}

export type TraceRewardActionFields = {
    author: Hex
    value: bigint
    type: string
}

export type StateDiffBaseFields = {
    transactionIndex: number
    address: Hex
    key: 'balance' | 'code' | 'nonce' | Hex
    kind: string
    prev?: unknown
    next?: unknown
}

export type StateDiffAddFields = StateDiffBaseFields & {
    kind: '+'
    prev?: null
    next: Hex
}

export type StateDiffNoChangeFields = StateDiffBaseFields & {
    kind: '='
    prev?: null
    next?: null
}

export type StateDiffChangeFields = StateDiffBaseFields & {
    kind: '*'
    prev: Hex
    next: Hex
}

export type StateDiffDeleteFields = StateDiffBaseFields & {
    kind: '-'
    prev: Hex
    next?: null
}

export type BlockHeaderFieldSelection = Simplify<Selector<keyof BlockHeaderFields> & {number: true}>
export type BlockHeader<T extends BlockHeaderFieldSelection = Trues<BlockHeaderFieldSelection>> = Select<
    BlockHeaderFields,
    T
>

export type TransactionFieldSelection = Selector<keyof TransactionFields>
export type Transaction<T extends TransactionFieldSelection = Trues<TransactionFieldSelection>> = Select<
    TransactionFields,
    T
>

export type LogFieldSelection = Selector<keyof LogFields>
export type Log<T extends LogFieldSelection = Trues<LogFieldSelection>> = Select<LogFields, T>

export type TraceCreateFieldSelection = Selector<
    | keyof TraceBaseFields
    | AddPrefix<'create', keyof TraceCreateActionFields>
    | AddPrefix<'createResult', keyof TraceCreateResultFields>
>

export type TraceCallFieldSelection = Selector<
    | keyof TraceBaseFields
    | AddPrefix<'call', keyof TraceCallActionFields>
    | AddPrefix<'callResult', keyof TraceCallResultFields>
>

export type TraceSuicideFieldSelection = Selector<
    keyof TraceBaseFields | AddPrefix<'suicide', keyof TraceSuicideActionFields>
>

export type TraceRewardFieldSelection = Selector<
    keyof TraceBaseFields | AddPrefix<'reward', keyof TraceRewardActionFields>
>

export type TraceFieldSelection = Simplify<
    TraceCreateFieldSelection & TraceCallFieldSelection & TraceSuicideFieldSelection & TraceRewardFieldSelection
>

export type TraceCreateAction<F extends TraceFieldSelection = Trues<TraceFieldSelection>> = Select<
    TraceCreateActionFields,
    RemoveKeysPrefix<'create', F>
>

export type TraceCreateResult<F extends TraceCreateFieldSelection = Trues<TraceCreateFieldSelection>> = Select<
    TraceCreateResultFields,
    RemoveKeysPrefix<'createResult', F>
>

export type TraceCallAction<F extends TraceCallFieldSelection = Trues<TraceCallFieldSelection>> = Select<
    TraceCallActionFields,
    RemoveKeysPrefix<'call', F>
>

export type TraceCallResult<F extends TraceCallFieldSelection = Trues<TraceCallFieldSelection>> = Select<
    TraceCallResultFields,
    RemoveKeysPrefix<'callResult', F>
>

export type TraceSuicideAction<F extends TraceSuicideFieldSelection = Trues<TraceSuicideFieldSelection>> = Select<
    TraceSuicideActionFields,
    RemoveKeysPrefix<'suicide', F>
>

export type TraceRewardAction<F extends TraceRewardFieldSelection = Trues<TraceRewardFieldSelection>> = Select<
    TraceRewardActionFields,
    RemoveKeysPrefix<'reward', F>
>

export type TraceCreate<F extends TraceCreateFieldSelection = Trues<TraceCreateFieldSelection>> = Simplify<
    Select<TraceCreateFields, F> &
        ConditionalOmit<{action: TraceCreateAction<F>; result?: TraceCreateResult<F>}, {[k: string]: never} | undefined>
>

export type TraceCall<F extends TraceCallFieldSelection = Trues<TraceCallFieldSelection>> = Simplify<
    Select<TraceCallFields, F> &
        ConditionalOmit<{action: TraceCallAction<F>; result?: TraceCallResult<F>}, {[k: string]: never} | undefined>
>

export type TraceSuicide<F extends TraceSuicideFieldSelection = Trues<TraceSuicideFieldSelection>> = Simplify<
    Select<TraceSuicideFields, F> & ConditionalOmit<{action: TraceSuicideAction<F>}, {[k: string]: never} | undefined>
>

export type TraceReward<F extends TraceRewardFieldSelection = Trues<TraceRewardFieldSelection>> = Simplify<
    Select<TraceRewardFields, F> & ConditionalOmit<{action: TraceRewardAction<F>}, {[k: string]: never} | undefined>
>

export type Trace<F extends TraceFieldSelection = Trues<TraceFieldSelection>> = F extends any
    ? TraceCreate<F> | TraceCall<F> | TraceSuicide<F> | TraceReward<F>
    : never

export type StateDiffFieldSelection = Selector<keyof StateDiffBaseFields>

export type StateDiffNoChange<F extends StateDiffFieldSelection = Trues<StateDiffFieldSelection>> = Select<
    StateDiffNoChangeFields,
    F
>

export type StateDiffAdd<F extends StateDiffFieldSelection = Trues<StateDiffFieldSelection>> = Select<
    StateDiffAddFields,
    F
>

export type StateDiffChange<F extends StateDiffFieldSelection = Trues<StateDiffFieldSelection>> = Select<
    StateDiffChangeFields,
    F
>

export type StateDiffDelete<F extends StateDiffFieldSelection = Trues<StateDiffFieldSelection>> = Select<
    StateDiffDeleteFields,
    F
>

export type StateDiff<F extends StateDiffFieldSelection = Trues<StateDiffFieldSelection>> = F extends any
    ? StateDiffNoChange<F> | StateDiffAdd<F> | StateDiffChange<F> | StateDiffDelete<F>
    : never

export type FieldSelection = {
    block?: BlockHeaderFieldSelection
    transaction?: TransactionFieldSelection
    log?: LogFieldSelection
    trace?: TraceFieldSelection
    stateDiff?: StateDiffFieldSelection
}

export type LogRequest = {
    address?: Hex[]
    topic0?: Hex[]
    topic1?: Hex[]
    topic2?: Hex[]
    topic3?: Hex[]
    transaction?: boolean
    transactionTraces?: boolean
    transactionLogs?: boolean
    transactionStateDiffs?: boolean
}

export type TransactionRequest = {
    to?: Hex[]
    from?: Hex[]
    sighash?: Hex[]
    type?: number[]
    logs?: boolean
    traces?: boolean
    stateDiffs?: boolean
}

export type TraceRequest = {
    type?: string[]
    createFrom?: Hex[]
    callTo?: Hex[]
    callFrom?: Hex[]
    callSighash?: Hex[]
    suicideRefundAddress?: Hex[]
    rewardAuthor?: Hex[]
    transaction?: boolean
    transactionLogs?: boolean
    subtraces?: boolean
    parents?: boolean
}

export type StateDiffRequest = {
    address?: Hex[]
    key?: Hex[]
    kind?: string[]
    transaction?: boolean
}

export type DataRequest = {
    logs?: LogRequest[]
    transactions?: TransactionRequest[]
    traces?: TraceRequest[]
    stateDiffs?: StateDiffRequest[]
    includeAllBlocks?: boolean
}

export type Query = Simplify<
    PortalQuery & {
        type: 'evm'
        fields: FieldSelection
    } & DataRequest
>

export type Block<F extends FieldSelection> = Simplify<{
    header: BlockHeader<F['block'] & {}>
    logs?: Log<F['log'] & {}>[]
    transactions?: Transaction<F['transaction'] & {}>[]
    traces?: Trace<F['trace'] & {}>[]
    stateDiffs?: StateDiff<F['stateDiff'] & {}>[]
}>
