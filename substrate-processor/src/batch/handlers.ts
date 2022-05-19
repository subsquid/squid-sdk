import {BlockHandler, CallHandler, EventHandler} from "../interfaces/dataHandlerContext"
import {ContextRequest} from "../interfaces/dataSelection"
import {EvmContractAddress, EvmLogDataRequest, EvmLogHandler, EvmTopicSet} from "../interfaces/evm"
import {ContractAddress, ContractsEventHandler} from "../interfaces/contracts"
import {QualifiedName} from "../interfaces/substrate"


interface HandlerList<H> {
    data?: ContextRequest
    handlers: H[]
}


export interface DataHandlers {
    pre: BlockHandler<any>[]
    post: BlockHandler<any>[]
    events: Record<QualifiedName, HandlerList<EventHandler<any>>>
    calls: Record<QualifiedName, HandlerList<CallHandler<any>>>
    evmLogs: Record<EvmContractAddress, {filter?: EvmTopicSet[], data?: EvmLogDataRequest, handler: EvmLogHandler<any>}[]>
    contractsEvents: Record<ContractAddress, HandlerList<ContractsEventHandler<any>>>
}


export function mergeDataHandlers(a: DataHandlers, b: DataHandlers): DataHandlers {
    return {
        pre: a.pre.concat(b.pre),
        post: a.post.concat(b.post),
        events: mergeMaps(a.events, b.events, mergeHandlerLists),
        calls: mergeMaps(a.calls, b.calls, mergeHandlerLists),
        evmLogs: mergeMaps(a.evmLogs, b.evmLogs, (ha, hb) => ha.concat(hb)),
        contractsEvents: mergeMaps(a.contractsEvents, b.contractsEvents, mergeHandlerLists)
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


export function mergeContextRequests(a?: ContextRequest, b?: ContextRequest): ContextRequest | undefined {
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
