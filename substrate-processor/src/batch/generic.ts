import {assertNotNull} from "@subsquid/util-internal"
import {Heap} from "../util/heap"
import {Range, rangeDifference, rangeIntersection} from "../util/range"


export interface Batch<H> {
    range: Range
    handlers: H
}


export function mergeBatches<H>(batches: Batch<H>[], mergeHandlers: (h1: H, h2: H) => H): Batch<H>[] {
    if (batches.length <= 1) return batches

    let union: Batch<H>[] = []
    let heap = new Heap<Batch<H>>((a, b) => a.range.from - b.range.from)

    heap.init(batches.slice())

    let top = assertNotNull(heap.pop())
    let batch: Batch<H> | undefined
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
                handlers: mergeHandlers(top.handlers, batch.handlers)
            })
            top = assertNotNull(heap.pop())
        }
    }
    union.push(top)
    return union
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
