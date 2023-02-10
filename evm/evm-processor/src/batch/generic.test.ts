import {assertNotNull} from '@subsquid/util-internal'
import assert from 'assert'
import {Arbitrary} from 'fast-check'
import * as fc from 'fast-check'
import {Batch, mergeBatches} from './generic'
import {Range, rangeContains, rangeDifference, rangeEnd} from '../util/range'

const aClosedRange = fc.tuple(fc.nat(), fc.nat()).map(([a, b]) => {
    if (a < b) {
        return {from: a, to: b}
    } else {
        return {from: b, to: a}
    }
})

const aOpenRange = fc.nat().map((a) => ({from: a}))

const aPointRange = fc.nat().map((a) => ({from: a, to: a}))

const aRange = fc.oneof(aClosedRange, aOpenRange, aPointRange)

const aOptionalRange = fc.option(aRange, {freq: 10, nil: undefined})

interface Req {
    id: number
    range: Range
}

const aBatch: Arbitrary<Batch<Req[]>[]> = fc.array(aOptionalRange).map((ranges) => {
    return ranges.map((maybeRange, id) => {
        let range = maybeRange || {from: 0}
        return {
            range,
            request: [{id, range}],
        }
    })
})

function assertion(
    test: (merged: Batch<Req[]>[], original: Batch<Req[]>[]) => void | boolean,
    params?: fc.Parameters<unknown>
): void {
    let prop = fc.property(aBatch, (original) => {
        let merged = mergeBatches(original, (a, b) => a.concat(b))
        return test(merged, original)
    })
    fc.assert(prop, params)
}

describe('generic batching', function () {
    it('ranges are well formed', function () {
        assertion((batches) => {
            return batches.every((b) => {
                let {from, to} = b.range
                return from >= 0 && (to == null || from <= to)
            })
        })
    })

    it('ranges are properly sorted and do not intersect', function () {
        assertion((batches) => {
            for (let i = 1; i < batches.length; i++) {
                let current = batches[i].range
                let prev = batches[i - 1].range
                if (rangeEnd(prev) >= current.from) return false
            }
        })
    })

    it('each handler is never called outside of its range', function () {
        assertion((batches) => {
            return batches.every((b) => {
                return b.request.every((h) => {
                    return rangeContains(h.range, b.range)
                })
            })
        })
    })

    it('the entire range of each request is covered', function () {
        assertion((merged, original) => {
            let uncovered = new Map(original.flatMap((b) => b.request).map((h) => [h.id, h.range]))
            merged.forEach((b) => {
                b.request.forEach((h) => {
                    let uncoveredRange = assertNotNull(uncovered.get(h.id))
                    let diff = rangeDifference(uncoveredRange, b.range)
                    if (diff.length == 0) {
                        uncovered.delete(h.id)
                    } else {
                        assert(diff.length == 1)
                        uncovered.set(h.id, diff[0])
                    }
                })
            })
            return uncovered.size == 0
        })
    })
})
