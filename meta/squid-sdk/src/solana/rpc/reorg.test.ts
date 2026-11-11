/**
 * End-to-end reorg scenarios for Solana RPC sources: a reorg-able JSON-RPC chain
 * ({@link MockSolanaRpc}), the real `SolanaRpcDataSourceBuilder` / `SolanaFallbackDataSourceBuilder`
 * sources, the real batch processor and a hot database with TypeormDatabase's rollback semantics.
 * The Solana counterpart of `../../evm/rpc/reorg.test.ts` (#631): the source decides what
 * `ForkException.previousBlocks` contains, the processor decides what it can do with it, and only
 * running both together shows whether a reorg is rolled back.
 */

import {type DataHandlerContext, Processor} from '@subsquid/batch-processor'
import {LogLevel, setLogLevelCallback} from '@subsquid/logger'
import type {DataSource} from '@subsquid/util-internal-data-source'
import {MemoryHotDatabase, type MemoryStore, MockSolanaRpc} from '@subsquid/util-internal-testing'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {SolanaFallbackDataSourceBuilder} from '../fallback'
import {SolanaRpcDataSourceBuilder} from './builder'

// The fallback builder loads the RPC builder lazily with `require('../rpc/builder')`, which vitest
// cannot resolve to the TypeScript source; hand it the real module.
vi.mock('../fallback/load-rpc-stream', async () => {
    let builder = await import('./builder')
    return {loadRpcStream: () => builder}
})

setLogLevelCallback((ns) => (ns.startsWith('sqd:') ? LogLevel.ERROR : undefined))

const FINALIZED_LAG = 5 // blocks between the confirmed and the finalized head

const handler = async (ctx: DataHandlerContext<{header: {number: number; hash: string}}, MemoryStore>) => {
    for (let b of ctx.blocks) ctx.store.write(b.header.number, b.header.hash)
}

let chain: MockSolanaRpc
let url: string

afterEach(async () => {
    expect([...chain.unsupportedMethods]).toEqual([]) // a gap in the mock is not a finding
    await chain.close()
})

async function startChain(blocks: number): Promise<void> {
    chain = new MockSolanaRpc({finalizedLag: FINALIZED_LAG})
    chain.mine(blocks)
    url = await chain.listen()
}

function rpcSource(to: number) {
    return new SolanaRpcDataSourceBuilder()
        .setRpc({url})
        .setFields({block: {hash: true}})
        .includeAllBlocks({from: 1, to})
        .build()
}

function fallbackSource(to: number) {
    return new SolanaFallbackDataSourceBuilder()
        .setDownstreamSources([{type: 'rpc', url}])
        .setCapabilityProbe(false)
        .setFields({block: {hash: true}})
        .includeAllBlocks({from: 1, to})
        .build()
}

