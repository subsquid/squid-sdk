import {BlockHandler, EventHandler} from "./interfaces/handlerContext"
import {Hooks} from "./interfaces/hooks"
import {QualifiedName} from "./interfaces/substrate"
import {Heap} from "./util/heap"
import {Range, rangeDifference, rangeIntersection} from "./util/range"
import {assertNotNull} from "./util/util"


export interface Batch {
    range: Range
    pre: BlockHandler[]
    post: BlockHandler[]
    events: Record<QualifiedName, EventHandler[]>
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
            events: {}
        })
    })

    hooks.post.forEach(hook => {
        let range = getRange(hook)
        if (!range) return
        batches.push({
            range,
            pre: [],
            post: [hook.handler],
            events: {}
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
        events: mergeHandlers(a.events, b.events)
    }
}


function mergeHandlers<T>(a: Record<string, T[]>, b: Record<string, T[]>): Record<string, T[]> {
    let result: Record<string, T[]> = {}

    function add(col: Record<string, T[]>, key: string): void {
        let list = result[key]
        if (list == null) {
            result[key] = col[key].slice()
        } else {
            list.push(...col[key])
        }
    }

    for (let key in a) {
        add(a, key)
    }
    for (let key in b) {
        add(b, key)
    }
    return result
}
