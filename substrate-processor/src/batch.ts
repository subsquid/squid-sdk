import {assertNotNull} from "@subsquid/util"
import {BlockHandler, EventHandler, ExtrinsicHandler} from "./interfaces/handlerContext"
import {Hooks} from "./interfaces/hooks"
import {QualifiedName} from "./interfaces/substrate"
import {Heap} from "./util/heap"
import {Range, rangeDifference, rangeIntersection} from "./util/range"


export interface Batch {
    range: Range
    pre: BlockHandler[]
    post: BlockHandler[]
    events: Record<QualifiedName, EventHandler[]>
    /**
     * Mapping of type `trigger event` -> `extrinsic` -> `extrinsic handler list`
     */
    extrinsics: Record<QualifiedName, Record<QualifiedName, ExtrinsicHandler[]>>
}


export function createBatches(hooks: Hooks, blockRange?: Range): Batch[] {
    let batches: Batch[] = []

    function getRange(hook: {range?: Range}): Range | undefined {
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
            pre: [hook.handler],
            post: [],
            events: {},
            extrinsics: {}
        })
    })

    hooks.post.forEach(hook => {
        let range = getRange(hook)
        if (!range) return
        batches.push({
            range,
            pre: [],
            post: [hook.handler],
            events: {},
            extrinsics: {}
        })
    })

    hooks.event.forEach(hook => {
        let range = getRange(hook)
        if (!range) return
        batches.push({
            range,
            pre: [],
            post: [],
            events: {
                [hook.event]: [hook.handler]
            },
            extrinsics: {}
        })
    })

    hooks.extrinsic.forEach(hook => {
        let range = getRange(hook)
        if (!range) return
        batches.push({
            range,
            pre: [],
            post: [],
            events: {},
            extrinsics: {
                [hook.event]: {[hook.extrinsic]: [hook.handler]}
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
                heap.push({...top, range})
            })
            rangeDifference(batch.range, i).forEach(range => {
                heap.push({...batch!, range})
            })
            heap.push(mergeBatchHandlers(top, batch, i))
            top = assertNotNull(heap.pop())
        }
    }
    union.push(top)
    return union
}


function mergeBatchHandlers(a: Batch, b: Batch, range: Range): Batch {
    return {
        range,
        pre: a.pre.concat(b.pre),
        post: a.post.concat(b.post),
        events: mergeMaps(a.events, b.events, (ha, hb) => ha.concat(hb)),
        extrinsics: mergeMaps(a.extrinsics, b.extrinsics, (ea, eb) => {
            return mergeMaps(ea, eb, (ha, hb) => ha.concat(hb))
        })
    }
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
        if (result[key] == null) {
            result[key] = b[key]
        }
    }
    return result
}
