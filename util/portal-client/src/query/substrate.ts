import {
    array,
    NAT,
    BYTES,
    object,
    Validator,
    STRING,
    option,
    nullable,
    BOOLEAN,
    oneOf,
    constant,
    withDefault,
    ANY_OBJECT,
    BIG_NAT,
    ANY,
} from '@subsquid/util-internal-validation'
import {
    type Select,
    type Selector,
    type Trues,
    type Hex,
    type Simplify,
    type PortalQuery,
    project,
    type Selected,
    ObjectValidatorShape,
} from './common'

/**
 * @example 'Balances.Transfer'
 */
export type QualifiedName = string & {}

export type BlockHeaderFields = {
    /**
     * Block height
     */
    number: number
    /**
     * Block hash
     */
    hash: Hex
    /**
     * Hash of the parent block
     */
    parentHash: Hex
    /**
     * Root hash of the state merkle tree
     */
    stateRoot: Hex
    /**
     * Root hash of the extrinsics merkle tree
     */
    extrinsicsRoot: Hex
    digest: {logs: Hex[]}
    specName: string
    specVersion: number
    implName: string
    implVersion: number
    /**
     * Block timestamp as set by `timestamp.now()` (unix epoch ms, compatible with `Date`).
     */
    timestamp?: number
    /**
     * Account address of block validator
     */
    validator?: Hex
}

export type ExtrinsicSignature = {
    address: Hex
    signature: unknown
    signedExtensions: unknown
}

export type ExtrinsicFields = {
    /**
     * Ordinal index in the extrinsics array of the current block
     */
    index: number
    version: number
    signature?: ExtrinsicSignature
    fee?: bigint
    tip?: bigint
    error?: unknown
    success?: boolean
    /**
     * Blake2b 128-bit hash of the raw extrinsic
     */
    hash?: Hex
}

export type CallFields = {
    extrinsicIndex: number
    address: number[]
    name: QualifiedName
    args: unknown
    origin?: unknown
    /**
     * Call error.
     *
     * Absence of error doesn't imply that the call was executed successfully,
     * check {@link success} property for that.
     */
    error?: unknown
    success?: boolean
}

export type EventFields = {
    /**
     * Ordinal index in the event array of the current block
     */
    index: number
    /**
     * Event name
     */
    name: QualifiedName
    args: unknown
    phase: 'Initialization' | 'ApplyExtrinsic' | 'Finalization'
    extrinsicIndex?: number
    callAddress?: number[]
    /**
     * This field is not supported by all currently deployed archives.
     * Requesting it may cause internal error.
     */
    topics: Hex[]
}

export type BlockHeaderFieldSelection = Selector<keyof BlockHeaderFields, 'number' | 'hash'>
export type BlockHeader<T extends BlockHeaderFieldSelection = Trues<BlockHeaderFieldSelection>> = Select<
    BlockHeaderFields,
    T
>

export type ExtrinsicFieldSelection = Selector<keyof ExtrinsicFields>
export type Extrinsic<T extends ExtrinsicFieldSelection = Trues<ExtrinsicFieldSelection>> = Select<ExtrinsicFields, T>

export type CallFieldSelection = Selector<keyof CallFields>
export type Call<T extends CallFieldSelection = Trues<CallFieldSelection>> = Select<CallFields, T>

export type EventFieldSelection = Selector<keyof EventFields>
export type Event<T extends EventFieldSelection = Trues<EventFieldSelection>> = Select<EventFields, T>

export type FieldSelection = {
    block?: BlockHeaderFieldSelection
    extrinsic?: ExtrinsicFieldSelection
    call?: CallFieldSelection
    event?: EventFieldSelection
}

export type EventRelations = {
    extrinsic?: boolean
    call?: boolean
    stack?: boolean
}

export type EventRequest = Simplify<
    {
        name?: QualifiedName[]
    } & EventRelations
>

export type CallRelations = {
    extrinsic?: boolean
    stack?: boolean
    events?: boolean
}

