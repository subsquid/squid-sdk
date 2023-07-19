import {assertNotNull, splitSlice} from '@subsquid/util-internal'
import {Heap} from '@subsquid/util-internal-binary-heap'
import assert from 'assert'
import {FiniteRange, Range, RangeList, RangeRequest, RangeRequestList} from './interfaces'


export function assertRange(range: Range): void {
    assert(Number.isSafeInteger(range.from))
    assert(range.to == null || Number.isSafeInteger(range.to))
    assert(range.from >= 0)
    assert(range.from <= rangeEnd(range))
}


export function rangeEnd(range: Range): number {
    return range.to ?? Infinity
}


export function rangeContains(big: Range, small: Range): boolean {
    return big.from <= small.from && rangeEnd(big) >= rangeEnd(small)
}


export function rangeIntersection(a: Range, b: Range): Range | undefined {
    let beg = Math.max(a.from, b.from)
    let end = Math.min(rangeEnd(a), rangeEnd(b))
    if (beg > end) return undefined
    if (end === Infinity) {
        return {from: beg}
    } else {
        return {from: beg, to: end}
    }
}


export function rangeDifference(a: Range, b: Range): Range[] {
    let i = rangeIntersection(a, b)
    if (i == null) return [a]
    let result: Range[] = []
    if (a.from < i.from) {
        result.push({from: a.from, to: i.from - 1})
    }
    if (i.to != null && i.to < rangeEnd(a)) {
        let from = i.to + 1
        if (a.to) {
            result.push({from, to: a.to})
        } else {
            result.push({from})
        }
    }
    return result
}


export function *splitRange(maxSize: number, range: Range): Iterable<FiniteRange> {
    for (let [beg, end] of splitSlice(maxSize, range.from, range.to == null ? undefined : range.to + 1)) {
        yield {
            from: beg,
            to: end - 1
        }
    }
}


export function assertRangeList(ranges: RangeList): void {
    if (ranges.length == 0) return
    assertRange(ranges[0])
    for (let i = 1; i < ranges.length; i++) {
        assertRange(ranges[i])
        assert(ranges[i].from > rangeEnd(ranges[i-1]))
    }
}


export function getSize(ranges: RangeList, boundary: FiniteRange): number {
    let size = 0
    for (let range of ranges) {
        if (boundary.to < range.from) return size
        if (boundary.from > rangeEnd(range)) continue
        let beg = Math.max(boundary.from, range.from)
        let end = Math.min(boundary.to, rangeEnd(range))
        size += end - beg + 1
    }
    return size
}


export function mergeRangeRequests<R>(requests: RangeRequest<R>[], merge: (r1: R, r2: R) => R): RangeRequestList<R> {
    if (requests.length <= 1) return requests

    let union: RangeRequest<R>[] = []
    let heap = new Heap<RangeRequest<R>>((a, b) => a.range.from - b.range.from)

    heap.init(requests.slice())

    let top = heap.pop()!
    let req: RangeRequest<R> | undefined
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


export function applyRangeBound<R>(requests: RangeRequestList<R>, range?: Range): RangeRequestList<R> {
    if (range == null) return requests
    let result: RangeRequest<R>[] = []
    for (let req of requests) {
        let i = rangeIntersection(range, req.range)
        if (i) {
            result.push({range: i, request: req.request})
        }
    }
    return result
}


export function printRange(range?: Range): string {
    if (range?.to != null) {
        return `[${range.from}, ${range.to}]`
    } else {
        return `[${range?.from ?? 0})`
    }
}
