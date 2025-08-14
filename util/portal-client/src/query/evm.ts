import {
    QTY,
    BYTES,
    constant,
    NAT,
    nullable,
    object,
    option,
    STRING,
    taggedUnion,
    Validator,
    withDefault,
    oneOf,
    ANY,
} from '@subsquid/util-internal-validation'
import {array} from '@subsquid/util-internal-validation'
import {
    Select,
    Selector,
    Trues,
    Hex,
    ConditionalOmit,
    Simplify,
    PortalQuery,
    project,
    type Selected,
    type ObjectValidatorShape,
} from './common'

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
    size: number
    gasLimit: bigint
    gasUsed: bigint
    difficulty: bigint
    totalDifficulty?: bigint
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
    blobVersionedHashes?: Hex[]

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

export type TraceType = 'create' | 'call' | 'suicide' | 'reward'

export type TraceBaseFields = {
    type: TraceType
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
    code?: Hex
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
    sighash?: Hex
}

export type TraceCallResultFields = {
    gasUsed: bigint
    output?: Hex
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
}

export type StateDiffAddFields = StateDiffBaseFields & {
    kind: '+'
    prev?: undefined
    next: Hex
}

export type StateDiffNoChangeFields = StateDiffBaseFields & {
    kind: '='
    prev?: undefined
    next?: undefined
}

export type StateDiffChangeFields = StateDiffBaseFields & {
    kind: '*'
    prev: Hex
    next: Hex
}

export type StateDiffDeleteFields = StateDiffBaseFields & {
    kind: '-'
    prev: Hex
    next?: undefined
}

export type BlockHeaderFieldSelection = Selector<keyof BlockHeaderFields, 'number' | 'hash'>
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
    type?: TraceType[]
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

export type Query<F extends FieldSelection = FieldSelection> = Simplify<
    PortalQuery & {
        type: 'evm'
        fields: F
    } & DataRequest
>

export type Block<F extends FieldSelection> = Simplify<{
    header: BlockHeader<Selected<F, 'block'>>
    logs: Log<Selected<F, 'log'>>[]
    transactions: Transaction<Selected<F, 'transaction'>>[]
    traces: Trace<Selected<F, 'trace'>>[]
    stateDiffs: StateDiff<Selected<F, 'stateDiff'>>[]
}>

export const getBlockSchema = <F extends FieldSelection>(fields: F): Validator<Block<F>, unknown> => {
    let header = object(project(BlockHeaderShape, {...fields.block, number: true, hash: true}))
    let log = object(project(LogShape, fields.log))
    let transaction = object(project(TransactionShape, fields.transaction))
    let trace = getTraceFrameValidator(fields.trace)
    let stateDiff = getStateDiffValidator(fields.stateDiff)

    return object({
        header,
        logs: withDefault([], array(log)),
        transactions: withDefault([], array(transaction)),
        traces: withDefault([], array(trace)),
        stateDiffs: withDefault([], array(stateDiff)),
    }) as Validator<Block<F>, unknown>
}

const BlockHeaderShape: ObjectValidatorShape<BlockHeaderFields> = {
    number: NAT,
    hash: BYTES,
    parentHash: BYTES,
    timestamp: NAT,
    transactionsRoot: BYTES,
    receiptsRoot: BYTES,
    stateRoot: BYTES,
    logsBloom: BYTES,
    sha3Uncles: BYTES,
    extraData: BYTES,
    miner: BYTES,
    nonce: BYTES,
    mixHash: BYTES,
    size: NAT,
    gasLimit: QTY,
    gasUsed: QTY,
    difficulty: QTY,
    totalDifficulty: option(QTY),
    baseFeePerGas: QTY,
    blobGasUsed: QTY,
    excessBlobGas: QTY,
    l1BlockNumber: option(NAT),
}

const LogShape: ObjectValidatorShape<LogFields> = {
    logIndex: NAT,
    transactionIndex: NAT,
    transactionHash: BYTES,
    address: BYTES,
    data: BYTES,
    topics: array(BYTES),
}

const TransactionShape: ObjectValidatorShape<TransactionFields> = {
    transactionIndex: NAT,
    hash: BYTES,
    nonce: NAT,
    from: BYTES,
    to: option(BYTES),
    input: BYTES,
    value: QTY,
    gas: QTY,
    gasPrice: QTY,
    maxFeePerGas: option(QTY),
    maxPriorityFeePerGas: option(QTY),
    v: QTY,
    r: BYTES,
    s: BYTES,
    yParity: option(NAT),
    chainId: option(NAT),
    sighash: option(BYTES),
    contractAddress: option(BYTES),
    gasUsed: QTY,
    cumulativeGasUsed: QTY,
    effectiveGasPrice: QTY,
    type: NAT,
    status: NAT,
    blobVersionedHashes: option(array(BYTES)),
    l1Fee: option(QTY),
    l1FeeScalar: option(NAT),
    l1GasPrice: option(QTY),
    l1GasUsed: option(QTY),
    l1BlobBaseFee: option(QTY),
    l1BlobBaseFeeScalar: option(NAT),
    l1BaseFeeScalar: option(NAT),
}

