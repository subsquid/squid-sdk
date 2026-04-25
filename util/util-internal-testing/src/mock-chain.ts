/**
 * Deterministic mock-block and mock-chain builders for fork-scenario tests.
 *
 * A {@link MockBlock} is structurally compatible with `BlockHeader` from
 * `@subsquid/util-internal-ingest-tools` — `{height, hash, parentHash}` —
 * so chains produced here can be fed directly into code paths that accept
 * a `BlockHeader[]`.
 *
 * Hash scheme: `0x<height><suffix>`. For the main chain `suffix` is empty,
 * so heights 1..3 yield hashes `0x1`, `0x2`, `0x3`. For a fork labelled `a`
 * the same heights yield `0x1a`, `0x2a`, `0x3a` — distinguishable by eye
 * and easy to assert in test output.
 */

export interface MockBlock {
    height: number
    hash: string
    parentHash: string
}

export const GENESIS_HASH = '0x0'

export interface BuildChainOptions {
    from: number
    /** Inclusive. */
    to: number
    /** Appended to every hash; default `''` (main chain). */
    suffix?: string
    /** `parentHash` of the first produced block; default `GENESIS_HASH`. */
    startParent?: string
}

/**
 * Build a linear chain of mock blocks with deterministic hashes and
 * parentHash linkage.
 */
export function buildChain({from, to, suffix = '', startParent = GENESIS_HASH}: BuildChainOptions): MockBlock[] {
    if (!Number.isInteger(from) || !Number.isInteger(to)) {
        throw new Error(`buildChain: from/to must be integers, got from=${from}, to=${to}`)
    }
    if (from > to) {
        throw new Error(`buildChain: from (${from}) must be <= to (${to})`)
    }

    const blocks: MockBlock[] = []
    let parentHash = startParent
    for (let h = from; h <= to; h++) {
        const hash = makeHash(h, suffix)
        blocks.push({height: h, hash, parentHash})
        parentHash = hash
    }
    return blocks
}

export interface ForkAtOptions {
    /** Height of the common ancestor — must exist in `base`. */
    at: number
    /** Number of blocks to produce on the new branch, starting at `at + 1`. */
    length: number
    /** Suffix distinguishing the branch in hashes (e.g. `'a'`, `'b'`). */
    suffix: string
}

/**
 * Build a fork branch diverging from `base` after the block at height `at`.
 * The returned array starts at height `at + 1` and has `length` blocks.
 * Does not mutate `base`.
 */
export function forkAt(base: MockBlock[], {at, length, suffix}: ForkAtOptions): MockBlock[] {
    if (!Number.isInteger(length) || length < 1) {
        throw new Error(`forkAt: length must be a positive integer, got ${length}`)
    }
    if (!suffix) {
        throw new Error('forkAt: suffix is required to distinguish the branch')
    }

    const anchor = base.find((b) => b.height === at)
    if (!anchor) {
        throw new Error(
            `forkAt: no block at height ${at} in base chain (range ${base.length === 0 ? 'empty' : `${base[0].height}..${base[base.length - 1].height}`})`,
        )
    }

    return buildChain({
        from: at + 1,
        to: at + length,
        suffix,
        startParent: anchor.hash,
    })
}

/**
 * Join a main chain with a fork branch at their common ancestor.
 * Returns `[...main up to and including the anchor, ...branch]`.
 * Useful for feeding a mock data source the "post-reorg" view.
 */
export function joinFork(main: MockBlock[], branch: MockBlock[]): MockBlock[] {
    if (branch.length === 0) return [...main]

    const firstBranch = branch[0]
    const anchor = main.find((b) => b.hash === firstBranch.parentHash)
    if (!anchor) {
        throw new Error(
            `joinFork: branch does not attach to main — first branch block (height=${firstBranch.height}, parentHash=${firstBranch.parentHash}) has no matching ancestor in main`,
        )
    }

    const prefix = main.filter((b) => b.height <= anchor.height)
    return [...prefix, ...branch]
}

function makeHash(height: number, suffix: string): string {
    return `0x${height}${suffix}`
}
