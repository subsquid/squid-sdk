import type {
    BlockHandler,
    BlockHandlerDataRequest,
    CallHandler,
    ContractsContractEmittedHandler,
    EventHandler,
    EvmLogHandler,
    EvmTopicSet,
    GearMessageEnqueuedHandler,
    GearUserMessageSentHandler
} from '../interfaces/dataHandlers'
import type {CallDataRequest, EventDataRequest} from '../interfaces/dataSelection'
import type {QualifiedName} from '../interfaces/substrate'
import type {BatchRequest} from './request'


type ContractAddress = string
type ProgramId = string
type Sighash = string


interface HandlerList<H, R = any> {
    handlers: H[]
    data?: R
}


export interface CallHandlerEntry {
    handler: CallHandler<any>
    triggerForFailedCalls?: boolean
}


export class DataHandlers implements BatchRequest {
    pre: HandlerList<BlockHandler<any>, BlockHandlerDataRequest> = {handlers: [], data: {includeAllBlocks: false}}
    post: HandlerList<BlockHandler<any>, BlockHandlerDataRequest> = {handlers: [], data: {includeAllBlocks: false}}
    events: Record<QualifiedName, HandlerList<EventHandler<any>, EventDataRequest>> = {}
    calls: Record<QualifiedName, HandlerList<CallHandlerEntry, CallDataRequest>> = {}
    evmLogs: Record<ContractAddress, {filter?: EvmTopicSet[], data?: EventDataRequest, handler: EvmLogHandler<any>}[]> = {}
    ethereumTransactions: Record<ContractAddress, Record<Sighash, HandlerList<CallHandlerEntry, CallDataRequest>>> = {}
    contractsContractEmitted: Record<ContractAddress, HandlerList<ContractsContractEmittedHandler<any>>> = {}
    gearMessageEnqueued: Record<ProgramId, HandlerList<GearMessageEnqueuedHandler<any>>> = {}
    gearUserMessageSent: Record<ProgramId, HandlerList<GearUserMessageSentHandler<any>>> = {}

    merge(other: DataHandlers): DataHandlers {
        let res = new DataHandlers()
        res.pre = mergeBlockHandlerLists(this.pre, other.pre)
        res.post = mergeBlockHandlerLists(this.post, other.post)
        res.events = mergeMaps(this.events, other.events, mergeItemHandlerLists)
        res.calls = mergeMaps(this.calls, other.calls, mergeItemHandlerLists)
        res.evmLogs = mergeMaps(this.evmLogs, other.evmLogs, (ha, hb) => ha.concat(hb))
        res.ethereumTransactions = mergeMaps(this.ethereumTransactions, other.ethereumTransactions, (a, b) => mergeMaps(a, b, mergeItemHandlerLists))
        res.contractsContractEmitted = mergeMaps(this.contractsContractEmitted, other.contractsContractEmitted, mergeItemHandlerLists)
        res.gearMessageEnqueued = mergeMaps(this.gearMessageEnqueued, other.gearMessageEnqueued, mergeItemHandlerLists)
        res.gearUserMessageSent = mergeMaps(this.gearUserMessageSent, other.gearUserMessageSent, mergeItemHandlerLists)
        return res
    }

    getIncludeAllBlocks(): boolean {
        return includeAllBlocks(this.pre) || includeAllBlocks(this.post)
    }

    getEvents() {
        let all: Record<string, EventDataRequest | true> = {}

        function add(name: string, data: EventDataRequest | true): void {
            let current = all[name]
            if (current) {
                all[name] = mergeRequests(current as any, data as any || true)
            } else {
                all[name] = data
            }
        }

        Object.entries(this.events).forEach(([name, hs]) => {
            if (hs.handlers.length > 0) {
                add(name, hs.data || true)
            }
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

        if (this.pre.handlers.length > 0) {
            addBlock(this.pre.data)
        }

        if (this.post.handlers.length > 0) {
            addBlock(this.post.data)
        }

        return Object.entries(all).map(([name, data]) => {
            return {
                name,
                data: data === true ? undefined : data
            }
        })
    }

    getCalls() {
        let all: Record<string, CallDataRequest | true>  = {}

        function add(name: string, data: CallDataRequest | true): void {
            let current = all[name]
            if (current) {
                all[name] = mergeRequests(current as any, data as any || true)
            } else {
                all[name] = data
            }
        }

        Object.entries(this.calls).forEach(([name, hs]) => {
            if (hs.handlers.length > 0) {
                add(name, hs.data || true)
            }
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

        if (this.pre.handlers.length > 0) {
            addBlock(this.pre.data)
        }

        if (this.post.handlers.length > 0) {
            addBlock(this.post.data)
        }

        return Object.entries(all).map(([name, data]) => {
            return {
                name,
                data: data === true ? undefined : data
            }
        })
    }

    getEvmLogs() {
        return Object.entries(this.evmLogs).flatMap(([contract, hs]) => {
            return hs.map(h => {
                return {
                    contract,
                    filter: h.filter,
                    data: h.data
                }
            })
        })
    }

    getEthereumTransactions() {
        return Object.entries(this.ethereumTransactions).flatMap(([contract, sighashMap]) => {
            return Object.entries(sighashMap).map(([sighash, {data}]) => {
                return {
                    contract,
                    sighash: sighash == '*' ? undefined : sighash,
                    data
                }
            })
        })
    }

    getContractsEvents() {
        return Object.entries(this.contractsContractEmitted).map(([contract, {data}]) => {
            return {
                contract,
                data
            }
        })
    }

    getGearMessagesEnqueued() {
        return Object.entries(this.gearMessageEnqueued).map(([program, {data}]) => {
            return {
                program,
                data
            }
        })
    }

    getGearUserMessagesSent() {
        return Object.entries(this.gearUserMessageSent).map(([program, {data}]) => {
            return {
                program,
                data
            }
        })
    }

    getAcalaEvmExecuted() {
        return []
    }

    getAcalaEvmExecutedFailed() {
        return []
    }
}


function mergeBlockHandlerLists(
    a: HandlerList<BlockHandler<any>, BlockHandlerDataRequest>,
    b: HandlerList<BlockHandler<any>, BlockHandlerDataRequest>
): HandlerList<BlockHandler<any>, BlockHandlerDataRequest> {
    if (a.handlers.length == 0) return b
    if (b.handlers.length == 0) return a

    let includeAllBlocks =
        a.data == null ||
        b.data == null ||
        !!a.data.includeAllBlocks ||
        !!b.data.includeAllBlocks

    return {
        data: {
            includeAllBlocks,
            items: mergeRequests(a.data?.items as any, b.data?.items as any)
        },
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


function includeAllBlocks(hs: DataHandlers['pre']): boolean {
    if (hs.handlers.length == 0) return false
    return hs.data == null || !!hs.data.includeAllBlocks
}
