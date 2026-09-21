import {buildChain, forkAt, joinFork, type MockBlock} from '@subsquid/util-internal-testing'
import type {RangeRequestList} from '@subsquid/util-internal-range'
import type {ListeningServer} from '@subsquid/util-internal-prometheus-server'
import {createLogger} from '@subsquid/logger'
import {describe, expect, it} from 'vitest'
import type {FinalDatabase, FinalTxInfo, HashAndHeight, HotDatabase, HotDatabaseState, HotTxInfo} from '../database'
import type {Batch, Block, DataSource, HotDataSource, HotUpdate} from '../datasource'
import {PrometheusServer} from '../prometheus'
import {Runner} from '../runner'

// Placeholder "no-payload" request type for the Runner's generic R.
type EmptyRequest = Record<string, never>

// Adapter from a flat list of MockBlock headers to the Runner's Block shape.
function wrapHeaders(headers: MockBlock[]): Block[] {
    return headers.map((header) => ({header}))
}

// Minimal in-process DataSource that serves a pre-built chain. Yields the
// entire (intersected) range as a single batch — Runner is responsible for
// commit batching; the source just has to provide blocks in order.
class InProcessSource<R> implements DataSource<Block, R> {
    constructor(private chain: Block[]) {}

    async getFinalizedHeight(): Promise<number> {
        if (this.chain.length === 0) return -1
        return this.chain[this.chain.length - 1].header.height
    }

    async getBlockHash(height: number): Promise<string | undefined> {
        return this.chain.find((b) => b.header.height === height)?.header.hash
    }

    async *getFinalizedBlocks(requests: RangeRequestList<R>, _stopOnHead?: boolean): AsyncIterable<Batch<Block>> {
        if (requests.length === 0) return
        const from = requests[0].range.from
        const to = requests[requests.length - 1].range.to ?? Number.POSITIVE_INFINITY

        const blocks = this.chain.filter((b) => b.header.height >= from && b.header.height <= to)
        if (blocks.length === 0) return

        yield {blocks, isHead: true}
    }
}

// In-memory FinalDatabase stub that records every transact call so tests can
// assert what Runner asked the persistence layer to do.
interface RecordedTransact {
    prevHead: HashAndHeight
    nextHead: HashAndHeight
    isOnTop: boolean
    blocks: Block[]
}

interface RecorderStore {
    blocks: Block[]
}

class RecordingDatabase implements FinalDatabase<RecorderStore> {
    supportsHotBlocks: false = false
    head: HashAndHeight = {height: -1, hash: '0x'}
    transacts: RecordedTransact[] = []

    async connect(): Promise<HashAndHeight> {
        return this.head
    }

    async transact(info: FinalTxInfo, cb: (store: RecorderStore) => Promise<void>): Promise<void> {
        const store: RecorderStore = {blocks: []}
        await cb(store)
        this.transacts.push({
            prevHead: info.prevHead,
            nextHead: info.nextHead,
            isOnTop: info.isOnTop,
            blocks: store.blocks,
        })
        this.head = info.nextHead
    }
}

// HotDataSource stub that serves its chain as "all hot" (getFinalizedHeight
// stays at -1) and emits a programmable queue of HotUpdates via
// processHotBlocks. The queue is consumed once and the method returns, at
// which point Runner.run() also returns.
class InProcessHotSource<R> implements HotDataSource<Block, R> {
    private hotUpdates: HotUpdate<Block>[] = []

    constructor(private chain: Block[]) {}

    enqueueHotUpdate(update: HotUpdate<Block>): void {
        this.hotUpdates.push(update)
    }

    async getFinalizedHeight(): Promise<number> {
        // Nothing finalized — every chain block is "hot" for the test.
        return -1
    }

    async getBlockHash(height: number): Promise<string | undefined> {
        return this.chain.find((b) => b.header.height === height)?.header.hash
    }

