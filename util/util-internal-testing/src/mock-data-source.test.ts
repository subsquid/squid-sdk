import {describe, expect, it} from 'vitest'
import {buildChain, forkAt, joinFork} from './mock-chain'
import {createMockDataSource} from './mock-data-source'

async function drain<T>(iter: AsyncIterable<T[]>): Promise<T[]> {
    const out: T[] = []
    for await (const batch of iter) out.push(...batch)
    return out
}

describe('createMockDataSource', () => {
    it('starts empty and exposes an empty chain', () => {
        const source = createMockDataSource()
        expect(source.getChain()).toEqual([])
    })

    it('registers the initial chain and serves it via getBlock/getBlockRange', async () => {
        const chain = buildChain({from: 1, to: 4})
        const source = createMockDataSource(chain)

        expect(source.getChain()).toEqual(chain)

        expect(await source.getBlock({hash: '0x2'})).toEqual(chain[1])
        expect(await source.getBlock({height: 3})).toEqual(chain[2])

        const blocks = await drain(source.getBlockRange(1, chain[chain.length - 1]))
        expect(blocks).toEqual(chain)
    })

    it('rejects an initial chain with a broken parent-hash link', () => {
        const chain = buildChain({from: 1, to: 3})
        const broken = [...chain]
        broken[2] = {...broken[2], parentHash: '0xdeadbeef'}
        expect(() => createMockDataSource(broken)).toThrow(/does not link to previous/)
    })

    it('rejects an initial chain with a height gap', () => {
        const broken = [
            {height: 1, hash: '0x1', parentHash: '0x0'},
            {height: 3, hash: '0x3', parentHash: '0x1'},
        ]
        expect(() => createMockDataSource(broken)).toThrow(/heights must be strictly consecutive/)
    })

    it('getBlockRange coerces from > to.height (HotProcessor contract)', async () => {
        const chain = buildChain({from: 1, to: 5})
        const source = createMockDataSource(chain)

        const blocks = await drain(source.getBlockRange(10, chain[2]))
        expect(blocks).toEqual([chain[2]])
    })

    it('getBlockRange yields batches of batchSize', async () => {
        const chain = buildChain({from: 1, to: 7})
        const source = createMockDataSource(chain, {batchSize: 3})

        const collected: number[][] = []
        for await (const batch of source.getBlockRange(1, chain[chain.length - 1])) {
            collected.push(batch.map((b) => b.height))
        }
        expect(collected).toEqual([[1, 2, 3], [4, 5, 6], [7]])
    })

    it('getBlockRange errors when target hash mismatches current chain at that height', async () => {
        const chain = buildChain({from: 1, to: 5})
        const source = createMockDataSource(chain)

        const fauxTarget = {height: 3, hash: '0xwrong'}
        await expect(drain(source.getBlockRange(1, fauxTarget))).rejects.toThrow(/hash mismatch/)
    })

    it('setChain replaces current view but the old blocks stay findable by hash', async () => {
        const main = buildChain({from: 1, to: 5})
        const branch = forkAt(main, {at: 3, length: 3, suffix: 'a'}) // 4a, 5a, 6a
        const postReorg = joinFork(main, branch) // 1,2,3,4a,5a,6a

        const source = createMockDataSource(main)
        source.setChain(postReorg)

        expect(source.getChain()).toEqual(postReorg)

        // Old-chain block 0x4 still findable in the pool (HotProcessor needs this
        // when backtracking to locate the common ancestor).
        expect(await source.getBlock({hash: '0x4'})).toEqual(main[3])
        expect(await source.getBlock({hash: '0x5'})).toEqual(main[4])

        // And the new-chain blocks are visible via getBlockRange.
        const streamed = await drain(source.getBlockRange(4, postReorg[postReorg.length - 1]))
        expect(streamed.map((b) => b.hash)).toEqual(['0x4a', '0x5a', '0x6a'])
    })

    it('addBlocks populates the pool without touching the current chain', async () => {
        const main = buildChain({from: 1, to: 3})
        const source = createMockDataSource(main)

        const auxiliary = buildChain({from: 100, to: 101, suffix: 'z', startParent: '0xdetached'})
        source.addBlocks(auxiliary)

        expect(source.getChain()).toEqual(main) // unchanged
        expect(await source.getBlock({hash: '0x100z'})).toEqual(auxiliary[0])
    })

    it('getBlock throws a helpful error for unknown refs', async () => {
        const source = createMockDataSource(buildChain({from: 1, to: 2}))

        await expect(source.getBlock({hash: '0xmissing'})).rejects.toThrow(/no block with hash 0xmissing/)
        await expect(source.getBlock({height: 99})).rejects.toThrow(/no block at height 99/)
    })

    it('getFinalizedBlockHeight resolves from the pool (current + added)', async () => {
        const main = buildChain({from: 1, to: 3})
        const branch = forkAt(main, {at: 2, length: 2, suffix: 'a'})
        const source = createMockDataSource(main)
        source.addBlocks(branch)

        expect(await source.getFinalizedBlockHeight('0x2')).toBe(2)
        expect(await source.getFinalizedBlockHeight('0x3a')).toBe(3)

        await expect(source.getFinalizedBlockHeight('0xmissing')).rejects.toThrow(/no block with hash/)
    })

    it('getHeader returns the block (MockBlock is already header-shaped)', () => {
        const main = buildChain({from: 1, to: 2})
        const source = createMockDataSource(main)
        expect(source.getHeader(main[0])).toBe(main[0])
    })
})
