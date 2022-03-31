import {assertNotNull} from "@subsquid/util-internal"
import {EvmContractAddress, EvmLogHandler, EvmTopicSet} from "./interfaces/evm"
import {BlockHandler, CallHandler, EventHandler} from "./interfaces/dataHandlerContext"
import {Hooks} from "./interfaces/hooks"
import {ContextRequest} from "./interfaces/dataSelection"
import {QualifiedName} from "./interfaces/substrate"
import {Heap} from "./util/heap"
import {Range, rangeDifference, rangeIntersection} from "./util/range"


interface AccurateHandlers<H> {
    data?: ContextRequest
    handlers: H[]
}


export interface DataHandlers {
    pre: BlockHandler[]
    post: BlockHandler[]
    events: Record<QualifiedName, AccurateHandlers<EventHandler>>
    calls: Record<QualifiedName, AccurateHandlers<CallHandler>>
    evmLogs: Record<EvmContractAddress, {filter?: EvmTopicSet[], handler: EvmLogHandler}[]>
}


export interface Batch {
    range: Range
    handlers: DataHandlers
}


export function createBatches(hooks: Hooks, blockRange?: Range): Batch[] {
    let batches: Batch[] = []

    function getRange(hook: { range?: Range }): Range | undefined {
        let range: Range | undefined = hook.range || {from: 0}
        if (blockRange) {
            range = rangeIntersection(range, blockRange)
        }
        return range
    }

    hooks.pre.forEach(hook => {
        let range = getRange(hook)
        if (!range) return
        batches.push({
            range,
            handlers: {
                pre: [hook.handler],
                post: [],
                events: {},
                calls: {},
                evmLogs: {}
            }
        })
    })

    hooks.post.forEach(hook => {
        let range = getRange(hook)
        if (!range) return
        batches.push({
            range,
            handlers: {
                pre: [],
                post: [hook.handler],
                events: {},
                calls: {},
                evmLogs: {}
            }
        })
    })

    hooks.event.forEach(hook => {
        let range = getRange(hook)
        if (!range) return
        batches.push({
            range,
            handlers: {
                pre: [],
                post: [],
                events: {
                    [hook.event]: {data: hook.data, handlers: [hook.handler]}
                },
                calls: {},
                evmLogs: {}
            }
        })
    })

    hooks.call.forEach(hook => {
        let range = getRange(hook)
        if (!range) return
        batches.push({
            range,
            handlers: {
                pre: [],
                post: [],
                events: {},
                calls: {
                    [hook.call]: {data: hook.data, handlers: [hook.handler]}
                },
                evmLogs: {}
            }
        })
    })

    hooks.evmLog.forEach(hook => {
        let range = getRange(hook)
        if (!range) return
        batches.push({
            range,
            handlers: {
                pre: [],
                post: [],
                events: {},
                calls: {},
                evmLogs: {
                    [hook.contractAddress]: [{
                        filter: hook.filter,
                        handler: hook.handler
                    }]
                }
            }
        })
    })

    batches = mergeBatches(batches)

    return batches
}


export function mergeBatches(batches: Batch[]): Batch[] {
    if (batches.length <= 1) return batches

    let union: Batch[] = []
    let heap = new Heap<Batch>((a, b) => a.range.from - b.range.from)

    heap.init(batches.slice())

    let top = assertNotNull(heap.pop())
    let batch: Batch | undefined
    while (batch = heap.peek()) {
        let i = rangeIntersection(top.range, batch.range)
        if (i == null) {
            union.push(top)
            top = assertNotNull(heap.pop())
        } else {
            heap.pop()
            rangeDifference(top.range, i).forEach(range => {
                heap.push({range, handlers: top.handlers})
            })
            rangeDifference(batch.range, i).forEach(range => {
                heap.push({range, handlers: batch!.handlers})
            })
            heap.push({
                range: i,
                handlers: mergeDataHandlers(top.handlers, batch.handlers)
            })
            top = assertNotNull(heap.pop())
        }
    }
    union.push(top)
    return union
}


function mergeDataHandlers(a: DataHandlers, b: DataHandlers): DataHandlers {
    return {
        pre: a.pre.concat(b.pre),
        post: a.post.concat(b.post),
        events: mergeMaps(a.events, b.events, mergeAccurateHandlers),
        calls: mergeMaps(a.calls, b.calls, mergeAccurateHandlers),
        evmLogs: mergeMaps(a.evmLogs, b.evmLogs, (ha, hb) => ha.concat(hb)),
    }
}


function mergeAccurateHandlers<H>(
    a: AccurateHandlers<H>,
    b: AccurateHandlers<H>
): AccurateHandlers<H> {
    return {
        data: mergeContextRequests(a.data, b.data),
        handlers: a.handlers.concat(b.handlers)
    }
}


function mergeContextRequests(a?: ContextRequest, b?: ContextRequest): ContextRequest | undefined {
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
        if (a[key] == null) {
            result[key] = b[key]
        }
    }
    return result
}


export function getBlocksCount(batches: {range: Range}[], from: number, to: number): number {
    let count = 0
    for (let i = 0; i < batches.length; i++) {
        let range = batches[i].range
        if (to < range.from) return count
        if (from > (range.to ?? Infinity)) continue
        let beg = Math.max(from, range.from)
        let end = Math.min(to, range.to ?? Infinity)
        count += end - beg + 1
    }
    return count
}
