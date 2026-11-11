/**
 * End-to-end reorg scenarios for RPC sources: a reorg-able JSON-RPC chain ({@link MockEvmRpc}),
 * the real `EvmRpcDataSourceBuilder` / `EvmFallbackDataSourceBuilder` sources, the real batch
 * processor and a hot database that models rollback the way `TypeormDatabase` does.
 *
 * The data source decides what `ForkException.previousBlocks` contains; the processor's
 * `findRollbackIndex` decides what it can do with it. Testing each side on its own, against its own
 * idea of that payload, is how #631 shipped: every reorg over RPC ended in "Unable to process
 * fork". These tests run both sides together and check the outcome that matters - after the chain
 * is rewritten and extended, the database holds exactly the canonical chain.
 *
 * Scenarios follow the reorg cases collected in https://github.com/enviodev/open-indexer-benchmark
 * (reliability/README.md, "reorgs").
 */

import {
    type DataHandlerContext,
    type FinalDatabaseState,
    type FinalTxInfo,
    type HashAndHeight,
    type HotDatabase,
    type HotDatabaseState,
    type HotTxInfo,
    Processor,
} from '@subsquid/batch-processor'
import {LogLevel, setLogLevelCallback} from '@subsquid/logger'
import {MockEvmRpc} from '@subsquid/util-internal-testing'
import type {DataSource} from '@subsquid/util-internal-data-source'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {EvmFallbackDataSourceBuilder} from '../fallback'
import {EvmRpcDataSourceBuilder} from './builder'

// The fallback builder loads the RPC builder lazily with `require('../rpc/builder')`, which vitest
// cannot resolve to the TypeScript source; hand it the real module.
vi.mock('../fallback/load-rpc-stream', async () => {
    let builder = await import('./builder')
    return {loadRpcStream: () => builder}
})

// Fork navigation is logged at INFO and the parity warning at WARN; keep test output readable.
setLogLevelCallback((ns) => (ns.startsWith('sqd:') ? LogLevel.ERROR : undefined))

const FINALITY = 5 // blocks below the head that stay unfinalized (hot)

interface Store {
    write(height: number, hash: string): void
}

/**
 * A hot database with TypeormDatabase's rollback semantics: rows above `baseHead` are undone before
 * new blocks are written, `baseHead` must be a block the database actually holds, and finalized
 * blocks leave the hot set. `connect()` returns the same state, so a second processor can resume.
 */
class MemoryHotDatabase implements HotDatabase<Store> {
    readonly supportsHotBlocks = true as const
    /** One row per handled block: height -> block hash. */
    readonly rows = new Map<number, string>()
    private finalized: HashAndHeight = {height: -1, hash: '0x'}
    private top: HashAndHeight[] = []

    get head(): HashAndHeight {
        return this.top[this.top.length - 1] ?? this.finalized
    }

    get finalizedHeight(): number {
        return this.finalized.height
    }

    async connect(): Promise<HotDatabaseState> {
        return {...this.finalized, top: [...this.top]}
    }

    async transact(info: FinalTxInfo, cb: (store: Store) => Promise<unknown>): Promise<void> {
        this.assertHolds(info.prevHead)
        this.rollbackTo(info.prevHead.height)
        await cb(this.store())
        this.finalized = info.nextHead
        this.top = []
    }

    async transactHot2(
        info: HotTxInfo,
        cb: (store: Store, sliceBeg: number, sliceEnd: number) => Promise<unknown>,
    ): Promise<void> {
        this.assertHolds(info.baseHead)
        this.rollbackTo(info.baseHead.height)
        await cb(this.store(), 0, info.newBlocks.length)
        this.top.push(...info.newBlocks)
        if (info.finalizedHead.height > this.finalized.height) {
            this.finalized = info.finalizedHead
            this.top = this.top.filter((b) => b.height > info.finalizedHead.height)
        }
    }

    private assertHolds(ref: HashAndHeight): void {
        if (ref.height < 0) return
        let held = ref.height === this.finalized.height ? this.finalized : this.top.find((b) => b.height === ref.height)
        if (held?.hash !== ref.hash) throw new Error(`database does not hold base block ${ref.height}#${ref.hash}`)
    }

    private rollbackTo(height: number): void {
        for (let h of [...this.rows.keys()]) if (h > height) this.rows.delete(h)
        this.top = this.top.filter((b) => b.height <= height)
    }

    private store(): Store {
        return {write: (height, hash) => this.rows.set(height, hash)}
    }
}

