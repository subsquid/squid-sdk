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


type EvmExecutedReq = {
    contract: string
    filter?: EvmTopicSet[]
    data?: EventDataRequest
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
    getEvmExecuted(): EvmExecutedReq[]
    getContractsEvents(): ContractsEventsReq[]
    getGearMessagesEnqueued(): GearMessagesEnqueuedReq[]
    getGearUserMessagesSent(): GearUserMessagesSentReq[]
}


export class PlainBatchRequest implements BatchRequest {
    events: EventReq[] = []
    calls: CallReq[] = []
    evmLogs: EvmLogReq[] = []
    evmExecuted: EvmExecutedReq[] = []
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

    getEvmExecuted(): EvmExecutedReq[] {
        return this.evmExecuted
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
        result.evmExecuted = this.evmExecuted.concat(other.evmExecuted)
        result.contractsEvents = this.contractsEvents.concat(other.contractsEvents)
        result.gearMessagesEnqueued = this.gearMessagesEnqueued.concat(other.gearMessagesEnqueued)
        result.gearUserMessagesSent = this.gearUserMessagesSent.concat(other.gearUserMessagesSent)
        return result
    }
}
