import type {Bytes, QualifiedName} from '@subsquid/substrate-data'
import type {FieldSelection} from './data'


export interface DataRequest {
    fields?: FieldSelection
    includeAllBlocks?: boolean
    events?: EventRequest[]
    calls?: CallRequest[]
    evmLogs?: EvmLogRequest[]
    ethereumTransactions?: EthereumTransactRequest[]
    contractsEvents?: ContractsContractEmittedRequest[]
    gearMessagesQueued?: GearMessageQueuedRequest[]
    gearUserMessagesSent?: GearUserMessageSentRequest[]
}


export interface EventRelations {
    extrinsic?: boolean
    call?: boolean
    stack?: boolean
}


export interface EventRequest extends EventRelations {
    name?: QualifiedName[]
}


export interface CallRelations {
    extrinsic?: boolean
    stack?: boolean
    events?: boolean
}


export interface CallRequest extends CallRelations {
    name?: QualifiedName[]
}


export interface EvmLogRequest extends EventRelations {
    address?: Bytes[]
    topic0?: Bytes[]
    topic1?: Bytes[]
    topic2?: Bytes[]
    topic3?: Bytes[]
}


export interface EthereumTransactRequest extends CallRelations {
    to?: Bytes[]
    sighash?: Bytes[]
}


export interface ContractsContractEmittedRequest extends EventRelations {
    contractAddress?: Bytes[]
}


export interface GearMessageQueuedRequest extends EventRelations {
    programId?: Bytes[]
}


export interface GearUserMessageSentRequest extends EventRelations {
    programId?: Bytes[]
}