const handler = async (ctx: DataHandlerContext<{header: {number: number; hash: string}}, Store>) => {
    for (let b of ctx.blocks) ctx.store.write(b.header.number, b.header.hash)
}

let chain: MockEvmRpc
let url: string

afterEach(async () => {
    expect([...chain.unsupportedMethods]).toEqual([]) // a gap in the mock is not a finding
    await chain.close()
})

async function startChain(blocks: number, finalizedLag = FINALITY): Promise<void> {
    chain = new MockEvmRpc({finalizedLag})
    chain.mine(blocks)
    url = await chain.listen()
}

/** `finality`: a fixed confirmation depth, or `'tag'` to rely on the node's `finalized` block tag. */
function rpcSource(to: number, finality: number | 'tag' = FINALITY) {
    return new EvmRpcDataSourceBuilder()
        .setRpc({url, rpc: finality === 'tag' ? {} : {finalityConfirmation: finality}})
        .setFields({block: {hash: true}})
        .includeAllBlocks({from: 0, to})
        .build()
}

function fallbackSource(to: number) {
    return new EvmFallbackDataSourceBuilder()
        .setDownstreamSources([{type: 'rpc', url, rpc: {finalityConfirmation: FINALITY}}])
        .setCapabilityProbe(false)
        .setFields({block: {hash: true}})
        .includeAllBlocks({from: 0, to})
        .build()
}

interface Run {
    done: Promise<void>
    /** Set once `done` has settled either way. */
    settled: boolean
    /** `from` of every stream the processor opened: the first one, then one per fork it navigated. */
    streams: number[]
}

function startProcessor(src: DataSource<any>, db: MemoryHotDatabase): Run {
    let streams: number[] = []
    let traced: DataSource<any> = {
        getHead: () => src.getHead(),
        getFinalizedHead: () => src.getFinalizedHead(),
        getStream: (req) => {
            streams.push(req.from)
            return src.getStream(req)
        },
        getFinalizedStream: (req) => {
            streams.push(req.from)
            return src.getFinalizedStream(req)
        },
    }
    let run: Run = {done: new Processor(traced, db, handler).run(), settled: false, streams}
    run.done.then(
        () => (run.settled = true),
        () => (run.settled = true),
    )
    return run
}

/**
 * Let the processor catch up with the chain and learn a finalized head (the #631 precondition).
 * The source only reports finality with a batch, and a processor that caught up before the first
 * finality poll returned gets no further batch from an idle chain - so keep the chain moving, as a
 * real one does. Returns the head the processor settled on.
 */
async function settle(db: MemoryHotDatabase): Promise<number> {
    let deadline = Date.now() + 10_000
    while (!(db.head.height === chain.head.number && db.finalizedHeight >= 0)) {
        if (Date.now() > deadline) throw new Error('timed out waiting for the processor to settle at the head')
        if (db.head.height === chain.head.number) chain.mine()
        await new Promise((r) => setTimeout(r, 50))
    }
    return db.head.height
}

/**
 * After the fork, the processor must resume from a block it really shared with the new chain: above
 * its finalized head and no higher than the fork point. Resuming from 0 means it threw its hot
 * blocks away instead of rolling back - correct data, but a full rewind.
 */
function expectRolledBackTo(run: Run, finalizedBefore: number, forkBase: number): void {
    expect(run.streams.length).toBeGreaterThan(1)
    for (let from of run.streams.slice(1)) {
        expect(from).toBeGreaterThan(finalizedBefore)
        expect(from).toBeLessThanOrEqual(forkBase + 1)
    }
}

