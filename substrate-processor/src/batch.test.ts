import {assertNotNull} from "@subsquid/util"
import assert from "assert"
import * as fc from "fast-check"
import {createBatches} from "./batch"
import {EvmTopicSet} from "./interfaces/evm"
import {Range, rangeEnd, rangeIntersection} from "./util/range"


const aClosedRange = fc.tuple(fc.nat(), fc.nat()).map(([a, b]) => {
    if (a < b) {
        return {from: a, to: b}
    } else {
        return {from: b, to: a}
    }
})


const aOpenRange = fc.nat().map(a => ({from: a}))


const aPointRange = fc.nat().map(a => ({from: a, to: a}))


const aRange = fc.oneof(aClosedRange, aOpenRange, aPointRange)


const aOptionalRange = fc.option(aRange, {freq: 10, nil: undefined})


const aBlockHook = aOptionalRange.map(range => {
    return {
        range,
        handler: {
            range: range == null ? {from: 0} : range
        }
    }
})


const aEventName = fc.nat({max: 10}).map(n => 'e' + n)


const aEventHook = fc.tuple(aOptionalRange, aEventName).map(([range, event]) => {
    return {
        range,
        event,
        handler: {
            range: range == null ? {from: 0} : range,
            event
        }
    }
})


const aContractAddress = fc.nat({max: 10}).map(n => 'a' + n)
const aEvmLogHook = fc.tuple(aOptionalRange, aContractAddress).map(([range, aContractAddress]) => {
    return {
        range,
        contractAddress: aContractAddress,
        handler: {
            range: range == null ? {from: 0} : range,
            contractAddress: aContractAddress
        }
    }
})



const aCallName = fc.nat({max: 10}).map(n => 'c' + n)


const aExtrinsicHook = fc.tuple(aOptionalRange, aCallName, aEventName).map(([range, extrinsic, event]) => {
    return {
        range,
        extrinsic,
        event,
        handler: {
            range: range == null ? {from: 0} : range,
            event,
            extrinsic
        }
    }
})


const aHooks = fc.record<AHooks>({
    pre: fc.array(aBlockHook),
    post: fc.array(aBlockHook),
    event: fc.array(aEventHook),
    extrinsic: fc.array(aExtrinsicHook),
    evmLog: fc.array(aEvmLogHook)
})


const aHooksWithRange = fc.tuple(aHooks, fc.option(aRange, {freq: 2, nil: undefined}))


function makeBatches(hooks: AHooks, range?: Range): ABatch[] {
    return createBatches(hooks as any, range) as any
}


function assertBatch(test: (batches: ABatch[]) => void | boolean, params?: fc.Parameters<unknown>): void {
    fc.assert(fc.property(aHooksWithRange, ([hooks, range]) => {
        let batches = makeBatches(hooks, range)
        return test(batches)
    }), params)
}


