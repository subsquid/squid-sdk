import {TypeormDatabase} from '../database'
import {Data} from './lib/model'
import {getEntityManager, useDatabase} from './util'

describe('TypeormDatabase — finality boundary', function () {
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
    ])

    let db!: TypeormDatabase

    beforeEach(() => {
        db = new TypeormDatabase({projectDir: __dirname, supportHotBlocks: true})
    })

    afterEach(() => db?.disconnect())

    it('finality-only update (empty newBlocks, baseHead at tip) advances status and purges newly-finalized hot_blocks', async function () {
        await db.connect()

        // Establish a three-block hot chain with no finalization yet.
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

        // Sanity: three hot_block rows, status still at genesis.
        const em = await getEntityManager()
        let hotHeights = (await em.query('SELECT height FROM squid_processor.hot_block ORDER BY height')).map(
            (r: {height: number}) => r.height,
        )
        expect(hotHeights).toEqual([0, 1, 2])
        let status = await em.query('SELECT height, hash FROM squid_processor.status')
        expect(status[0].height).toBe(-1)

        // Finality-only advance: baseHead at the current tip (h-2), no new
        // blocks, finalized moves from -1 to 1. Everything needed to decide
        // this is already on the caller side — no additional work expected
        // from the callback.
        await db.transactHot2(
            {
                baseHead: {height: 2, hash: 'h-2'},
                newBlocks: [],
                finalizedHead: {height: 1, hash: 'h-1'},
            },
            async () => {},
        )

        // status advanced to the new finalized head.
        status = await em.query('SELECT height, hash FROM squid_processor.status')
        expect(status[0].height).toBe(1)
        expect(status[0].hash).toBe('h-1')

        // hot_block rows at height ≤ 1 cascaded away; only h-2 remains as hot.
        hotHeights = (await em.query('SELECT height FROM squid_processor.hot_block ORDER BY height')).map(
            (r: {height: number}) => r.height,
        )
        expect(hotHeights).toEqual([2])

        // And the reconstructed state agrees.
        await db.disconnect()
        const state = await db.connect()
        expect(state).toMatchObject({height: 1, hash: 'h-1'})
        expect(state.top.map((b) => ({height: b.height, hash: b.hash}))).toEqual([{height: 2, hash: 'h-2'}])
    })

    it('mixed finalized+hot batch: finalized blocks have no change_log, hot blocks are rollback-addressable', async function () {
        await db.connect()

        // One transactHot2 call with newBlocks spanning the finality boundary.
        // h-5 .. h-7 are ≤ finalizedHead.height (7) and take the non-ChangeTracker
        // "finalized" path — their writes are permanent. h-8 .. h-9 are > 7 and
        // take the ChangeTracker "hot" path — their writes can be rolled back.
        await db.transactHot2(
            {
                baseHead: {height: -1, hash: '0x'},
                newBlocks: [
                    {height: 5, hash: 'h-5'},
                    {height: 6, hash: 'h-6'},
                    {height: 7, hash: 'h-7'},
                    {height: 8, hash: 'h-8'},
                    {height: 9, hash: 'h-9'},
                ],
                finalizedHead: {height: 7, hash: 'h-7'},
            },
            async (store, beg, end) => {
                for (let i = beg; i < end; i++) {
                    const height = 5 + i
                    await store.insert(new Data({id: `row-${height}`, text: `row-${height}`}))
                }
            },
        )

        const em = await getEntityManager()

        // User table has all five rows — the callback ran for every block.
        const ids = (await em.find(Data, {order: {id: 'asc'}})).map((r) => r.id)
        expect(ids).toEqual(['row-5', 'row-6', 'row-7', 'row-8', 'row-9'])

        // hot_block tracks only the hot blocks (h-8, h-9); finalized blocks
        // (h-5, h-6, h-7) are committed directly and never appear here.
        const hotBlocks = (await em.query('SELECT height FROM squid_processor.hot_block ORDER BY height')).map(
            (r: {height: number}) => r.height,
        )
        expect(hotBlocks).toEqual([8, 9])

        // hot_change_log mirrors that split: entries exist only for hot blocks.
        // Finalized rows (row-5..row-7) were inserted via the non-ChangeTracker
        // path, so they leave no rollback trail and can never be reverted.
        const changeLogHeights = (
            await em.query('SELECT DISTINCT block_height FROM squid_processor.hot_change_log ORDER BY block_height')
        ).map((r: {block_height: number}) => r.block_height)
        expect(changeLogHeights).toEqual([8, 9])

        // status was bumped to the finalized head and stayed there.
        const status = await em.query('SELECT height, hash FROM squid_processor.status')
        expect(status[0].height).toBe(7)
        expect(status[0].hash).toBe('h-7')

        // Reorg from the finalized tip: replace h-8 / h-9 with an alternate h-8'.
        // The rollback should revert only the hot-path inserts; anything from
        // the finalized path must stay put.
        await db.transactHot2(
            {
                baseHead: {height: 7, hash: 'h-7'},
                newBlocks: [{height: 8, hash: 'h-8-alt'}],
                finalizedHead: {height: 7, hash: 'h-7'},
            },
            async (store, beg, end) => {
                for (let i = beg; i < end; i++) {
                    await store.insert(new Data({id: 'row-8-alt', text: 'row-8-alt'}))
                }
            },
        )

        const postReorgIds = (await em.find(Data, {order: {id: 'asc'}})).map((r) => r.id)
        expect(postReorgIds).toEqual(['row-5', 'row-6', 'row-7', 'row-8-alt'])

        // Only the alt h-8 is tracked as hot now. CockroachDB returns ints
        // as strings — coerce to uniform number before comparing.
        const postHot = (await em.query('SELECT height, hash FROM squid_processor.hot_block ORDER BY height')).map(
            (r: {height: number | string; hash: string}) => ({height: Number(r.height), hash: r.hash}),
        )
        expect(postHot).toEqual([{height: 8, hash: 'h-8-alt'}])
    })

    it('transact unconditionally clears hot_block; transactHot2 only clears rows ≤ finalizedHead', async function () {
        // Pins inv-5 — the two finalization paths behave differently:
        //
        //   transactHot2 is surgical:
        //       DELETE FROM hot_block WHERE height <= $finalizedHead.height
        //     Hot rows ABOVE finalizedHead are preserved, still reversible.
        //
        //   transact is unconditional:
        //       for (i = state.top.length - 1; i >= 0; i--) rollbackBlock(top[i].height)
        //     Every single hot_block row is rolled back and removed,
        //     regardless of whether its height is above or below the new
        //     finalized head. After transact(), hot_block is empty.
        //
        // This divergence is deliberate — transact is the gateway/archive
        // path and by construction the caller knows there is no longer any
        // relevant hot state. But the asymmetry isn't obvious from the
        // interface, so we pin it as a test.
        await db.connect()

        // Build up 3 hot blocks (2, 3, 4) above a genesis finalized head.
        await db.transactHot2(
            {
                baseHead: {height: -1, hash: '0x'},
                newBlocks: [
                    {height: 2, hash: 'h-2'},
                    {height: 3, hash: 'h-3'},
                    {height: 4, hash: 'h-4'},
                ],
                finalizedHead: {height: -1, hash: '0x'},
            },
            async () => {},
        )

        const em = await getEntityManager()
        // CockroachDB returns int columns as strings via em.query; coerce.
        async function hotBlockHeights(): Promise<number[]> {
            const rows: Array<{height: number | string}> = await em.query(
                'SELECT height FROM squid_processor.hot_block ORDER BY height',
            )
            return rows.map((r) => Number(r.height))
        }

        expect(await hotBlockHeights()).toEqual([2, 3, 4])

        // --- Path 1: transactHot2 finalizes h-3. Only rows ≤ 3 are purged.
        await db.transactHot2(
            {
                baseHead: {height: 4, hash: 'h-4'},
                newBlocks: [],
                finalizedHead: {height: 3, hash: 'h-3'},
            },
            async () => {},
        )

        expect(await hotBlockHeights()).toEqual([4]) // height 4 above finalizedHead survives

        // --- Path 2: transact from the CURRENT state advances the finalized
        // head to 3 → 10. Its internal loop rolls back every remaining hot
        // block (just height 4 here), so hot_block ends empty — even though
        // height 4 is strictly ABOVE the new finalizedHead.height=10 cutoff
        // that transactHot2 would have applied. This is the unconditional-
        // wipe behavior we're pinning.
        await db.transact(
            {prevHead: {height: 3, hash: 'h-3'}, nextHead: {height: 10, hash: 'h-10'}},
            async () => {},
        )

        expect(await hotBlockHeights()).toEqual([])
    })
})
