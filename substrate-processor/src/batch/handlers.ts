import type {
    BlockHandlerDataRequest,
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
    pre: HandlerList<BlockHandler<any>, BlockHandlerDataRequest>
    post: HandlerList<BlockHandler<any>, BlockHandlerDataRequest>
    events: Record<QualifiedName, HandlerList<EventHandler<any>, EventDataRequest>>
    calls: Record<QualifiedName, HandlerList<CallHandler<any>, CallDataRequest>>
    evmLogs: Record<ContractAddress, {filter?: EvmTopicSet[], data?: EventDataRequest, handler: EvmLogHandler<any>}[]>
    contractsContractEmitted: Record<ContractAddress, HandlerList<ContractsContractEmittedHandler<any>>>
}


export function mergeDataHandlers(a: DataHandlers, b: DataHandlers): DataHandlers {
    return {
        pre: mergeBlockHandlerLists(a.pre, b.pre),
        post: mergeBlockHandlerLists(a.post, b.post),
        events: mergeMaps(a.events, b.events, mergeItemHandlerLists),
        calls: mergeMaps(a.calls, b.calls, mergeItemHandlerLists),
        evmLogs: mergeMaps(a.evmLogs, b.evmLogs, (ha, hb) => ha.concat(hb)),
        contractsContractEmitted: mergeMaps(a.contractsContractEmitted, b.contractsContractEmitted, mergeItemHandlerLists)
    }
}


function mergeBlockHandlerLists(
    a: HandlerList<BlockHandler<any>, BlockHandlerDataRequest>,
    b: HandlerList<BlockHandler<any>, BlockHandlerDataRequest>
): HandlerList<BlockHandler<any>, BlockHandlerDataRequest> {
    let includeAllBlocks =
        a.data == null ||
        b.data == null ||
        !!a.data.includeAllBlocks ||
        !!b.data.includeAllBlocks
    return {
        data: {includeAllBlocks, items: mergeRequests(a.data?.items as any, b.data?.items as any)},
        handlers: a.handlers.concat(b.handlers)
    }
}


function mergeItemHandlerLists<H>(
    a: HandlerList<H>,
    b: HandlerList<H>
): HandlerList<H> {
    return {
        data: a.data == null || b.data == null ? undefined : mergeRequests(a.data, b.data),
        handlers: a.handlers.concat(b.handlers)
    }
}


type Req = boolean | Partial<{[name: string]: Req}>


function mergeRequests(a?: Req, b?: Req): any {
    if (a === true || b === true) return true
    if (!a) return b
    if (!b) return a
    return mergeMaps(a, b, mergeRequests)
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
        if (!(key in a)) {
            result[key] = b[key]
        }
    }
    return result
}


export function getEvents(handlers: DataHandlers): Record<string, EventDataRequest | true> {
    let all: Record<string, EventDataRequest | true> = {}

    function add(name: string, data: EventDataRequest | true): void {
        let current = all[name]
        if (current) {
            all[name] = mergeRequests(current as any, data as any || true)
        } else {
            all[name] = data
        }
    }

    Object.entries(handlers.events).forEach(([name, hs]) => {
        add(name, hs.data || true)
    })

    function addBlock(req?: BlockHandlerDataRequest): void {
        if (!req) return
        if (req === true || req.items === true) return add('*', true)
        if (!req.items || !req.items.events) return
        if (req.items.events === true) return add('*', true)
        for (let name in req.items.events) {
            let r = req.items.events[name]
            if (r) {
                add(name, r)
            }
        }
    }

    if (handlers.pre.handlers.length > 0) {
        addBlock(handlers.pre.data)
    }

    if (handlers.post.handlers.length > 0) {
        addBlock(handlers.post.data)
    }

    return all
}


export function getCalls(handlers: DataHandlers): Record<string, CallDataRequest | true> {
    let all: Record<string, CallDataRequest | true>  = {}

    function add(name: string, data: CallDataRequest | true): void {
        let current = all[name]
        if (current) {
            all[name] = mergeRequests(current as any, data as any || true)
        } else {
            all[name] = data
        }
    }

    Object.entries(handlers.calls).forEach(([name, hs]) => {
        add(name, hs.data || true)
    })

    function addBlock(req?: BlockHandlerDataRequest): void {
        if (!req) return
        if (req === true || req.items === true) return add('*', true)
        if (!req.items || !req.items.calls) return
        if (req.items.calls === true) return add('*', true)
        for (let name in req.items.calls) {
            let r = req.items.calls[name]
            if (r) {
                add(name, r)
            }
        }
    }

    if (handlers.pre.handlers.length > 0) {
        addBlock(handlers.pre.data)
    }

    if (handlers.post.handlers.length > 0) {
        addBlock(handlers.post.data)
    }

    return all
}


export function shallFetchAllBlocks(handlers: DataHandlers): boolean {
    return _allBlocks(handlers.pre) || _allBlocks(handlers.post)
}


function _allBlocks(hs: DataHandlers['pre']): boolean {
    if (hs.handlers.length == 0) return false
    return hs.data == null || !!hs.data.includeAllBlocks
}
