import {assertNotNull} from '@subsquid/util-internal'
import {Heap} from '@subsquid/util-internal-binary-heap'
import {Range, rangeDifference, rangeIntersection} from '../util/range'

export interface Batch<R> {
    range: Range
    request: R
}

export function mergeBatches<R>(batches: Batch<R>[], mergeRequests: (r1: R, r2: R) => R): Batch<R>[] {
    if (batches.length <= 1) return batches

    let union: Batch<R>[] = []
    let heap = new Heap<Batch<R>>((a, b) => a.range.from - b.range.from)

    heap.init(batches.slice())

    let top = assertNotNull(heap.pop())
    let batch: Batch<R> | undefined
    while ((batch = heap.peek())) {
        let i = rangeIntersection(top.range, batch.range)
        if (i == null) {
            union.push(top)
            top = assertNotNull(heap.pop())
        } else {
            heap.pop()
            rangeDifference(top.range, i).forEach((range) => {
                heap.push({range, request: top.request})
            })
            rangeDifference(batch.range, i).forEach((range) => {
                heap.push({range, request: batch!.request})
            })
            heap.push({
                range: i,
                request: mergeRequests(top.request, batch.request),
            })
            top = assertNotNull(heap.pop())
        }
    }
    union.push(top)
    return union
}

export function applyRangeBound<R>(batches: Batch<R>[], range?: Range): Batch<R>[] {
    if (range == null) return batches
    let result: Batch<R>[] = []
    for (let b of batches) {
        let i = rangeIntersection(range, b.range)
        if (i) {
            result.push({range: i, request: b.request})
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
