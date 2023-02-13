import {assertNotNull} from '@subsquid/util-internal'
import {Heap} from '@subsquid/util-internal-binary-heap'
import {Range, rangeDifference, rangeIntersection} from './range'


export interface BatchRequest<R> {
    range: Range
    request: R
}


export function mergeBatchRequests<R>(requests: BatchRequest<R>[], merge: (r1: R, r2: R) => R): BatchRequest<R>[] {
    if (requests.length <= 1) return requests

    let union: BatchRequest<R>[] = []
    let heap = new Heap<BatchRequest<R>>((a, b) => a.range.from - b.range.from)

    heap.init(requests.slice())

    let top = assertNotNull(heap.pop())
    let req: BatchRequest<R> | undefined
    while (req = heap.peek()) {
        let i = rangeIntersection(top.range, req.range)
        if (i == null) {
            union.push(top)
            top = assertNotNull(heap.pop())
        } else {
            heap.pop()
            rangeDifference(top.range, i).forEach(range => {
                heap.push({range, request: top.request})
            })
            rangeDifference(req.range, i).forEach(range => {
                heap.push({range, request: req!.request})
            })
            heap.push({
                range: i,
                request: merge(top.request, req.request)
            })
            top = assertNotNull(heap.pop())
        }
    }
    union.push(top)
    return union
}


export function applyRangeBound<R>(requests: BatchRequest<R>[], range?: Range): BatchRequest<R>[] {
    if (range == null) return requests
    let result: BatchRequest<R>[] = []
    for (let req of requests) {
        let i = rangeIntersection(range, req.range)
        if (i) {
            result.push({range: i, request: req.request})
        }
    }
    return result
}


export function getBlocksCount(requests: {range: Range}[], from: number, to: number): number {
    let count = 0
    for (let i = 0; i < requests.length; i++) {
        let range = requests[i].range
        if (to < range.from) return count
        if (from > (range.to ?? Infinity)) continue
        let beg = Math.max(from, range.from)
        let end = Math.min(to, range.to ?? Infinity)
        count += end - beg + 1
    }
    return count
}
