import {describe, expect, it} from 'vitest'

import {dropEmptyBlocks} from './data-source'

function blk(
    number: number,
    counts: {logs?: number; transactions?: number; traces?: number; stateDiffs?: number} = {},
) {
    return {
        header: {number},
        logs: Array(counts.logs ?? 0).fill({}),
        transactions: Array(counts.transactions ?? 0).fill({}),
        traces: Array(counts.traces ?? 0).fill({}),
        stateDiffs: Array(counts.stateDiffs ?? 0).fill({}),
    }
}

const nums = (bs: {header: {number: number}}[]) => bs.map((b) => b.header.number)

describe('dropEmptyBlocks', () => {
    it('drops empty interior blocks but always keeps the batch boundaries', () => {
        let blocks = [blk(1), blk(2, {logs: 1}), blk(3), blk(4, {transactions: 1}), blk(5)]
        // block 3 is an empty interior block → dropped; 1 and 5 are boundaries → kept though empty.
        expect(nums(dropEmptyBlocks(blocks, () => false))).toEqual([1, 2, 4, 5])
    })

    it('keeps every block when includeAllBlocks is true', () => {
        let blocks = [blk(1), blk(2), blk(3)]
        expect(nums(dropEmptyBlocks(blocks, () => true))).toEqual([1, 2, 3])
    })

    it('keeps interior blocks carrying any kind of data', () => {
        let blocks = [blk(1, {logs: 1}), blk(2, {traces: 1}), blk(3, {stateDiffs: 1}), blk(4)]
        expect(nums(dropEmptyBlocks(blocks, () => false))).toEqual([1, 2, 3, 4])
    })

    it('respects per-block includeAllBlocks (one range opted in)', () => {
        let blocks = [blk(1, {logs: 1}), blk(2), blk(3), blk(4, {logs: 1})]
        // includeAllBlocks true only for block 2; block 3 is empty + not opted in → dropped.
        expect(nums(dropEmptyBlocks(blocks, (n) => n === 2))).toEqual([1, 2, 4])
    })

    it('keeps a lone empty block (first === last)', () => {
        expect(nums(dropEmptyBlocks([blk(7)], () => false))).toEqual([7])
    })
})