describe('batching', function () {
    it('ranges are well formed', function () {
        assertBatch(batches => {
            return batches.every(b => {
                let {from, to} = b.range
                return from >= 0 && (to == null || from <= to)
            })
        })
    })

    it('ranges are properly sorted and do not intersect', function () {
        assertBatch(batches => {
            for (let i = 1; i < batches.length; i++) {
                let current = batches[i].range
                let prev = batches[i-1].range
                if (rangeEnd(prev) >= current.from) return false
            }
        })
    })

    it('each handler is never called outside of its range', function () {
        assertBatch(batches => {
            return batches.every(b => {
                let hs = b.handlers
                let prePostHooksOk = hs.pre.concat(hs.post).every(h => {
                    return containsRange(h.range, b.range)
                })
                let eventHandlersOk = Object.entries(hs.events).every(([_, handlers]) => {
                    return handlers.every(h => containsRange(h.range, b.range))
                })
                let extrinsicHandlersOk = Object.entries(hs.extrinsics).every(e => {
                    return Object.entries(e[1]).every(([_, handlers]) => {
                        return handlers.every(h => containsRange(h.range, b.range))
                    })
                })
                let evmLogHandlersOk = Object.entries(hs.evmLogs).every(([_, handlers]) => {
                    return handlers.every(h => containsRange(h.handler.range, b.range))
                })
                return prePostHooksOk && eventHandlersOk && extrinsicHandlersOk && evmLogHandlersOk
            })
        })
    })

    it('event handler is never called for wrong event', function () {
        assertBatch(batches => {
            return batches.every(b => {
                return Object.entries(b.handlers.events).every(([e, handlers]) => {
                    return handlers.every(h => h.event === e)
                })
            })
        })
    })

    it('evm log handler is never called for wrong contract address', function () {
        assertBatch(batches => {
            return batches.every(b => {
                return Object.entries(b.handlers.evmLogs).every(([contract, handlers]) => {
                    return handlers.every(h => h.handler.contractAddress === contract)
                })
            })
        })
    })

    it('extrinsic handler is never called for wrong extrinsic', function () {
        assertBatch(batches => {
            return batches.every(b => {
                return Object.entries(b.handlers.extrinsics).every(([event, extrinsics]) => {
                    return Object.entries(extrinsics).every(([extrinsic, handlers]) => {
                        return handlers.every(h => h.event === event && h.extrinsic === extrinsic)
                    })
                })
            })
        })
    })

    it('the entire range of each handler is covered', function () {
        fc.assert(fc.property(aHooksWithRange, ([hooks, blockRange]) => {
            let handlers = new Map<{range: Range}, Range | undefined>()

            function add(hook: AEventHook | ABlockHook | AExtrinsicHook | AEvmLogHook): void {
                let range = hook.handler.range
                if (blockRange) {
                    let i = rangeIntersection(blockRange, range)
                    if (i) {
                        range = i
                    } else {
                        return
                    }
                }
                handlers.set(hook.handler, range)
            }

            hooks.pre.forEach(add)
            hooks.post.forEach(add)
            hooks.event.forEach(add)
            hooks.extrinsic.forEach(add)
            hooks.evmLog.forEach(add)

            let batches = makeBatches(hooks, blockRange)
            batches.forEach(b => {
                function call(h: AEventHandler | ABlockHandler | AExtrinsicHandler | AEvmLogHandler): void {
                    let range = assertNotNull(handlers.get(h))
                    assert(b.range.from == range.from)
                    if (b.range.to != null && b.range.to < rangeEnd(range)) {
                        handlers.set(h, {...range, from: b.range.to + 1})
                    } else {
                        handlers.set(h, undefined)
                    }
                }

                b.handlers.pre.forEach(call)
                b.handlers.post.forEach(call)
                Object.entries(b.handlers.events).forEach(([event, hs]) => {
                    hs.forEach(call)
                })
                Object.entries(b.handlers.extrinsics).forEach(([event, extrinsics]) => {
                    Object.entries(extrinsics).forEach(([ex, hs]) => {
                        hs.forEach(call)
                    })
                })
                Object.entries(b.handlers.evmLogs).forEach(([contractAddress, hs]) => {
                   hs.forEach(h => call(h.handler))
                })
            })

            return Array.from(handlers.values()).every(r => r == null)
        }), {
            numRuns: 2000
        })
    })
})


function containsRange(a: Range, b: Range): boolean {
    return a.from <= b.from && (a.to == null || a.to >= (b.to ?? Infinity))
}


interface ABlockHandler {
    range: Range
}


interface AEventHandler {
    range: Range
    event: string
}

interface AEvmLogHandler {
    range: Range
    contractAddress: string
}


interface AExtrinsicHandler {
    range: Range
    event: string
    extrinsic: string
}


export interface ABlockHook {
    handler: ABlockHandler
    range?: Range
}


interface AEventHook {
    handler: AEventHandler
    event: string
    range?: Range
}


interface AExtrinsicHook {
    handler: AExtrinsicHandler
    event: string
    extrinsic: string
    range?: Range
}

interface AEvmLogHook {
    handler: AEvmLogHandler
    contractAddress: string
    range?: Range
}


export interface AHooks {
    pre: ABlockHook[]
    post: ABlockHook[]
    event: AEventHook[]
    extrinsic: AExtrinsicHook[]
    evmLog: AEvmLogHook[]
}


interface ABatch {
    range: Range,
    handlers: {
        pre: ABlockHandler[],
        post: ABlockHandler[],
        events: Record<string, AEventHandler[]>
        extrinsics: Record<string, Record<string, AExtrinsicHandler[]>>
        evmLogs: Record<string, {filter: EvmTopicSet[], handler: AEvmLogHandler}[]>
    }
}
