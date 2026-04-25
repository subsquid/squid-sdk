/**
 * In-process block store that satisfies the subset of `HotProcessorOptions`
 * used by `HotProcessor` from `@subsquid/util-internal-ingest-tools`:
 * `getBlock`, `getBlockRange`, `getHeader`, `getFinalizedBlockHeight`.
 *
 * Two views are maintained:
 *
 * - A **block pool** (`byHash`) — every block ever registered, found on hash.
 *   This lets the processor backtrack through common ancestors that left the
 *   current chain (e.g. during a reorg).
 * - A **current chain** — the linear sequence `getBlockRange` iterates over.
 *   Tests replace this with {@link MockDataSource.setChain} to simulate a
 *   reorg arriving from the "network side".
 *
 * Structurally compatible with `BlockHeader` from
 * `@subsquid/util-internal-ingest-tools`; the actual interface is not
 * imported to avoid a runtime dependency on that package.
 */

import type {MockBlock} from './mock-chain'

export type BlockRef =
    | {hash: string; height: number}
    | {hash: string; height?: undefined}
    | {hash?: undefined; height: number}

export interface MockDataSourceOptions {
    /**
     * Number of blocks per batch yielded by `getBlockRange`. Default: the
     * entire requested slice in a single batch.
     */
    batchSize?: number
}

export interface MockDataSource<B extends MockBlock = MockBlock> {
    /** Replace the current chain (and add all its blocks to the pool). */
    setChain(blocks: B[]): void
    /** Add blocks to the lookup pool without making them current. */
    addBlocks(blocks: B[]): void
    /** Snapshot of the current chain. */
    getChain(): readonly B[]

    /* HotProcessorOptions contract (arrow-bound so they can be spread): */
    getBlock(ref: BlockRef): Promise<B>
    getBlockRange(from: number, to: BlockRef): AsyncIterable<B[]>
    getHeader(block: B): B
    getFinalizedBlockHeight(hash: string): Promise<number>
}

export function createMockDataSource<B extends MockBlock = MockBlock>(
    initialChain: B[] = [],
    {batchSize}: MockDataSourceOptions = {},
): MockDataSource<B> {
    const byHash = new Map<string, B>()
    let currentChain: B[] = []

    const register = (blocks: B[]): void => {
        for (const b of blocks) byHash.set(b.hash, b)
    }

    const setChain: MockDataSource<B>['setChain'] = (blocks) => {
        for (let i = 1; i < blocks.length; i++) {
            if (blocks[i].parentHash !== blocks[i - 1].hash) {
                throw new Error(
                    `setChain: block at index ${i} (height=${blocks[i].height}, ` +
                        `parentHash=${blocks[i].parentHash}) does not link to previous ` +
                        `(hash=${blocks[i - 1].hash})`,
                )
            }
            if (blocks[i].height !== blocks[i - 1].height + 1) {
                throw new Error(
                    `setChain: heights must be strictly consecutive, got ${blocks[i - 1].height} → ${blocks[i].height} at index ${i}`,
                )
            }
        }
        register(blocks)
        currentChain = blocks.slice()
    }

    const getBlock: MockDataSource<B>['getBlock'] = async (ref) => {
        if (ref.hash != null) {
            const block = byHash.get(ref.hash)
            if (!block) throw new Error(`getBlock: no block with hash ${ref.hash} in pool`)
            return block
        }
        const block = currentChain.find((b) => b.height === ref.height)
        if (!block) {
            throw new Error(
                `getBlock: no block at height ${ref.height} in current chain ` + `(range ${rangeLabel(currentChain)})`,
            )
        }
        return block
    }

    async function* getBlockRange(from: number, to: BlockRef): AsyncIterable<B[]> {
        if (currentChain.length === 0) return

        const targetHeight = to.height ?? resolveHeightByHash(currentChain, to.hash)
        if (targetHeight == null) {
            throw new Error(
                `getBlockRange: target ref (hash=${to.hash ?? '?'}, height=${to.height ?? '?'}) ` +
                    `not locatable in current chain (${rangeLabel(currentChain)})`,
            )
        }

        const startHeight = Math.min(from, targetHeight)

        const firstIdx = currentChain.findIndex((b) => b.height >= startHeight)
        if (firstIdx < 0) return
        let lastIdx = currentChain.findIndex((b) => b.height === targetHeight)
        if (lastIdx < 0) return
        if (to.hash != null && currentChain[lastIdx].hash !== to.hash) {
            throw new Error(
                `getBlockRange: target height ${targetHeight} hash mismatch — ` +
                    `expected ${to.hash}, current chain has ${currentChain[lastIdx].hash}`,
            )
        }

        const slice = currentChain.slice(firstIdx, lastIdx + 1)
        const step = batchSize && batchSize > 0 ? batchSize : slice.length
        for (let i = 0; i < slice.length; i += step) {
            yield slice.slice(i, i + step)
        }
    }

    const getHeader: MockDataSource<B>['getHeader'] = (block) => block

    const getFinalizedBlockHeight: MockDataSource<B>['getFinalizedBlockHeight'] = async (hash) => {
        const block = byHash.get(hash)
        if (!block) throw new Error(`getFinalizedBlockHeight: no block with hash ${hash} in pool`)
        return block.height
    }

    if (initialChain.length > 0) setChain(initialChain)

    return {
        setChain,
        addBlocks: register,
        getChain: () => currentChain.slice(),
        getBlock,
        getBlockRange,
        getHeader,
        getFinalizedBlockHeight,
    }
}

function resolveHeightByHash<B extends MockBlock>(chain: readonly B[], hash: string): number | undefined {
    return chain.find((b) => b.hash === hash)?.height
}

function rangeLabel(chain: readonly MockBlock[]): string {
    if (chain.length === 0) return 'empty'
    return `${chain[0].height}..${chain[chain.length - 1].height}`
}
