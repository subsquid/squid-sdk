import type {BlockRef} from '@subsquid/util-internal-data-source'
import {describe, expect, it} from 'vitest'
import {findRollbackIndex} from './run'

function ref(number: number, hash: string): BlockRef {
    return {number, hash}
}

describe('findRollbackIndex', () => {
    it('returns last index when chains are identical', () => {
        const chain: BlockRef[] = [ref(0, '0x0'), ref(1, '0x1'), ref(2, '0x2')]
        expect(findRollbackIndex(chain, chain)).toBe(2)
    })

    it('returns the last common index when chains diverge mid-way', () => {
        const current: BlockRef[] = [ref(0, '0x0'), ref(1, '0x1'), ref(2, '0x2'), ref(3, '0x3')]
        const fork: BlockRef[] = [ref(0, '0x0'), ref(1, '0x1'), ref(2, '0x2alt'), ref(3, '0x3alt')]
        // Common prefix is [0x0, 0x1]; divergence at index 2 (hash mismatch
        // at number=2). Rollback target = last common index = 1.
        expect(findRollbackIndex(current, fork)).toBe(1)
    })

    it('returns -1 when the two chains share no blocks at all', () => {
        const current: BlockRef[] = [ref(0, '0xA0'), ref(1, '0xA1')]
        const fork: BlockRef[] = [ref(0, '0xB0'), ref(1, '0xB1')]
        // Same numbers, different hashes at index 0. No common prefix exists.
        expect(findRollbackIndex(current, fork)).toBe(-1)
    })

    it('returns -1 when the current chain is empty', () => {
        const fork: BlockRef[] = [ref(0, '0x0'), ref(1, '0x1')]
        expect(findRollbackIndex([], fork)).toBe(-1)
    })

    it('returns -1 when the fork chain is empty', () => {
        const current: BlockRef[] = [ref(0, '0x0'), ref(1, '0x1')]
        expect(findRollbackIndex(current, [])).toBe(-1)
    })

    it('skips non-overlapping block numbers on either side and finds the common suffix', () => {
        // current has 0..5, fork has 3..7 — only numbers 3, 4, 5 overlap.
        const current: BlockRef[] = [
            ref(0, '0x0'),
            ref(1, '0x1'),
            ref(2, '0x2'),
            ref(3, '0x3'),
            ref(4, '0x4'),
            ref(5, '0x5'),
        ]
        const fork: BlockRef[] = [
            ref(3, '0x3'),
            ref(4, '0x4'),
            ref(5, '0x5-alt'), // divergence starts here
            ref(6, '0x6-alt'),
            ref(7, '0x7-alt'),
        ]
        // Common prefix inside overlap: 3, 4 match. Last common index in
        // currentChain = 4 (block #4 has hash '0x4').
        expect(findRollbackIndex(current, fork)).toBe(4)
    })

    it('returns -1 when all fork numbers are strictly above current chain range', () => {
        const current: BlockRef[] = [ref(0, '0x0'), ref(1, '0x1')]
        const fork: BlockRef[] = [ref(10, '0xA'), ref(11, '0xB')]
        expect(findRollbackIndex(current, fork)).toBe(-1)
    })

    it('returns -1 when all fork numbers are strictly below current chain range', () => {
        const current: BlockRef[] = [ref(10, '0xA'), ref(11, '0xB')]
        const fork: BlockRef[] = [ref(0, '0x0'), ref(1, '0x1')]
        expect(findRollbackIndex(current, fork)).toBe(-1)
    })

    it('returns the last match when the fork is a strict prefix of the current chain', () => {
        const current: BlockRef[] = [ref(0, '0x0'), ref(1, '0x1'), ref(2, '0x2'), ref(3, '0x3')]
        const fork: BlockRef[] = [ref(0, '0x0'), ref(1, '0x1')]
        expect(findRollbackIndex(current, fork)).toBe(1)
    })

    it('returns the last match when the current chain is a strict prefix of the fork', () => {
        const current: BlockRef[] = [ref(0, '0x0'), ref(1, '0x1')]
        const fork: BlockRef[] = [ref(0, '0x0'), ref(1, '0x1'), ref(2, '0x2'), ref(3, '0x3')]
        expect(findRollbackIndex(current, fork)).toBe(1)
    })
})
