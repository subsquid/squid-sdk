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


type GearMessagesEnqueuedReq = {
    program: string
    data?: EventDataRequest
}


type GearUserMessagesSentReq = {
    program: string
    data?: EventDataRequest
}


type AcalaEvmExecutedReq = {
    contract: string
    filter?: EvmTopicSet[]
    data?: EventDataRequest
}


type AcalaEvmCallReq = {
    contract: string
    sighash?: string
    data?: CallDataRequest
}


type AcalaEvmEthCallReq = {
    contract: string
    sighash?: string
    data?: CallDataRequest
}


export interface BatchRequest {
    getIncludeAllBlocks(): boolean
    getEvents(): EventReq[]
    getCalls(): CallReq[]
    getEvmLogs(): EvmLogReq[]
    getContractsEvents(): ContractsEventsReq[]
    getGearMessagesEnqueued(): GearMessagesEnqueuedReq[]
    getGearUserMessagesSent(): GearUserMessagesSentReq[]
    getAcalaEvmExecuted(): AcalaEvmExecutedReq[]
    getAcalaEvmCall(): AcalaEvmCallReq[]
    getAcalaEvmEthCall(): AcalaEvmEthCallReq[]
}


export class PlainBatchRequest implements BatchRequest {
    events: EventReq[] = []
    calls: CallReq[] = []
    evmLogs: EvmLogReq[] = []
    contractsEvents: ContractsEventsReq[] = []
    gearMessagesEnqueued: GearMessagesEnqueuedReq[] = []
    gearUserMessagesSent: GearUserMessagesSentReq[] = []
    acalaEvmExecuted: AcalaEvmExecutedReq[] = []
    acalaEvmCall: AcalaEvmCallReq[] = []
    acalaEvmEthCall: AcalaEvmEthCallReq[] = []
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

    getGearMessagesEnqueued(): GearMessagesEnqueuedReq[] {
        return this.gearMessagesEnqueued
    }

    getGearUserMessagesSent(): GearUserMessagesSentReq[] {
        return this.gearUserMessagesSent
    }

    getIncludeAllBlocks(): boolean {
        return this.includeAllBlocks
    }

    getAcalaEvmExecuted(): AcalaEvmExecutedReq[] {
        return this.acalaEvmExecuted
    }

    getAcalaEvmCall(): AcalaEvmCallReq[] {
        return this.acalaEvmCall
    }

    getAcalaEvmEthCall(): AcalaEvmEthCallReq[] {
        return this.acalaEvmEthCall
    }

    merge(other: PlainBatchRequest): PlainBatchRequest {
        let result = new PlainBatchRequest()
        result.includeAllBlocks = this.includeAllBlocks || other.includeAllBlocks
        result.events = this.events.concat(other.events)
        result.calls = this.calls.concat(other.calls)
        result.evmLogs = this.evmLogs.concat(other.evmLogs)
        result.contractsEvents = this.contractsEvents.concat(other.contractsEvents)
        result.gearMessagesEnqueued = this.gearMessagesEnqueued.concat(other.gearMessagesEnqueued)
        result.gearUserMessagesSent = this.gearUserMessagesSent.concat(other.gearUserMessagesSent)
        result.acalaEvmExecuted = this.acalaEvmExecuted.concat(other.acalaEvmExecuted)
        result.acalaEvmCall = this.acalaEvmCall.concat(other.acalaEvmCall)
        result.acalaEvmEthCall = this.acalaEvmEthCall.concat(other.acalaEvmEthCall)
        return result
    }
}