function getTraceFrameValidator<T extends FieldSelection['trace']>(
    fields: T
): Validator<Trace<NonNullable<T>>, unknown> {
    let BaseShape = project(TraceBaseShape, fields)

    let createAction = object(
        project(TraceCreateActionShape, {
            from: fields?.createFrom,
            value: fields?.createValue,
            gas: fields?.createGas,
            init: fields?.createInit,
        })
    )

    let createResult = object(
        project(TraceCreateResultShape, {
            gasUsed: fields?.createResultGasUsed,
            code: fields?.createResultCode,
            address: fields?.createResultAddress,
        })
    )

    let create = object({
        ...BaseShape,
        type: constant('create'),
        action: withDefault({}, createAction),
        result: isEmpty(createResult) ? undefined : option(createResult),
    })

    let callAction = object(
        project(TraceCallActionShape, {
            callType: fields?.callCallType,
            from: fields?.callFrom,
            to: fields?.callTo,
            value: fields?.callValue,
            gas: fields?.callGas,
            input: fields?.callInput,
            sighash: fields?.callSighash,
        })
    )

    let callResult = object(
        project(TraceCallResultShape, {
            gasUsed: fields?.callResultGasUsed,
            output: fields?.callResultOutput,
        })
    )

    let call = object({
        ...BaseShape,
        type: constant('call'),
        action: withDefault({}, callAction),
        result: isEmpty(callResult) ? undefined : option(callResult),
    })

    let suicideAction = object(
        project(TraceSuicideActionShape, {
            address: fields?.suicideAddress,
            refundAddress: fields?.suicideRefundAddress,
            balance: fields?.suicideBalance,
        })
    )

    let suicide = object({
        ...BaseShape,
        type: constant('suicide'),
        action: withDefault({}, suicideAction),
    })

    let rewardAction = object(
        project(TraceRewardActionShape, {
            author: fields?.rewardAuthor,
            value: fields?.rewardValue,
            type: fields?.rewardType,
        })
    )

    let reward = object({
        ...BaseShape,
        type: constant('reward'),
        action: withDefault({}, rewardAction),
    })

    return taggedUnion('type', {
        create,
        call,
        suicide,
        reward,
    }) as Validator<Trace<NonNullable<T>>, unknown>
}

const TraceBaseShape: ObjectValidatorShape<TraceBaseFields> = {
    type: oneOf({
        create: constant('create'),
        call: constant('call'),
        suicide: constant('suicide'),
        reward: constant('reward'),
    }),
    transactionIndex: NAT,
    traceAddress: array(NAT),
    subtraces: NAT,
    error: nullable(STRING),
    revertReason: option(STRING),
}

const TraceCreateActionShape: ObjectValidatorShape<TraceCreateActionFields> = {
    from: BYTES,
    value: QTY,
    gas: QTY,
    init: BYTES,
}

const TraceCreateResultShape: ObjectValidatorShape<TraceCreateResultFields> = {
    gasUsed: QTY,
    code: option(BYTES),
    address: BYTES,
}

const TraceCallActionShape: ObjectValidatorShape<TraceCallActionFields> = {
    callType: STRING,
    from: BYTES,
    to: BYTES,
    value: option(QTY),
    gas: QTY,
    input: BYTES,
    sighash: option(BYTES),
}

const TraceCallResultShape: ObjectValidatorShape<TraceCallResultFields> = {
    gasUsed: QTY,
    output: option(BYTES),
}

const TraceSuicideActionShape: ObjectValidatorShape<TraceSuicideActionFields> = {
    address: BYTES,
    refundAddress: BYTES,
    balance: QTY,
}

const TraceRewardActionShape: ObjectValidatorShape<TraceRewardActionFields> = {
    author: BYTES,
    value: QTY,
    type: STRING,
}

function getStateDiffValidator<T extends FieldSelection['stateDiff']>(
    fields: T
): Validator<StateDiff<NonNullable<T>>, unknown> {
    return taggedUnion('kind', {
        '+': object(project(StateDiffAddShape, fields)),
        '-': object(project(StateDiffDeleteShape, fields)),
        '*': object(project(StateDiffChangeShape, fields)),
        '=': object(project(StateDiffNoChangeShape, fields)),
    }) as Validator<StateDiff<NonNullable<T>>, unknown>
}

const StateDiffBaseShape: ObjectValidatorShape<StateDiffBaseFields> = {
    kind: oneOf({
        '+': constant('+'),
        '-': constant('-'),
        '*': constant('*'),
        '=': constant('='),
    }),
    transactionIndex: NAT,
    address: BYTES,
    key: STRING,
}

const StateDiffAddShape: ObjectValidatorShape<StateDiffAddFields> = {
    ...StateDiffBaseShape,
    kind: constant('+'),
    next: BYTES,
}

const StateDiffDeleteShape: ObjectValidatorShape<StateDiffDeleteFields> = {
    ...StateDiffBaseShape,
    kind: constant('-'),
    prev: BYTES,
}

const StateDiffChangeShape: ObjectValidatorShape<StateDiffChangeFields> = {
    ...StateDiffBaseShape,
    kind: constant('*'),
    prev: BYTES,
    next: BYTES,
}

const StateDiffNoChangeShape: ObjectValidatorShape<StateDiffNoChangeFields> = {
    ...StateDiffBaseShape,
    kind: constant('='),
}

export function isEmpty(obj: object): boolean {
    for (let _ in obj) {
        return false
    }
    return true
}
