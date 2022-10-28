import type {QualifiedName, SubstrateBlock, SubstrateEvent, SubstrateExtrinsicSignature} from "./substrate"


export interface BatchRequest {
    fromBlock: number
    toBlock: number
    includeAllBlocks?: boolean
    events?: ObjectRequest[]
    calls?: ObjectRequest[]
    evmLogs?: EvmLogRequest[]
    ethereumTransactions?: EthereumTransactionRequest[]
    contractsEvents?: ContractsEventRequest[]
    gearMessagesEnqueued?: GearMessageEnqueuedRequest[]
    gearUserMessagesSent?: GearUserMessageSentRequest[]
    acalaEvmExecuted?: AcalaEvmExecutedRequest[]
    acalaEvmExecutedFailed?: AcalaEvmExecutedFailedRequest[]
}


export interface ObjectRequest {
    name: string
    data?: any
}


export interface EvmLogRequest {
    contract: string
    filter?: string[][]
    data?: any
}


export interface EthereumTransactionRequest {
    contract: string
    sighash?: string
    data?: any
}


export interface ContractsEventRequest {
    contract: string
    data?: any
}


export interface GearMessageEnqueuedRequest {
    program: string
    data?: any
}


export interface GearUserMessageSentRequest {
    program: string
    data?: any
}


export interface AcalaEvmLogFilter {
    contract?: string
    filter?: string[][]
}


export interface AcalaEvmExecutedRequest {
    contract: string
    logs?: AcalaEvmLogFilter[]
    data?: any
}


export interface AcalaEvmExecutedFailedRequest {
    contract: string
    logs?: AcalaEvmLogFilter[]
    data?: any
}


export interface BatchResponse {
    data: BatchBlock[]
    nextBlock: number
}


export interface BatchBlock {
    header: Omit<SubstrateBlock, 'timestamp' | 'validator'> & {timestamp: string} & {validator: string | null}
    events: Event[]
    calls: Call[]
    extrinsics: Extrinsic[]
}


export interface Event {
    id: string
    indexInBlock?: number
    name?: QualifiedName
    args?: any
    phase?: SubstrateEvent["phase"]
    extrinsicId?: string
    callId?: string
    pos: number
}


export interface Call {
    id: string
    name?: QualifiedName
    args?: any
    success?: boolean
    extrinsicId?: string
    parentId?: string
    pos: number
}


export interface Extrinsic {
    id: string
    indexInBlock?: number
    callId?: string
    signature?: SubstrateExtrinsicSignature
    fee?: string
    tip?: string
    success?: boolean
    hash?: string
    pos: number
}
