import {EvmTopicSet} from "../interfaces/dataHandlers"
import {CallDataRequest, EventDataRequest} from "../interfaces/dataSelection"


export interface BatchRequest {
    getIncludeAllBlocks(): boolean
    getEvents(): {name: string, data?: EventDataRequest}[]
    getCalls(): {name: string, data?: CallDataRequest}[]
    getEvmLogs(): {contract: string, filter?: EvmTopicSet[], data?: EventDataRequest}[]
    getContractsEvents(): {contract: string, data?: EventDataRequest}[]
}