    // biome-ignore lint/correctness/useYield: finalized range is intentionally empty
    async *getFinalizedBlocks(_requests: RangeRequestList<R>, _stopOnHead?: boolean): AsyncIterable<Batch<Block>> {
        // No finalized blocks to serve — everything is handled through the
        // hot path.
    }

    async processHotBlocks(
        _requests: RangeRequestList<R>,
        _state: HotDatabaseState,
        cb: (upd: HotUpdate<Block>) => Promise<void>,
    ): Promise<void> {
        for (const upd of this.hotUpdates) {
            await cb(upd)
        }
    }
}

interface RecordedHotTransact {
    info: HotTxInfo
    blocks: Block[]
}

// HotDatabase stub. transactHot2 records the info (finalizedHead, baseHead,
// newBlocks as HashAndHeight[]) and the store writes captured by the
// callback. State-update logic is intentionally minimal — Runner only reads
// state once at startup via connect(), so accurate state tracking across
// subsequent hot transacts isn't needed for these tests.
class RecordingHotDatabase implements HotDatabase<RecorderStore> {
    supportsHotBlocks: true = true
    state: HotDatabaseState = {height: -1, hash: '0x', top: []}
    transacts: RecordedTransact[] = []
    hotTransacts: RecordedHotTransact[] = []

    async connect(): Promise<HotDatabaseState> {
        return this.state
    }

    async transact(info: FinalTxInfo, cb: (store: RecorderStore) => Promise<void>): Promise<void> {
        const store: RecorderStore = {blocks: []}
        await cb(store)
        this.transacts.push({
            prevHead: info.prevHead,
            nextHead: info.nextHead,
            isOnTop: info.isOnTop,
            blocks: store.blocks,
        })
        this.state = {height: info.nextHead.height, hash: info.nextHead.hash, top: []}
    }

    async transactHot(
        info: HotTxInfo,
        cb: (store: RecorderStore, block: HashAndHeight) => Promise<void>,
    ): Promise<void> {
        const store: RecorderStore = {blocks: []}
        for (const ref of info.newBlocks) {
            await cb(store, ref)
        }
        this.hotTransacts.push({info, blocks: store.blocks})
    }

    async transactHot2(
        info: HotTxInfo,
        cb: (store: RecorderStore, sliceBeg: number, sliceEnd: number) => Promise<void>,
    ): Promise<void> {
        const store: RecorderStore = {blocks: []}
        await cb(store, 0, info.newBlocks.length)
        this.hotTransacts.push({info, blocks: store.blocks})
    }
}

// PrometheusServer that doesn't bind to a real port.
class NoopPrometheusServer extends PrometheusServer {
    override async serve(): Promise<ListeningServer> {
        return {
            port: 0,
            close: () => Promise.resolve(),
        } as ListeningServer
    }
}

