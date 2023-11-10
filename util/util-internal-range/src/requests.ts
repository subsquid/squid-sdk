import {assertNotNull} from '@subsquid/util-internal'
import assert from 'assert'
import {FiniteRange, Range, RangeRequest} from './interfaces'
import {applyRangeBound} from './util'


export function getRequestAt<R>(requests: RangeRequest<R>[], height: number): R | undefined {
    for (let req of requests) {
        let from = req.range.from
        let to = req.range.to ?? Infinity
        if (from <= height && height <= to) return req.request
    }
}


export function hasRequestsAfter(requests: RangeRequest<unknown>[], height: number): boolean {
    for (let req of requests) {
        let to = req.range.to ?? Infinity
        if (height < to) return true
    }
    return false
}


export function *splitBlocksByRequest<R, B>(
    requests: RangeRequest<R>[],
    blocks: B[],
    getBlockHeight: (b: B) => number
): Iterable<{
    blocks: B[]
    request?: R
}> {
    let pack: B[] = []
    let packRequest: R | undefined = undefined
    for (let b of blocks) {
        let req = getRequestAt(requests, getBlockHeight(b))
        if (req === packRequest) {
            pack.push(b)
        } else {
            if (pack.length) {
                yield {blocks: pack, request: packRequest}
            }
            pack = [b]
            packRequest = req
        }
    }
    if (pack.length) {
        yield {blocks: pack, request: packRequest}
    }
}


export function* splitRangeByRequest<R>(requests: RangeRequest<R>[], range: FiniteRange): Iterable<{
    range: FiniteRange,
    request?: R
}> {
    requests = applyRangeBound(requests, range)
    for (let i = 0; i < requests.length; i++) {
        let req = requests[i] as {range: FiniteRange, request: R}
        if (i > 0) {
            let from = assertNotNull(requests[i-1].range.to) + 1
            let to = req.range.from - 1
            assert(from <= to)
            yield {range: {from, to}}
        }
        yield req
    }
}
