import type {QueryBase} from '../common/query'
import type {Bytes} from '../common/data'
import type {FieldSelection} from './fields'
import type {QualifiedName} from './data'

export interface Query<F extends FieldSelection = FieldSelection> extends QueryBase, ItemQuery {
    type: 'substrate'
    fields?: F
}

export interface ItemQuery {
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
}

export interface EthereumTransactRequest extends CallRelations {
    to?: Bytes[]
    sighash?: Bytes[]
}

export interface ContractsContractEmittedRequest extends EventRelations {
    address?: Bytes[]
}

export interface GearMessageQueuedRequest extends EventRelations {
    programId?: Bytes[]
}

export interface GearUserMessageSentRequest extends EventRelations {
    programId?: Bytes[]
}
