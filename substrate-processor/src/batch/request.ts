import {EvmTopicSet} from "../interfaces/dataHandlers"
import {CallDataRequest, EventDataRequest} from "../interfaces/dataSelection"


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


type EthereumTransactionsReq = {
    contract: string
    data?: CallDataRequest
}


type ContractsEventsReq = {
    contract: string
    data?: EventDataRequest
}


type GearMessagesEnqueuedReq = {
    program: string
    data?: EventDataRequest
}


type GearUserMessagesSentReq = {
    program: string
    data?: EventDataRequest
}


export interface BatchRequest {
    getIncludeAllBlocks(): boolean
    getEvents(): EventReq[]
    getCalls(): CallReq[]
    getEvmLogs(): EvmLogReq[]
    getEthereumTransactions(): EthereumTransactionsReq[]
    getContractsEvents(): ContractsEventsReq[]
    getGearMessagesEnqueued(): GearMessagesEnqueuedReq[]
    getGearUserMessagesSent(): GearUserMessagesSentReq[]
}


export class PlainBatchRequest implements BatchRequest {
    events: EventReq[] = []
    calls: CallReq[] = []
    evmLogs: EvmLogReq[] = []
    ethereumTransactions: EthereumTransactionsReq[] = []
    contractsEvents: ContractsEventsReq[] = []
    gearMessagesEnqueued: GearMessagesEnqueuedReq[] = []
    gearUserMessagesSent: GearUserMessagesSentReq[] = []
    includeAllBlocks = false

    getEvents(): EventReq[] {
        return this.events
    }

    getCalls(): CallReq[] {
        return this.calls
    }

    getEvmLogs(): EvmLogReq[] {
        return this.evmLogs
    }

    getEthereumTransactions(): EthereumTransactionsReq[] {
        return this.ethereumTransactions
    }

    getContractsEvents(): ContractsEventsReq[] {
        return this.contractsEvents
    }

    getGearMessagesEnqueued(): GearMessagesEnqueuedReq[] {
        return this.gearMessagesEnqueued
    }

    getGearUserMessagesSent(): GearUserMessagesSentReq[] {
        return this.gearUserMessagesSent
    }

    getIncludeAllBlocks(): boolean {
        return this.includeAllBlocks
    }

    merge(other: PlainBatchRequest): PlainBatchRequest {
        let result = new PlainBatchRequest()
        result.includeAllBlocks = this.includeAllBlocks || other.includeAllBlocks
        result.events = this.events.concat(other.events)
        result.calls = this.calls.concat(other.calls)
        result.evmLogs = this.evmLogs.concat(other.evmLogs)
        result.ethereumTransactions = this.ethereumTransactions.concat(other.ethereumTransactions)
        result.contractsEvents = this.contractsEvents.concat(other.contractsEvents)
        result.gearMessagesEnqueued = this.gearMessagesEnqueued.concat(other.gearMessagesEnqueued)
        result.gearUserMessagesSent = this.gearUserMessagesSent.concat(other.gearUserMessagesSent)
        return result
    }
}
