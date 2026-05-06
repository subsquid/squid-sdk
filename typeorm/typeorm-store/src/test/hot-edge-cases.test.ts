import {TypeormDatabase} from '../database'
import {IdOnly, Item} from './lib/model'
import {getEntityManager, useDatabase} from './util'

describe('TypeormDatabase — hot-path edge cases', function () {
    useDatabase([
        'CREATE TABLE item (id text primary key, name text)',
        `CREATE TABLE "data" (
            id text primary key,
            "text" text,
            text_array text[],
            "integer" int4,
            integer_array int4[],
            big_integer numeric,
            date_time timestamp with time zone,
            "bytes" bytea,
            "json" jsonb,
            item_id text references item
        )`,
        'CREATE TABLE id_only (id text primary key)',
    ])

    let db!: TypeormDatabase

    beforeEach(() => {
        db = new TypeormDatabase({projectDir: __dirname, supportHotBlocks: true})
    })

    afterEach(() => db?.disconnect())

    it('processes a hot update whose finalizedHead trails our committed finalized state', async function () {
        await db.connect()

        // Gateway commits blocks 0..999 as finalized in a single big batch.
        await db.transact(
            {
                prevHead: {height: -1, hash: '0x'},
                nextHead: {height: 999, hash: 'h-999'},
            },
            async () => {},
        )

        // RPC hot update arrives carrying a stale finalizedHead (995 < 999).
        // Should be accepted: we already know more than the RPC does about
        // finality, and there's nothing to "race" against.
        await db.transactHot2(
            {
                baseHead: {height: 999, hash: 'h-999'},
                newBlocks: [{height: 1000, hash: 'h-1000'}],
                finalizedHead: {height: 995, hash: 'h-995'},
            },
            async () => {},
        )
    })

    it('does not emit RACE_MSG for empty newBlocks with a non-tip baseHead', async function () {
        await db.connect()

        // Establish a 3-block hot chain.
        await db.transactHot2(
            {
                baseHead: {height: -1, hash: '0x'},
                newBlocks: [
                    {height: 0, hash: 'h-0'},
                    {height: 1, hash: 'h-1'},
                    {height: 2, hash: 'h-2'},
                ],
                finalizedHead: {height: -1, hash: '0x'},
            },
            async () => {},
        )

        // Empty newBlocks with baseHead at the middle of the hot chain.
        let error: unknown
        try {
            await db.transactHot2(
                {
                    baseHead: {height: 1, hash: 'h-1'},
                    newBlocks: [],
                    finalizedHead: {height: -1, hash: '0x'},
                },
                async () => {},
            )
        } catch (e) {
            error = e
        }

        // Either no error, or the error message names the real problem
        // (empty update / non-tip baseHead). The misleading
        // "status table was updated by foreign process" is specifically
        // forbidden.
        expect(String(error ?? '')).not.toMatch(/status table was updated by foreign process/)
    })

    it('rollbackBlock restores an id-only entity after remove', async function () {
        // Pre-insert an id-only row via the finalized path.
        await db.connect()
        await db.transact({prevHead: {height: -1, hash: '0x'}, nextHead: {height: 0, hash: 'h-0'}}, async (store) => {
            await store.insert(new IdOnly('x'))
        })

        const em = await getEntityManager()
        expect(await em.count(IdOnly)).toBe(1)

        // Hot block removes the row. The tracker's DELETE log entry has
        // fields = {} because IdOnly has no columns besides the primary key
        // — the rollback has to cope with an empty fields set.
        await db.transactHot(
            {
                baseHead: {height: 0, hash: 'h-0'},
                newBlocks: [{height: 1, hash: 'h-1'}],
                finalizedHead: {height: 0, hash: 'h-0'},
            },
            async (store) => {
                await store.remove(IdOnly, 'x')
            },
        )
        expect(await em.count(IdOnly)).toBe(0)

        // Reorg the hot block away: the tracked DELETE must be reverted and
        // the row must reappear. This is the invariant "after full rollback,
        // table state equals pre-block state" — the whole point of the
        // change log, so the id-only row has to come back even though its
        // logged fields={} triggers no SET clauses in any UPDATE.
        await db.transactHot(
            {
                baseHead: {height: 0, hash: 'h-0'},
                newBlocks: [{height: 1, hash: 'h-1-alt'}],
                finalizedHead: {height: 0, hash: 'h-0'},
            },
            async () => {},
        )

        expect(await em.count(IdOnly)).toBe(1)
        const restored = await em.findOneOrFail(IdOnly, {where: {id: 'x'}})
        expect(restored.id).toBe('x')
    })

    it('rollbackBlock restores a non-id entity field after hot-block update', async function () {
        // Parity counterpart to the id-only test above. Here Item has a real
        // non-id column (`name`), so the rollback must actually execute an
        // UPDATE ... SET name = <prev> to restore the pre-block value.
        //
        // The reason this mirror exists: in rollbackBlock the UPDATE branch
        // is guarded by
        //     if (setPairs.length) { UPDATE ... SET ... }
        // For id-only entities setPairs is empty and the branch silently
        // skips (happens to be correct — nothing to restore). A future
        // regression that unintentionally emptied setPairs for entities WITH
        // non-id columns would pass the id-only test above while breaking
        // real rollback semantics. This test detects that.
        await db.connect()

        // Pre-insert via finalized path: Item('i1', name='initial').
        await db.transact({prevHead: {height: -1, hash: '0x'}, nextHead: {height: 0, hash: 'h-0'}}, async (store) => {
            await store.insert(new Item('i1', 'initial'))
        })

        const em = await getEntityManager()
        expect((await em.findOneOrFail(Item, {where: {id: 'i1'}})).name).toBe('initial')

        // Hot block flips the name. ChangeTracker records the UPDATE with
        // fields = {name: 'initial'} — the pre-image.
        await db.transactHot(
            {
                baseHead: {height: 0, hash: 'h-0'},
                newBlocks: [{height: 1, hash: 'h-1'}],
                finalizedHead: {height: 0, hash: 'h-0'},
            },
            async (store) => {
                const item = await store.findOneOrFail(Item, {where: {id: 'i1'}})
                item.name = 'changed'
                await store.save(item)
            },
        )
        expect((await em.findOneOrFail(Item, {where: {id: 'i1'}})).name).toBe('changed')

        // Reorg: the UPDATE must be reverted — setPairs is non-empty here, so
        // the `if (setPairs.length)` branch actually runs and restores 'initial'.
        await db.transactHot(
            {
                baseHead: {height: 0, hash: 'h-0'},
                newBlocks: [{height: 1, hash: 'h-1-alt'}],
                finalizedHead: {height: 0, hash: 'h-0'},
            },
            async () => {},
        )

        expect((await em.findOneOrFail(Item, {where: {id: 'i1'}})).name).toBe('initial')
    })

    it('connect() reconstructs a sparse top[] with height gaps (skipped-slot chains)', async function () {
        // First connect to make sure the squid_processor schema and the
        // hot_block / status tables exist.
        await db.connect()
        await db.disconnect()

        // Insert hot_block rows with deliberate gaps — the kind of shape a
        // Solana-style chain (skipped slots) would produce. The typeorm-store
        // invariant on top[] is strictly increasing, NOT strictly +1, so
        // these rows must survive a round-trip through connect(). Each row
        // is paired with its sentinel hot_change_log marker so connect()'s
        // orphan-cleanup keeps them.
        const em = await getEntityManager()
        await em.query(`
            INSERT INTO squid_processor.hot_block (height, hash) VALUES
                (100, 'slot-100'),
                (103, 'slot-103'),
                (105, 'slot-105')
        `)
        await em.query(`
            INSERT INTO squid_processor.hot_change_log (block_height, index, change) VALUES
                (100, 0, '{"kind":"sentinel"}'::jsonb),
                (103, 0, '{"kind":"sentinel"}'::jsonb),
                (105, 0, '{"kind":"sentinel"}'::jsonb)
        `)

        // Re-bind a fresh instance because the original was disconnected.
        db = new TypeormDatabase({projectDir: __dirname, supportHotBlocks: true})
        const state = await db.connect()

        expect(state.top.map((b) => ({height: b.height, hash: b.hash}))).toEqual([
            {height: 100, hash: 'slot-100'},
            {height: 103, hash: 'slot-103'},
            {height: 105, hash: 'slot-105'},
        ])
    })
})
