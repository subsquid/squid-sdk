import {describe, expect, it} from 'vitest'

import {dropEmptyBlocks, keptByPosition, streamBoundedRanges} from './data-source'

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

describe('streamBoundedRanges', () => {
    // A mock inner source that records each StreamRequest and yields one block per number in
    // [from, to], each with a deterministic hash so parentHash threading is observable.
    function mockInner() {
        let calls: {from: number; to?: number; parentHash?: string}[] = []
        async function* gen(req: {from: number; to?: number; parentHash?: string}) {
            calls.push({from: req.from, to: req.to, parentHash: req.parentHash})
            let to = req.to ?? req.from
            let blocks = []
            for (let n = req.from; n <= to; n++) blocks.push({number: n, hash: `0x${n}`})
            yield {blocks, finalizedHead: undefined}
        }
        return {calls, getStream: gen as any, getFinalizedStream: gen as any}
    }

    async function drainNums(stream: AsyncIterable<{blocks: {number: number}[]}>): Promise<number[]> {
        let out: number[] = []
        for await (let batch of stream) out.push(...batch.blocks.map((b) => b.number))
        return out
    }

    const r = (from: number, to: number) => ({range: {from, to}, request: {}})

    it('skips gaps between non-contiguous ranges and never streams them', async () => {
        let inner = mockInner()
        let nums = await drainNums(
            streamBoundedRanges(inner as any, [r(100, 200), r(500, 600)], {from: 100, to: 600, parentHash: '0xp'}, false),
        )

        expect(nums).not.toContain(300) // a gap block must never be emitted
        expect(Math.min(...nums)).toBe(100)
        expect(Math.max(...nums)).toBe(600)
        expect(inner.calls.map((c) => [c.from, c.to])).toEqual([
            [100, 200],
            [500, 600],
        ])
        expect(inner.calls[0].parentHash).toBe('0xp') // caller's parentHash kept for the first block
        expect(inner.calls[1].parentHash).toBeUndefined() // gap ⇒ no parent to assert
    })

    it('threads parentHash across contiguous ranges', async () => {
        let inner = mockInner()
        await drainNums(
            streamBoundedRanges(inner as any, [r(100, 200), r(201, 300)], {from: 100, to: 300, parentHash: '0xp'}, false),
        )

        expect(inner.calls.map((c) => [c.from, c.to])).toEqual([
            [100, 200],
            [201, 300],
        ])
        expect(inner.calls[0].parentHash).toBe('0xp')
        expect(inner.calls[1].parentHash).toBe('0x200') // hash of the prior range's last block
    })

    it('clips request ranges to the caller window', async () => {
        let inner = mockInner()
        let nums = await drainNums(
            streamBoundedRanges(inner as any, [r(0, 1000)], {from: 150, to: 153, parentHash: '0xp'}, false),
        )

        expect(inner.calls).toEqual([{from: 150, to: 153, parentHash: '0xp'}])
        expect(nums).toEqual([150, 151, 152, 153])
    })
})

describe('keptByPosition', () => {
    it('projects by position/identity, so structurally identical items never collide', () => {
        // Two pre-filter items that would share a synthesized structural key — e.g. block-reward
        // traces, which carry no transactionIndex. A keyed projection couldn't tell them apart.
        let preA = {tag: 'reward'}
        let preB = {tag: 'reward'}
        let pre = [preA, preB]
        // The decode at exactly `F`: distinct objects, aligned 1:1 with `pre` by position.
        let projected = [{n: 0}, {n: 1}]

        // Only the *second* survived filtering — the projection must keep the second, not the first.
        expect(keptByPosition(projected, pre, [preB])).toEqual([{n: 1}])
        // Only the *first*.
        expect(keptByPosition(projected, pre, [preA])).toEqual([{n: 0}])
        // Both, then none.
        expect(keptByPosition(projected, pre, [preA, preB])).toEqual([{n: 0}, {n: 1}])
        expect(keptByPosition(projected, pre, [])).toEqual([])
    })
})
