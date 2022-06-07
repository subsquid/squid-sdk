import type {
    BlockHandler,
    CallHandler,
    ContractsContractEmittedHandler,
    EventHandler,
    EvmLogHandler,
    EvmTopicSet
} from "../interfaces/dataHandlers"
import type {CallDataRequest, EventDataRequest} from "../interfaces/dataSelection"
import type {QualifiedName} from "../interfaces/substrate"


type ContractAddress = string


interface HandlerList<H, R = any> {
    data?: R
    handlers: H[]
}


export interface DataHandlers {
    pre: BlockHandler<any>[]
    post: BlockHandler<any>[]
    events: Record<QualifiedName, HandlerList<EventHandler<any>, EventDataRequest>>
    calls: Record<QualifiedName, HandlerList<CallHandler<any>, CallDataRequest>>
    evmLogs: Record<ContractAddress, {filter?: EvmTopicSet[], data?: EventDataRequest, handler: EvmLogHandler<any>}[]>
    contractsContractEmitted: Record<ContractAddress, HandlerList<ContractsContractEmittedHandler<any>>>
}


export function mergeDataHandlers(a: DataHandlers, b: DataHandlers): DataHandlers {
    return {
        pre: a.pre.concat(b.pre),
        post: a.post.concat(b.post),
        events: mergeMaps(a.events, b.events, mergeHandlerLists),
        calls: mergeMaps(a.calls, b.calls, mergeHandlerLists),
        evmLogs: mergeMaps(a.evmLogs, b.evmLogs, (ha, hb) => ha.concat(hb)),
        contractsContractEmitted: mergeMaps(a.contractsContractEmitted, b.contractsContractEmitted, mergeHandlerLists)
    }
}


export function mergeHandlerLists<H>(
    a: HandlerList<H>,
    b: HandlerList<H>
): HandlerList<H> {
    return {
        data: mergeContextRequests(a.data, b.data),
        handlers: a.handlers.concat(b.handlers)
    }
}


export function mergeContextRequests(a?: any, b?: any): any | undefined {
    if (a == null || b == null) return undefined

    function merge(fa: any, fb: any): any {
        if (fa === true || fb === true) return true
        if (!fa) return fb
        if (!fb) return fa
        return mergeMaps(fa, fb, merge)
    }

    return mergeMaps(a, b, merge)
}


function mergeMaps<T>(a: Record<string, T>, b: Record<string, T>, mergeItems: (a: T, b: T) => T): Record<string, T> {
    let result: Record<string, T> = {}
    for (let key in a) {
        if (b[key] == null) {
            result[key] = a[key]
        } else {
            result[key] = mergeItems(a[key], b[key])
        }
    }
    for (let key in b) {
        if (a?.[key] == null) {
            result[key] = b[key]
        }
    }
    return result
}