interface Run {
    done: Promise<void>
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

async function until(cond: () => boolean, what: string, ms = 10_000): Promise<void> {
    let deadline = Date.now() + ms
    while (!cond()) {
        if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`)
        await new Promise((r) => setTimeout(r, 20))
    }
}

/** Let the processor catch up with the chain and learn a finalized head (see the EVM suite). */
async function settle(db: MemoryHotDatabase): Promise<number> {
    let deadline = Date.now() + 10_000
    while (!(db.head.height === chain.head.slot && db.finalizedHeight >= 0)) {
        if (Date.now() > deadline) throw new Error('timed out waiting for the processor to settle at the head')
        if (db.head.height === chain.head.slot) chain.mine()
        await new Promise((r) => setTimeout(r, 50))
    }
    return db.head.height
}

/**
 * The database must hold exactly the canonical chain from slot 1 up to `to`. (Indexing starts at
 * slot 1: the mock's genesis at slot 0 is its own parent, which no real stream starts from.)
 */
function expectCanonical(db: MemoryHotDatabase, to: number): void {
    let expected = new Map<number, string>()
    for (let b of chain.chain) if (b.slot >= 1 && b.slot <= to) expected.set(b.slot, b.blockhash)
    expect(db.rows).toEqual(expected)
}

/** After the fork the processor resumed above its finalized head and no higher than the fork point. */
function expectRolledBackTo(run: Run, finalizedBefore: number, forkBase: number): void {
    expect(run.streams.length).toBeGreaterThan(1)
    for (let from of run.streams.slice(1)) {
        expect(from).toBeGreaterThan(finalizedBefore)
        expect(from).toBeLessThanOrEqual(forkBase + 1)
    }
}

describe('Solana RPC source reorgs, end to end (#631)', {timeout: 30_000}, () => {
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
        expectRolledBackTo(run, finalized, base.slot)
    })

    it('rolls back a reorg several blocks deep, inside the unfinalized window', async () => {
        await startChain(12)
        let db = new MemoryHotDatabase()
        let run = startProcessor(rpcSource(30), db)
        await settle(db)
        let finalized = db.finalizedHeight

        let base = chain.reorg({depth: FINALIZED_LAG - 1})
        chain.mineTo(30)

        await run.done
        expectCanonical(db, 30)
        expectRolledBackTo(run, finalized, base.slot)
    })

    it('rolls back across skipped slots', async () => {
        await startChain(8)
        chain.mine(2, {skip: 2}) // slots 11 and 14; 9, 10, 12, 13 skipped
        let db = new MemoryHotDatabase()
        let run = startProcessor(rpcSource(40), db)
        await settle(db)
        let finalized = db.finalizedHeight

        // The new branch skips differently: replaced blocks, then gaps in other places.
        let base = chain.reorg({depth: 3, length: 0})
        chain.mine(1, {skip: 1})
        chain.mine(2)
        chain.mineTo(40)

        await run.done
        expectCanonical(db, 40)
        expectRolledBackTo(run, finalized, base.slot)
    })

    it('follows the chain onto a shorter fork', async () => {
        await startChain(12)
        let db = new MemoryHotDatabase()
        let run = startProcessor(rpcSource(30), db)
        await settle(db)
        let finalized = db.finalizedHeight
        let stored = new Map(db.rows)

        let base = chain.reorg({depth: 4, length: 2})
        // The source cannot see the fork until the chain grows past the processor's head: it must
        // keep waiting, neither failing nor writing.
        let requests = () => [...chain.calls.values()].reduce((a, b) => a + b, 0)
        let before = requests()
        await until(() => requests() >= before + 3, 'processor to poll the shorter chain')
        expect(run.settled).toBe(false)
        expect(db.rows).toEqual(stored)

        chain.mineTo(30)
        await run.done
        expectCanonical(db, 30)
        expectRolledBackTo(run, finalized, base.slot)
    })

    it('detects a reorg that happened while it was stopped', async () => {
        await startChain(12)
        let db = new MemoryHotDatabase()
        await startProcessor(rpcSource(12), db).done
        expect(db.head.height).toBe(12)
        expect(db.finalizedHeight).toBeGreaterThanOrEqual(0)
        let finalized = db.finalizedHeight

        let base = chain.reorg({depth: 3})
        chain.mineTo(30)

        let run = startProcessor(rpcSource(30), db)
        await run.done
        expectCanonical(db, 30)
        expectRolledBackTo(run, finalized, base.slot)
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
        expectRolledBackTo(run, finalized, Math.max(first.slot, second.slot))
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
        expectRolledBackTo(run, finalized, base.slot)
    })

    it('stops instead of writing over finalized data on a reorg deeper than the window', async () => {
        await startChain(20)
        let db = new MemoryHotDatabase()
        let run = startProcessor(rpcSource(40), db)
        let head = await settle(db)
        let before = new Map(db.rows)

        chain.reorg({depth: head - db.finalizedHeight + 2})
        chain.mineTo(40)

        await expect(run.done).rejects.toThrow('Unable to process fork')
        expect(db.rows).toEqual(before)
    })
})