async function until(cond: () => boolean, what: string, ms = 10_000): Promise<void> {
    let deadline = Date.now() + ms
    while (!cond()) {
        if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`)
        await new Promise((r) => setTimeout(r, 20))
    }
}

/** The database must hold exactly the canonical chain from genesis up to `to`. */
function expectCanonical(db: MemoryHotDatabase, to: number): void {
    let expected = new Map<number, string>()
    for (let n = 0; n <= to; n++) expected.set(n, chain.hashAt(n))
    expect(db.rows).toEqual(expected)
}

describe('RPC source reorgs, end to end (#631)', {timeout: 30_000}, () => {
    it('rolls back a one-block reorg at the head', async () => {
        await startChain(10)
        let db = new MemoryHotDatabase()
        let run = startProcessor(rpcSource(30), db)
        await settle(db)
        let finalized = db.finalizedHeight

        let base = chain.reorg({depth: 1})
        chain.mineTo(30)

        await run.done
        expectCanonical(db, 30)
        expectRolledBackTo(run, finalized, base.number)
    })

    it('rolls back a reorg several blocks deep, inside the unfinalized window', async () => {
        await startChain(12)
        let db = new MemoryHotDatabase()
        let run = startProcessor(rpcSource(30), db)
        let head = await settle(db)
        let finalized = db.finalizedHeight

        let base = chain.reorg({depth: head - finalized - 1})
        chain.mineTo(30)

        await run.done
        expectCanonical(db, 30)
        expectRolledBackTo(run, finalized, base.number)
    })

    it('follows the chain onto a shorter fork', async () => {
        await startChain(12)
        let db = new MemoryHotDatabase()
        let run = startProcessor(rpcSource(30), db)
        await settle(db)
        let finalized = db.finalizedHeight

        // Four blocks replaced by two: the canonical head moves below what the processor stored.
        let stored = new Map(db.rows)
        let base = chain.reorg({depth: 4, length: 2})

        // While the head is below its own, an RPC source cannot see the fork yet - the next block it
        // needs does not exist. Let the processor poll the shorter chain a few times: it must keep
        // waiting, neither failing nor writing anything, until the chain grows past its head.
        let polls = chain.tags.get('latest') ?? 0
        await until(() => (chain.tags.get('latest') ?? 0) >= polls + 3, 'processor to poll the shorter head')
        expect(run.settled).toBe(false)
        expect(db.rows).toEqual(stored)

        chain.mineTo(30)

        await run.done
        expectCanonical(db, 30)
        expectRolledBackTo(run, finalized, base.number)
    })

    it('detects a reorg that happened while it was stopped', async () => {
        await startChain(12)
        let db = new MemoryHotDatabase()
        await atHeadAfterRun(db, 12)
        let finalized = db.finalizedHeight

        let base = chain.reorg({depth: 3})
        chain.mineTo(30)

        let run = startProcessor(rpcSource(30), db)
        await run.done
        expectCanonical(db, 30)
        expectRolledBackTo(run, finalized, base.number)
    })

    it('survives cascading reorgs', async () => {
        await startChain(12)
        let db = new MemoryHotDatabase()
        let run = startProcessor(rpcSource(40), db)
        await settle(db)
        let finalized = db.finalizedHeight

        let first = chain.reorg({depth: 2})
        chain.mine(2)
        await settle(db)
        let second = chain.reorg({depth: 3})
        chain.mineTo(40)

        await run.done
        expectCanonical(db, 40)
        expectRolledBackTo(run, finalized, Math.max(first.number, second.number))
    })

    it('rolls back when finality comes from the `finalized` tag', async () => {
        await startChain(12, 4)
        let db = new MemoryHotDatabase()
        let run = startProcessor(rpcSource(30, 'tag'), db)
        await settle(db)
        let finalized = db.finalizedHeight

        let base = chain.reorg({depth: 2})
        chain.mineTo(30)

        await run.done
        expectCanonical(db, 30)
        expectRolledBackTo(run, finalized, base.number)
        expect(chain.tags.get('finalized') ?? 0).toBeGreaterThan(0) // finality really came from the tag
    })

    it('rolls back a reorg served through an `rpc` fallback source', async () => {
        await startChain(10)
        let db = new MemoryHotDatabase()
        let run = startProcessor(fallbackSource(30), db)
        await settle(db)
        let finalized = db.finalizedHeight

        let base = chain.reorg({depth: 2})
        chain.mineTo(30)

        await run.done
        expectCanonical(db, 30)
        expectRolledBackTo(run, finalized, base.number)
    })

    it('stops instead of writing over finalized data on a reorg deeper than the window', async () => {
        await startChain(20)
        let db = new MemoryHotDatabase()
        let run = startProcessor(rpcSource(40), db)
        let head = await settle(db)
        let before = new Map(db.rows)

        // The fork point is below the processor's finalized head.
        chain.reorg({depth: head - db.finalizedHeight + 2})
        chain.mineTo(40)

        await expect(run.done).rejects.toThrow('Unable to process fork')
        expect(db.rows).toEqual(before) // nothing from the new branch was written
    })
})

/** Run a processor up to `height` and let it stop there, with a finalized head stored. */
async function atHeadAfterRun(db: MemoryHotDatabase, height: number): Promise<void> {
    let run = startProcessor(rpcSource(height), db)
    await run.done
    expect(db.head.height).toBe(height)
    expect(db.finalizedHeight).toBeGreaterThanOrEqual(0)
}
