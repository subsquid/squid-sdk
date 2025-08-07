import type {Select, Selector, Trues, Hex, Simplify, PortalBlock, PortalQuery} from './common'

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

export type ExtrinsicSignatureFields = {
    address: unknown
    signature: unknown
    signedExtensions: unknown
}

export type ExtrinsicFields = {
    /**
     * Ordinal index in the extrinsics array of the current block
     */
    index: number
    version: number
    signature?: ExtrinsicSignatureFields
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
    _ethereumTransactTo?: Hex
    _ethereumTransactSighash?: Hex
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
    _evmLogAddress?: Hex
    _evmLogTopics?: Hex[]
    _contractAddress?: Hex
    _gearProgramId?: Hex
}

export type BlockHeaderFieldSelection = Simplify<Selector<keyof BlockHeaderFields> & {number: true}>
export type BlockHeader<T extends BlockHeaderFieldSelection = Trues<BlockHeaderFieldSelection>> = Select<
    BlockHeaderFields,
    T
>

export type ExtrinsicFieldSelection = Selector<keyof ExtrinsicFields>
export type Extrinsic<T extends ExtrinsicFieldSelection = Trues<ExtrinsicFieldSelection>> = Select<ExtrinsicFields, T>

export type CallFieldSelection = Selector<keyof CallFields>
export type Call<T extends CallFieldSelection = Trues<CallFieldSelection>> = Select<CallFields, T>

export type EventFieldSelection = Selector<keyof EventFields>
export type Event<T extends EventFieldSelection = Trues<CallFieldSelection>> = Select<EventFields, T>

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

export type Query = Simplify<
    PortalQuery & {
        type: 'substrate'
        fields: FieldSelection
    } & DataRequest
>

export type Block<F extends FieldSelection> = Simplify<{
    header: BlockHeader<F['block'] & {}>
    events?: Event<F['event'] & {}>[]
    calls?: Call<F['call'] & {}>[]
    extrinsics?: Extrinsic<F['extrinsic'] & {}>[]
}>
