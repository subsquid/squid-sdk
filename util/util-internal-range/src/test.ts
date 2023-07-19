import assert from 'assert'
import * as fc from 'fast-check'
import {Arbitrary} from 'fast-check'
import {describe, it} from 'node:test'
import {Range, RangeRequest} from './interfaces'
import {assertRange, assertRangeList, mergeRangeRequests, rangeContains, rangeDifference} from './util'


const aFiniteRange = fc.tuple(fc.nat(), fc.nat()).map(([a, b]) => {
    if (a < b) {
        return {from: a, to: b}
    } else {
        return {from: b, to: a}
    }
})


const aOpenRange = fc.nat().map(a => ({from: a}))


const aPointRange = fc.nat().map(a => ({from: a, to: a}))


const aRange = fc.oneof(aFiniteRange, aOpenRange, aPointRange)


const aOptionalRange = fc.option(aRange, {freq: 10, nil: undefined})


interface Req {
    id: number
    range: Range
}


const aBatch: Arbitrary<RangeRequest<Req[]>[]> = fc.array(aOptionalRange).map(ranges => {
    return ranges.map((maybeRange, id) => {
        let range = maybeRange || {from: 0}
        return {
            range,
            request: [
                {id, range}
            ]
        }
    })
})


function assertion(
    test: (merged: RangeRequest<Req[]>[], original: RangeRequest<Req[]>[]) => void | boolean,
    params?: fc.Parameters<unknown>
): void {
    let prop = fc.property(aBatch, original => {
        let merged = mergeRangeRequests(original, (a, b) => a.concat(b))
        return test(merged, original)
    })
    fc.assert(prop, params)
}


describe('merge range requests', function() {
    it('ranges are well formed', function () {
        assertion(batches => {
            return batches.every(b => {
                try {
                    assertRange(b.range)
                    return true
                } catch(e: any) {
                    return false
                }
            })
        })
    })

    it('ranges are properly sorted and do not intersect', function () {
        assertion(batches => {
            try {
                assertRangeList(batches.map(b => b.range))
                return true
            } catch(e: any) {
                return false
            }
        })
    })

    it('each handler is never called outside of its range', function() {
        assertion(batches => {
            return batches.every(b => {
                return b.request.every(h => {
                    return rangeContains(h.range, b.range)
                })
            })
        })
    })

    it('the entire range of each request is covered', function() {
        assertion((merged, original) => {
            let uncovered = new Map(original.flatMap(b => b.request).map(h => [h.id, h.range]))
            merged.forEach(b => {
                b.request.forEach(h => {
                    let uncoveredRange = uncovered.get(h.id)
                    assert(uncoveredRange != null)
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
