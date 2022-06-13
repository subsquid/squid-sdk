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


type ContractsEventsReq = {
    contract: string
    data?: EventDataRequest
}


export interface BatchRequest {
    getIncludeAllBlocks(): boolean
    getEvents(): EventReq[]
    getCalls(): CallReq[]
    getEvmLogs(): EvmLogReq[]
    getContractsEvents(): ContractsEventsReq[]
}


export class PlainBatchRequest implements BatchRequest {
    events: EventReq[] = []
    calls: CallReq[] = []
    evmLogs: EvmLogReq[] = []
    contractsEvents: ContractsEventsReq[] = []
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

    getContractsEvents(): ContractsEventsReq[] {
        return this.contractsEvents
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
        result.contractsEvents = this.contractsEvents.concat(other.contractsEvents)
        return result
    }
}
