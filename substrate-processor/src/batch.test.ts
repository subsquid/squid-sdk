import assert from "assert"
import * as fc from "fast-check"
import {createBatches} from "./batch"
import {QualifiedName} from "./interfaces/substrate"
import {Range, rangeEnd, rangeIntersection} from "./util/range"
import {assertNotNull} from "./util/util"


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


const aEventHook = fc.tuple(aOptionalRange, fc.nat().map(n => n.toString())).map(([range, event]) => {
    return {
        range,
        event,
        handler: {
            range: range == null ? {from: 0} : range,
            event
        }
    }
})


const aHooks = fc.record({
    pre: fc.array(aBlockHook),
    post: fc.array(aBlockHook),
    event: fc.array(aEventHook)
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
                let prePostHooksOk = b.pre.concat(b.post).every(h => {
                    return containsRange(h.range, b.range)
                })
                let eventHandlersOk = Object.entries(b.events).every(([e, handlers]) => {
                    return handlers.every(h => containsRange(h.range, b.range))
                })
                return prePostHooksOk && eventHandlersOk
            })
        })
    })

    it('each event handler is never called for wrong event', function () {
        assertBatch(batches => {
            return batches.every(b => {
                return Object.entries(b.events).every(([e, handlers]) => {
                    return handlers.every(h => h.event === e)
                })
            })
        })
    })

    it('the entire range of each handler is covered', function () {
        fc.assert(fc.property(aHooksWithRange, ([hooks, blockRange]) => {
            let handlers = new Map<{range: Range}, Range | undefined>()

            function add(hook: AEventHook | ABlockHook): void {
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

            let batches = makeBatches(hooks, blockRange)
            batches.forEach(b => {
                function call(h: AEventHandler | ABlockHandler): void {
                    let range = assertNotNull(handlers.get(h))
                    assert(b.range.from == range.from)
                    if (b.range.to != null && b.range.to < rangeEnd(range)) {
                        handlers.set(h, {...range, from: b.range.to + 1})
                    } else {
                        handlers.set(h, undefined)
                    }
                }

                b.pre.forEach(call)
                b.post.forEach(call)
                Object.entries(b.events).forEach(([event, hs]) => {
                    hs.forEach(call)
                })
            })

            return Array.from(handlers.values()).every(r => r == null)
        }), {
            numRuns: 5000
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


export interface ABlockHook {
    range?: Range
    handler: ABlockHandler
}


export interface AEventHook {
    event: QualifiedName
    range?: Range
    handler: AEventHandler
}


export interface AHooks {
    pre: ABlockHook[]
    post: ABlockHook[]
    event: AEventHook[]
}


interface ABatch {
    range: Range,
    pre: ABlockHandler[],
    post: ABlockHandler[],
    events: Record<string, AEventHandler[]>
}
