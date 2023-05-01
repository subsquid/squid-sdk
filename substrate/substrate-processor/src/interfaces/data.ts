import type {
    CallDataRequest,
    EventDataRequest,
    SubstrateCallP,
    SubstrateEventP,
    SubstrateExtrinsicP
} from './data-selection'
import type {EvmTopicSet} from './options'
import type {SubstrateBlock} from './substrate'


export interface BlockData<Item> {
    /**
     * Block header
     */
    header: SubstrateBlock
    /**
     * A unified log of events and calls.
     *
     * All events deposited within a call are placed
     * before the call. All child calls are placed before the parent call.
     * List of block events is a subsequence of unified log.
     */
    items: Item[]
}


export type BlockItemP = {
    kind: 'call'
    name: string
    call: SubstrateCallP
    extrinsic?: SubstrateExtrinsicP
} | {
    kind: 'event'
    name: string
    event: SubstrateEventP
}


export type BlockDataP = BlockData<BlockItemP>


export interface DataRequest {
    includeAllBlocks?: boolean
    events?: EventReq[]
    calls?: CallReq[]
    evmLogs?: EvmLogReq[]
    ethereumTransactions?: EthereumTransactionReq[]
    contractsEvents?: ContractsEventReq[]
    gearMessagesEnqueued?: GearMessageEnqueuedReq[]
    gearUserMessagesSent?: GearUserMessageSentReq[]
    acalaEvmExecuted?: AcalaEvmExecutedReq[]
    acalaEvmExecutedFailed?: AcalaEvmExecutedFailedReq[]
}


type EventReq = {
    name: string
    data?: EventDataRequest
}


type CallReq = {
    name: string
    data?: CallDataRequest
}


type EvmLogReq = {
    contract: string
    filter?: EvmTopicSet[]
    data?: EventDataRequest
}


type EthereumTransactionReq = {
    contract: string
    sighash?: string
    data?: CallDataRequest
}


type ContractsEventReq = {
    contract: string
    data?: EventDataRequest
}


type GearMessageEnqueuedReq = {
    program: string
    data?: EventDataRequest
}


type GearUserMessageSentReq = {
    program: string
    data?: EventDataRequest
}


type AcalaEvmLogFilter = {
    contract?: string
    filter?: EvmTopicSet[]
}


type AcalaEvmExecutedReq = {
    contract: string
    logs?: AcalaEvmLogFilter[]
    data?: EventDataRequest
}


type AcalaEvmExecutedFailedReq = {
    contract: string
    logs?: AcalaEvmLogFilter[]
    data?: EventDataRequest
}