describe('Runner', () => {
    it('drives finalized blocks from DataSource to Database with the expected prevHead/nextHead', async () => {
        const headers = buildChain({from: 0, to: 4}) // 5 blocks
        const chain = wrapHeaders(headers)

        const source = new InProcessSource<EmptyRequest>(chain)
        const db = new RecordingDatabase()
        const prometheus = new NoopPrometheusServer()

        const runner = new Runner<EmptyRequest, RecorderStore>({
            archive: source,
            requests: [{range: {from: 0, to: 4}, request: {} as EmptyRequest}],
            database: db,
            log: createLogger('test-runner'),
            prometheus,
            process: async (store, batch) => {
                for (const block of batch.blocks) {
                    store.blocks.push(block)
                }
            },
        })

        await runner.run()

        // Exactly one commit, covering all 5 blocks. prevHead and nextHead
        // are passed to transact() in the HotDatabaseState shape (with an
        // empty `top`), so assert on the height/hash fields only.
        expect(db.transacts).toHaveLength(1)
        const only = db.transacts[0]
        expect(only.prevHead).toMatchObject({height: -1, hash: '0x'})
        expect(only.nextHead).toMatchObject({height: 4, hash: '0x4'})
        expect(only.isOnTop).toBe(true)
        expect(only.blocks.map((b) => b.header.height)).toEqual([0, 1, 2, 3, 4])

        // Head advanced to the last block.
        expect(db.head).toMatchObject({height: 4, hash: '0x4'})
    })

    it('drives hot blocks: a single HotUpdate lands in transactHot2', async () => {
        // Three-block chain, everything in the hot path (no finalized
        // advancement). A single HotUpdate carries all three blocks;
        // Runner should invoke transactHot2 once with the right shape.
        const headers = buildChain({from: 0, to: 2})
        const chain = wrapHeaders(headers)

        const source = new InProcessHotSource<EmptyRequest>(chain)
        source.enqueueHotUpdate({
            blocks: chain,
            baseHead: {height: -1, hash: '0x'},
            finalizedHead: {height: -1, hash: '0x'},
        })

        const db = new RecordingHotDatabase()

        const runner = new Runner<EmptyRequest, RecorderStore>({
            hotDataSource: source,
            requests: [{range: {from: 0, to: 2}, request: {} as EmptyRequest}],
            database: db,
            log: createLogger('test-runner'),
            prometheus: new NoopPrometheusServer(),
            process: async (store, batch) => {
                for (const block of batch.blocks) {
                    store.blocks.push(block)
                }
            },
        })

        await runner.run()

        expect(db.hotTransacts).toHaveLength(1)
        const only = db.hotTransacts[0]
        expect(only.info.baseHead).toMatchObject({height: -1, hash: '0x'})
        expect(only.info.finalizedHead).toMatchObject({height: -1, hash: '0x'})
        expect(only.info.newBlocks.map((b) => ({height: b.height, hash: b.hash}))).toEqual([
            {height: 0, hash: '0x0'},
            {height: 1, hash: '0x1'},
            {height: 2, hash: '0x2'},
        ])
        expect(only.blocks.map((b) => b.header.height)).toEqual([0, 1, 2])
    })

    it('drives a shallow reorg: two HotUpdates, second with baseHead below the first tip', async () => {
        // Main chain: 0..4. Fork branch at height 2 (anchor), length 2
        // produces 3a, 4a. The HotDataSource emits the main chain as the
        // first HotUpdate, then a second update representing the reorg —
        // Runner must call transactHot2 twice, and the second info.baseHead
        // must sit at the common ancestor.
        const mainHeaders = buildChain({from: 0, to: 4})
        const main = wrapHeaders(mainHeaders)

        const forkHeaders = forkAt(mainHeaders, {at: 2, length: 2, suffix: 'a'})
        const fork = wrapHeaders(forkHeaders)

        // Source view "after reorg": main 0..2 + fork 3a, 4a. getBlockHash
        // resolves against this post-reorg chain (what a data source would
        // realistically remember once the fork has been accepted).
        const postReorg = wrapHeaders(joinFork(mainHeaders, forkHeaders))
        const source = new InProcessHotSource<EmptyRequest>(postReorg)

        source.enqueueHotUpdate({
            blocks: main,
            baseHead: {height: -1, hash: '0x'},
            finalizedHead: {height: -1, hash: '0x'},
        })
        source.enqueueHotUpdate({
            blocks: fork,
            baseHead: {height: 2, hash: '0x2'},
            finalizedHead: {height: -1, hash: '0x'},
        })

        const db = new RecordingHotDatabase()

        const runner = new Runner<EmptyRequest, RecorderStore>({
            hotDataSource: source,
            requests: [{range: {from: 0, to: 4}, request: {} as EmptyRequest}],
            database: db,
            log: createLogger('test-runner'),
            prometheus: new NoopPrometheusServer(),
            process: async (store, batch) => {
                for (const block of batch.blocks) {
                    store.blocks.push(block)
                }
            },
        })

        await runner.run()

        expect(db.hotTransacts).toHaveLength(2)

        const firstPass = db.hotTransacts[0]
        expect(firstPass.info.baseHead).toMatchObject({height: -1, hash: '0x'})
        expect(firstPass.info.newBlocks.map((b) => b.hash)).toEqual(['0x0', '0x1', '0x2', '0x3', '0x4'])

        const reorg = db.hotTransacts[1]
        expect(reorg.info.baseHead).toMatchObject({height: 2, hash: '0x2'})
        expect(reorg.info.newBlocks.map((b) => b.hash)).toEqual(['0x3a', '0x4a'])
    })

    it('drives a deep reorg (>10 blocks) inside the hot queue', async () => {
        // Main chain: 0..12 (13 blocks). Fork at height 3, length 9 → fork
        // replaces blocks 4..12 (9 blocks) with 4a..12a.
        const mainHeaders = buildChain({from: 0, to: 12})
        const main = wrapHeaders(mainHeaders)
        const forkHeaders = forkAt(mainHeaders, {at: 3, length: 9, suffix: 'a'})
        const fork = wrapHeaders(forkHeaders)

        const postReorg = wrapHeaders(joinFork(mainHeaders, forkHeaders))
        const source = new InProcessHotSource<EmptyRequest>(postReorg)

        source.enqueueHotUpdate({
            blocks: main,
            baseHead: {height: -1, hash: '0x'},
            finalizedHead: {height: -1, hash: '0x'},
        })
        source.enqueueHotUpdate({
            blocks: fork,
            baseHead: {height: 3, hash: '0x3'},
            finalizedHead: {height: -1, hash: '0x'},
        })

        const db = new RecordingHotDatabase()

        const runner = new Runner<EmptyRequest, RecorderStore>({
            hotDataSource: source,
            requests: [{range: {from: 0, to: 12}, request: {} as EmptyRequest}],
            database: db,
            log: createLogger('test-runner'),
            prometheus: new NoopPrometheusServer(),
            process: async (store, batch) => {
                for (const block of batch.blocks) {
                    store.blocks.push(block)
                }
            },
        })

        await runner.run()

        expect(db.hotTransacts).toHaveLength(2)
        const reorg = db.hotTransacts[1]
        expect(reorg.info.baseHead).toMatchObject({height: 3, hash: '0x3'})
        expect(reorg.info.newBlocks.map((b) => b.hash)).toEqual([
            '0x4a',
            '0x5a',
            '0x6a',
            '0x7a',
            '0x8a',
            '0x9a',
            '0x10a',
            '0x11a',
            '0x12a',
        ])
    })

    it('drives cascading reorgs: two fork branches back-to-back', async () => {
        // main:    0 — 1 — 2 — 3 — 4
        // reorg A: 0 — 1 — 2 — 3 — 4 — 5a — 6a        (fork at 4 in chain tip style)
        // reorg B: 0 — 1 — 2 — 3b — 4b — 5b — 6b — 7b (fork at 2, goes deeper than branch A)
        //
        // Three HotUpdates total; the third's baseHead is below the
        // previous reorg's baseHead, proving Runner forwards baseHead
        // unchanged (doesn't try to collapse or re-anchor the sequence).
        const mainHeaders = buildChain({from: 0, to: 4})
        const main = wrapHeaders(mainHeaders)

        const branchAHeaders = forkAt(mainHeaders, {at: 4, length: 2, suffix: 'a'}) // 5a, 6a
        const branchA = wrapHeaders(branchAHeaders)
        const afterAHeaders = joinFork(mainHeaders, branchAHeaders)

        const branchBHeaders = forkAt(afterAHeaders, {at: 2, length: 5, suffix: 'b'}) // 3b..7b
        const branchB = wrapHeaders(branchBHeaders)

        const finalView = wrapHeaders(joinFork(afterAHeaders, branchBHeaders))
        const source = new InProcessHotSource<EmptyRequest>(finalView)

        source.enqueueHotUpdate({
            blocks: main,
            baseHead: {height: -1, hash: '0x'},
            finalizedHead: {height: -1, hash: '0x'},
        })
        source.enqueueHotUpdate({
            blocks: branchA,
            baseHead: {height: 4, hash: '0x4'},
            finalizedHead: {height: -1, hash: '0x'},
        })
        source.enqueueHotUpdate({
            blocks: branchB,
            baseHead: {height: 2, hash: '0x2'},
            finalizedHead: {height: -1, hash: '0x'},
        })

        const db = new RecordingHotDatabase()

        const runner = new Runner<EmptyRequest, RecorderStore>({
            hotDataSource: source,
            requests: [{range: {from: 0, to: 7}, request: {} as EmptyRequest}],
            database: db,
            log: createLogger('test-runner'),
            prometheus: new NoopPrometheusServer(),
            process: async (store, batch) => {
                for (const block of batch.blocks) {
                    store.blocks.push(block)
                }
            },
        })

        await runner.run()

        expect(db.hotTransacts).toHaveLength(3)
        expect(db.hotTransacts[0].info.baseHead).toMatchObject({height: -1, hash: '0x'})
        expect(db.hotTransacts[1].info.baseHead).toMatchObject({height: 4, hash: '0x4'})
        expect(db.hotTransacts[1].info.newBlocks.map((b) => b.hash)).toEqual(['0x5a', '0x6a'])
        expect(db.hotTransacts[2].info.baseHead).toMatchObject({height: 2, hash: '0x2'})
        expect(db.hotTransacts[2].info.newBlocks.map((b) => b.hash)).toEqual(['0x3b', '0x4b', '0x5b', '0x6b', '0x7b'])
    })

    it('drives the archive → hot handoff: archive commits finalized, hot picks up the rest', async () => {
        // Full chain 0..8. Archive serves 0..5 as finalized, hot emits a
        // HotUpdate covering 6..8 on top. This is the main production shape
        // (gateway + RPC) and exercises both data sources in one Runner run.
        const fullHeaders = buildChain({from: 0, to: 8})
        const finalizedHeaders = fullHeaders.slice(0, 6) // 0..5
        const hotHeaders = fullHeaders.slice(6) // 6..8

        const archive = new InProcessSource<EmptyRequest>(wrapHeaders(finalizedHeaders))
        // Hot source needs to know the full chain for getBlockHash —
        // assertWeAreOnTheSameChain(hot, state={5,'0x5',...}) will probe
        // it after the archive pass commits.
        const hot = new InProcessHotSource<EmptyRequest>(wrapHeaders(fullHeaders))

        // Archive-level finalized head matches the hot-source finalized
        // view so the handoff happens cleanly — Runner skips a second
        // finalized pass once the hot source's finalizedHeight = 5 matches
        // the state just committed by archive.
        hot.getFinalizedHeight = async () => 5

        hot.enqueueHotUpdate({
            blocks: wrapHeaders(hotHeaders),
            baseHead: {height: 5, hash: '0x5'},
            finalizedHead: {height: 5, hash: '0x5'},
        })

        const db = new RecordingHotDatabase()

        const runner = new Runner<EmptyRequest, RecorderStore>({
            archive,
            hotDataSource: hot,
            requests: [{range: {from: 0, to: 8}, request: {} as EmptyRequest}],
            database: db,
            log: createLogger('test-runner'),
            prometheus: new NoopPrometheusServer(),
            process: async (store, batch) => {
                for (const block of batch.blocks) {
                    store.blocks.push(block)
                }
            },
        })

        await runner.run()

        // Archive committed the finalized range via transact().
        expect(db.transacts).toHaveLength(1)
        expect(db.transacts[0].prevHead).toMatchObject({height: -1, hash: '0x'})
        expect(db.transacts[0].nextHead).toMatchObject({height: 5, hash: '0x5'})
        expect(db.transacts[0].blocks.map((b) => b.header.height)).toEqual([0, 1, 2, 3, 4, 5])

        // Hot picked up from the finalized tip.
        expect(db.hotTransacts).toHaveLength(1)
        expect(db.hotTransacts[0].info.baseHead).toMatchObject({height: 5, hash: '0x5'})
        expect(db.hotTransacts[0].info.finalizedHead).toMatchObject({height: 5, hash: '0x5'})
        expect(db.hotTransacts[0].info.newBlocks.map((b) => b.hash)).toEqual(['0x6', '0x7', '0x8'])
    })

    it('forwards a finality-only HotUpdate (empty newBlocks, advanced finalizedHead) to transactHot2', async () => {
        // Shape a data source would emit when finality advances without a
        // new best tip: blocks=[], finalizedHead above the prior one. Runner
        // must forward this through to transactHot2 unchanged — it is the
        // persistence layer's job to decide what "empty newBlocks with
        // advanced finalizedHead" means, not Runner's to filter.
        const mainHeaders = buildChain({from: 0, to: 2})
        const main = wrapHeaders(mainHeaders)
        const source = new InProcessHotSource<EmptyRequest>(main)

        // Seed the chain with three hot blocks…
        source.enqueueHotUpdate({
            blocks: main,
            baseHead: {height: -1, hash: '0x'},
            finalizedHead: {height: -1, hash: '0x'},
        })
        // …then emit a no-new-blocks update advancing finality to block 1.
        source.enqueueHotUpdate({
            blocks: [],
            baseHead: {height: 2, hash: '0x2'},
            finalizedHead: {height: 1, hash: '0x1'},
        })

        const db = new RecordingHotDatabase()

        const runner = new Runner<EmptyRequest, RecorderStore>({
            hotDataSource: source,
            requests: [{range: {from: 0, to: 2}, request: {} as EmptyRequest}],
            database: db,
            log: createLogger('test-runner'),
            prometheus: new NoopPrometheusServer(),
            process: async () => {},
        })

        await runner.run()

        expect(db.hotTransacts).toHaveLength(2)
        const finalityOnly = db.hotTransacts[1]
        expect(finalityOnly.info.newBlocks).toEqual([])
        expect(finalityOnly.info.baseHead).toMatchObject({height: 2, hash: '0x2'})
        expect(finalityOnly.info.finalizedHead).toMatchObject({height: 1, hash: '0x1'})
    })

    it('forwards a mixed finalized+hot HotUpdate: info.finalizedHead below newBlocks tip', async () => {
        // HotUpdate carries blocks whose tip is above the accompanying
        // finalizedHead — e.g. blocks 0..4 with finalizedHead = 2. Runner
        // must pass `info.finalizedHead` through untouched so the persistence
        // layer can split the batch at the boundary.
        const headers = buildChain({from: 0, to: 4})
        const chain = wrapHeaders(headers)
        const source = new InProcessHotSource<EmptyRequest>(chain)

        source.enqueueHotUpdate({
            blocks: chain,
            baseHead: {height: -1, hash: '0x'},
            finalizedHead: {height: 2, hash: '0x2'},
        })

        const db = new RecordingHotDatabase()

        const runner = new Runner<EmptyRequest, RecorderStore>({
            hotDataSource: source,
            requests: [{range: {from: 0, to: 4}, request: {} as EmptyRequest}],
            database: db,
            log: createLogger('test-runner'),
            prometheus: new NoopPrometheusServer(),
            process: async (store, batch) => {
                for (const block of batch.blocks) {
                    store.blocks.push(block)
                }
            },
        })

        await runner.run()

        expect(db.hotTransacts).toHaveLength(1)
        const only = db.hotTransacts[0]
        expect(only.info.finalizedHead).toMatchObject({height: 2, hash: '0x2'})
        expect(only.info.newBlocks.map((b) => b.height)).toEqual([0, 1, 2, 3, 4])
        // Runner hands all five blocks to the user callback in one batch
        // with isHead = true on the last slice invocation.
        expect(only.blocks.map((b) => b.header.height)).toEqual([0, 1, 2, 3, 4])
    })

    it('falls back to transactHot when the database does not implement transactHot2', async () => {
        // Production databases that only implement the deprecated
        // transactHot (no transactHot2) must still run end-to-end. Runner
        // has a `db.transactHot2 ?? db.transactHot` branch — this test
        // exercises the else path per-block.
        const headers = buildChain({from: 0, to: 2})
        const chain = wrapHeaders(headers)
        const source = new InProcessHotSource<EmptyRequest>(chain)

        source.enqueueHotUpdate({
            blocks: chain,
            baseHead: {height: -1, hash: '0x'},
            finalizedHead: {height: -1, hash: '0x'},
        })

        // A HotDatabase that only ever exposes transactHot (transactHot2
        // set to undefined so the Runner's `?.` check picks the fallback).
        const db = new RecordingHotDatabase()
        ;(db as unknown as {transactHot2?: unknown}).transactHot2 = undefined

        const perBlockInvocations: HashAndHeight[] = []

        const runner = new Runner<EmptyRequest, RecorderStore>({
            hotDataSource: source,
            requests: [{range: {from: 0, to: 2}, request: {} as EmptyRequest}],
            database: db,
            log: createLogger('test-runner'),
            prometheus: new NoopPrometheusServer(),
            process: async (_store, batch) => {
                for (const block of batch.blocks) {
                    perBlockInvocations.push({height: block.header.height, hash: block.header.hash})
                }
            },
        })

        await runner.run()

        // transactHot was called once; the recorder normalises that call
        // into hotTransacts[0]. Per-block callback is invoked once per block
        // (transactHot contract).
        expect(db.hotTransacts).toHaveLength(1)
        expect(perBlockInvocations).toEqual([
            {height: 0, hash: '0x0'},
            {height: 1, hash: '0x1'},
            {height: 2, hash: '0x2'},
        ])
    })

    it('propagates errors thrown by the database transactHot2 call', async () => {
        // If the persistence layer fails mid-commit (disk full, network
        // drop, application bug in the handler), Runner must surface the
        // error rather than swallow it. Tests the crash-path contract.
        const headers = buildChain({from: 0, to: 1})
        const chain = wrapHeaders(headers)
        const source = new InProcessHotSource<EmptyRequest>(chain)

        source.enqueueHotUpdate({
            blocks: chain,
            baseHead: {height: -1, hash: '0x'},
            finalizedHead: {height: -1, hash: '0x'},
        })

        class ThrowingHotDatabase extends RecordingHotDatabase {
            override async transactHot2(): Promise<void> {
                throw new Error('simulated database crash')
            }
        }
        const db = new ThrowingHotDatabase()

        const runner = new Runner<EmptyRequest, RecorderStore>({
            hotDataSource: source,
            requests: [{range: {from: 0, to: 1}, request: {} as EmptyRequest}],
            database: db,
            log: createLogger('test-runner'),
            prometheus: new NoopPrometheusServer(),
            process: async () => {},
        })

        await expect(runner.run()).rejects.toThrow(/simulated database crash/)
    })

    it("forwards HotUpdate.baseHead to the database verbatim even when it isn't in state.top", async () => {
        // Runner doesn't validate baseHead against its own state — it forwards
        // the data source's HotUpdate into the database as-is. If the source
        // emits a baseHead pointing at a block the processor never committed,
        // that's the persistence layer's problem to catch (typeorm-store
        // does so via the assertChainContinuity + baseHeadPos RACE_MSG chain).
        const main = wrapHeaders(buildChain({from: 0, to: 2}))
        const source = new InProcessHotSource<EmptyRequest>(main)

        source.enqueueHotUpdate({
            blocks: main,
            // baseHead references a height the processor's state never had.
            // Runner must still pass it through unchanged.
            baseHead: {height: 99, hash: '0xdoesnotexist'},
            finalizedHead: {height: -1, hash: '0x'},
        })

        const db = new RecordingHotDatabase()

        const runner = new Runner<EmptyRequest, RecorderStore>({
            hotDataSource: source,
            requests: [{range: {from: 0, to: 2}, request: {} as EmptyRequest}],
            database: db,
            log: createLogger('test-runner'),
            prometheus: new NoopPrometheusServer(),
            process: async () => {},
        })

        await runner.run()

        expect(db.hotTransacts).toHaveLength(1)
        expect(db.hotTransacts[0].info.baseHead).toMatchObject({height: 99, hash: '0xdoesnotexist'})
    })

    it('accepts a hot data source whose finalizedHead never advances', async () => {
        // A data source that never reports finality (e.g. a Portal response
        // stream that omits the X-Sqd-Finalized-Head-* headers) must still
        // drive the Runner to completion — hot blocks accumulate, Runner
        // commits them, and state.finalizedHead stays at the initial
        // {-1, '0x'} value.
        const main = wrapHeaders(buildChain({from: 0, to: 3}))
        const source = new InProcessHotSource<EmptyRequest>(main)

        source.enqueueHotUpdate({
            blocks: main,
            baseHead: {height: -1, hash: '0x'},
            finalizedHead: {height: -1, hash: '0x'},
        })

        const db = new RecordingHotDatabase()

        const runner = new Runner<EmptyRequest, RecorderStore>({
            hotDataSource: source,
            requests: [{range: {from: 0, to: 3}, request: {} as EmptyRequest}],
            database: db,
            log: createLogger('test-runner'),
            prometheus: new NoopPrometheusServer(),
            process: async () => {},
        })

        await runner.run()

        expect(db.hotTransacts).toHaveLength(1)
        expect(db.hotTransacts[0].info.finalizedHead).toMatchObject({height: -1, hash: '0x'})
        expect(db.hotTransacts[0].info.newBlocks.map((b) => b.height)).toEqual([0, 1, 2, 3])
    })

    // Remaining Stage 4 scenarios from the roadmap. Each is either subsumed by
    // an already-covered test, belongs to a different Stage, or requires a
    // deeper integration than this file can usefully provide on its own.
    // Kept as explicit todos so the gap stays visible in the test report
    // until someone decides to address them.

    // groupSize > 1 mid-group baseHead. At the Runner layer it is
    // indistinguishable from any other shallow reorg — Runner forwards
    // whatever baseHead it gets. The groupSize-specific failure mode lives
    // inside typeorm-store.transactHot2, already covered by fork-deep.test.ts.
    it.todo('groupSize > 1 mid-group baseHead')

    // Deep EVM reorg end-to-end. Runner's legacy hot path uses HotProcessor
    // (its own moveToBlocks backtracker walks via getBlock), so it's
    // structurally immune to the Processor-side crash on ForkException-
    // based fork resolution — but the full end-to-end path from a mock
    // EVM RPC through EvmRpcDataSource.ensureContinuity + HotProcessor +
    // Runner + TypeormDatabase has never been exercised on a multi-block
    // reorg. Needed scenarios: (a) fork-point IS in current chain —
    // should resolve in a single HotProcessor pass; (b) fork-point below
    // current chain — HotProcessor must walk back via getBlock, fetching
    // intermediate headers. Both assert final user-table matches the new
    // chain and no exceptions leak past Runner. Requires a real EVM RPC
    // mock harness — deferred.
    it.todo('deep EVM reorg end-to-end: EvmRpcDataSource + HotProcessor + Runner + TypeormDatabase')

    // coldIngest over-fetch + empty split at stopOnHead boundary. These
    // are internal to util-internal-ingest-tools/cold.ts, which lives
    // below the Runner boundary. Tests belong with cold.ts, not here.
    it.todo('coldIngest over-fetch at stopOnHead boundary')
    it.todo('coldIngest empty split + isHead moving-top boundary')

    // — gapped top[] from typeorm-store → HotProcessor bridge. Requires
    // a real HotProcessor instance (not the in-process Runner stubs used
    // here) on top of a real TypeormDatabase returning a gap-structured
    // top[]. Stage 6 integration-test territory.
    it.todo('gapped top[] from DB → HotProcessor initialisation')
})
