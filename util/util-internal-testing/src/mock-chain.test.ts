import {describe, expect, it} from 'vitest'
import {GENESIS_HASH, buildChain, forkAt, joinFork} from './mock-chain'

describe('buildChain', () => {
    it('builds a linear chain with deterministic hashes and parentHash linkage', () => {
        const chain = buildChain({from: 1, to: 4})

        expect(chain).toEqual([
            {height: 1, hash: '0x1', parentHash: GENESIS_HASH},
            {height: 2, hash: '0x2', parentHash: '0x1'},
            {height: 3, hash: '0x3', parentHash: '0x2'},
            {height: 4, hash: '0x4', parentHash: '0x3'},
        ])
    })

    it('honors a custom startParent', () => {
        const chain = buildChain({from: 10, to: 11, startParent: '0xabc'})

        expect(chain[0].parentHash).toBe('0xabc')
        expect(chain[1].parentHash).toBe(chain[0].hash)
    })

    it('appends a suffix to every hash (fork-style chain)', () => {
        const chain = buildChain({from: 1, to: 3, suffix: 'a'})

        expect(chain.map((b) => b.hash)).toEqual(['0x1a', '0x2a', '0x3a'])
        expect(chain[1].parentHash).toBe('0x1a')
        expect(chain[2].parentHash).toBe('0x2a')
    })

    it('produces a single block when from === to', () => {
        const chain = buildChain({from: 5, to: 5})

        expect(chain).toEqual([{height: 5, hash: '0x5', parentHash: GENESIS_HASH}])
    })

    it('rejects from > to', () => {
        expect(() => buildChain({from: 5, to: 3})).toThrow(/from \(5\) must be <= to \(3\)/)
    })

    it('rejects non-integer heights', () => {
        expect(() => buildChain({from: 1.5, to: 3})).toThrow(/must be integers/)
    })
})

describe('forkAt', () => {
    it('produces a branch anchored at the common ancestor', () => {
        const main = buildChain({from: 1, to: 5})
        const branch = forkAt(main, {at: 3, length: 3, suffix: 'a'})

        expect(branch).toEqual([
            {height: 4, hash: '0x4a', parentHash: '0x3'},
            {height: 5, hash: '0x5a', parentHash: '0x4a'},
            {height: 6, hash: '0x6a', parentHash: '0x5a'},
        ])
    })

    it('does not mutate the base chain', () => {
        const main = buildChain({from: 1, to: 3})
        const snapshot = JSON.stringify(main)
        forkAt(main, {at: 2, length: 2, suffix: 'x'})
        expect(JSON.stringify(main)).toBe(snapshot)
    })

    it('allows cascading: a fork of a fork', () => {
        const main = buildChain({from: 1, to: 5})
        const branchA = forkAt(main, {at: 3, length: 3, suffix: 'a'}) // 4a, 5a, 6a
        const full = joinFork(main, branchA) // 1,2,3,4a,5a,6a
        const branchB = forkAt(full, {at: 5, length: 2, suffix: 'b'}) // 6b, 7b off 5a

        expect(branchB).toEqual([
            {height: 6, hash: '0x6b', parentHash: '0x5a'},
            {height: 7, hash: '0x7b', parentHash: '0x6b'},
        ])
    })

    it('rejects an anchor height absent from the base chain', () => {
        const main = buildChain({from: 1, to: 3})
        expect(() => forkAt(main, {at: 99, length: 1, suffix: 'a'})).toThrow(/no block at height 99/)
    })

    it('rejects an empty base chain', () => {
        expect(() => forkAt([], {at: 1, length: 1, suffix: 'a'})).toThrow(/range empty/)
    })

    it('rejects length < 1', () => {
        const main = buildChain({from: 1, to: 3})
        expect(() => forkAt(main, {at: 2, length: 0, suffix: 'a'})).toThrow(/length must be a positive integer/)
    })

    it('rejects an empty suffix', () => {
        const main = buildChain({from: 1, to: 3})
        expect(() => forkAt(main, {at: 2, length: 1, suffix: ''})).toThrow(/suffix is required/)
    })
})

describe('joinFork', () => {
    it('returns main + branch stitched at the common ancestor', () => {
        const main = buildChain({from: 1, to: 5})
        const branch = forkAt(main, {at: 3, length: 2, suffix: 'a'})
        const full = joinFork(main, branch)

        expect(full.map((b) => b.hash)).toEqual(['0x1', '0x2', '0x3', '0x4a', '0x5a'])

        // Parent-hash chain unbroken across the stitch.
        for (let i = 1; i < full.length; i++) {
            expect(full[i].parentHash).toBe(full[i - 1].hash)
        }
    })

    it('returns a copy of main when branch is empty', () => {
        const main = buildChain({from: 1, to: 3})
        const result = joinFork(main, [])

        expect(result).toEqual(main)
        expect(result).not.toBe(main)
    })

    it('rejects a branch that does not attach to main', () => {
        const main = buildChain({from: 1, to: 3})
        const orphan = buildChain({from: 10, to: 11, suffix: 'x', startParent: '0xunrelated'})
        expect(() => joinFork(main, orphan)).toThrow(/does not attach to main/)
    })
})