export type CallRequest = Simplify<{name?: QualifiedName[]} & CallRelations>

export type EvmLogRequest = Simplify<{address?: Hex[]} & EventRelations>

export type EthereumLogRequest = Simplify<
    {
        address?: Hex[]
        topic0?: Hex[]
        topic1?: Hex[]
        topic2?: Hex[]
        topic3?: Hex[]
    } & EventRelations
>

export type EthereumTransactRequest = Simplify<{to?: Hex[]; sighash?: Hex[]} & CallRelations>

export type ContractsContractEmittedRequest = Simplify<{address?: Hex[]} & EventRelations>

export type GearMessageQueuedRequest = Simplify<{programId?: Hex[]} & EventRelations>

export type GearUserMessageSentRequest = Simplify<{programId?: Hex[]} & EventRelations>

export type DataRequest = {
    includeAllBlocks?: boolean
    events?: EventRequest[]
    calls?: CallRequest[]
    evmLogs?: EvmLogRequest[]
    ethereumTransactions?: EthereumTransactRequest[]
    contractsEvents?: ContractsContractEmittedRequest[]
    gearMessagesQueued?: GearMessageQueuedRequest[]
    gearUserMessagesSent?: GearUserMessageSentRequest[]
}

export type Query<F extends FieldSelection = FieldSelection> = Simplify<
    PortalQuery & {
        type: 'substrate'
        fields: F
    } & DataRequest
>

export type Block<F extends FieldSelection> = Simplify<{
    header: BlockHeader<Selected<F, 'block'>>
    events: Event<Selected<F, 'event'>>[]
    calls: Call<Selected<F, 'call'>>[]
    extrinsics: Extrinsic<Selected<F, 'extrinsic'>>[]
}>

export function getBlockSchema<F extends FieldSelection>(fields: F): Validator<Block<F>, unknown> {
    const header = object(project(BlockHeaderShape, {...fields.block, number: true, hash: true}))
    const extrinsic = object(project(ExtrinsicShape, fields.extrinsic))
    const call = object(project(CallShape, fields.call))

    const event = object(project(EventShape, fields.event))

    return object({
        header,
        events: withDefault([], array(event)),
        calls: withDefault([], array(call)),
        extrinsics: withDefault([], array(extrinsic)),
    }) as Validator<Block<F>, unknown>
}

const BlockHeaderShape: ObjectValidatorShape<BlockHeaderFields> = {
    number: NAT,
    hash: BYTES,
    parentHash: BYTES,
    stateRoot: BYTES,
    extrinsicsRoot: BYTES,
    digest: object({
        logs: array(BYTES),
    }),
    specName: STRING,
    specVersion: NAT,
    implName: STRING,
    implVersion: NAT,
    timestamp: NAT,
    validator: BYTES,
}

const ExtrinsicSignature: Validator<ExtrinsicSignature, unknown> = object({
    address: BYTES,
    signature: ANY_OBJECT,
    signedExtensions: ANY_OBJECT,
})

const ExtrinsicShape: ObjectValidatorShape<ExtrinsicFields> = {
    index: NAT,
    version: NAT,
    signature: option(ExtrinsicSignature),
    fee: BIG_NAT,
    tip: BIG_NAT,
    error: nullable(STRING),
    success: BOOLEAN,
    hash: BYTES,
}

const CallShape: ObjectValidatorShape<CallFields> = {
    extrinsicIndex: NAT,
    address: array(NAT),
    name: STRING,
    args: ANY,
    origin: ANY,
    error: ANY,
    success: option(BOOLEAN),
}

const EventShape: ObjectValidatorShape<EventFields> = {
    index: NAT,
    name: STRING,
    args: ANY,
    phase: oneOf({
        Initialization: constant('Initialization'),
        ApplyExtrinsic: constant('ApplyExtrinsic'),
        Finalization: constant('Finalization'),
    }),
    extrinsicIndex: NAT,
    callAddress: array(NAT),
    topics: array(BYTES),
}
