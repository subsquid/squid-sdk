import {TypeormDatabase} from '../database'
import {Data} from './lib/model'
import {getEntityManager, useDatabase} from './util'

describe('TypeormDatabase — cascading reorgs', function () {
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

    it('two forks back-to-back leave only the latest branch behind', async function () {
        // Chain timeline:
        //
        //   main:    1 — 2 — 3 — 4 — 5
        //   reorg A:         3 — 4a — 5a — 6a       (fork at 3)
        //   reorg B:     2 — 3b — 4b — 5b — 6b — 7b (fork at 2, deeper)
        //
        // The test establishes each view in turn and asserts the final user
        // table contains exactly {main-1, main-2, fork-b-3..7b} — anything
        // from branch A must have been cleaned up by branch B's rollback.
        await db.connect()

        // 1) Main chain: 5 hot blocks with 'main-N' rows.
        await db.transactHot(
            {
                baseHead: {height: -1, hash: '0x'},
                newBlocks: Array.from({length: 5}, (_, i) => ({
                    height: i + 1,
                    hash: `main-${i + 1}`,
                })),
                finalizedHead: {height: -1, hash: '0x'},
            },
            async (store, block) => {
                await store.insert(new Data({id: `main-${block.height}`, text: `main-${block.height}`}))
            },
        )

        // 2) Reorg A: drop 4, 5; install 4a, 5a, 6a on top of main-3.
        await db.transactHot(
            {
                baseHead: {height: 3, hash: 'main-3'},
                newBlocks: [
                    {height: 4, hash: 'fork-a-4'},
                    {height: 5, hash: 'fork-a-5'},
                    {height: 6, hash: 'fork-a-6'},
                ],
                finalizedHead: {height: -1, hash: '0x'},
            },
            async (store, block) => {
                await store.insert(new Data({id: `fork-a-${block.height}`, text: `fork-a-${block.height}`}))
            },
        )

        const em = await getEntityManager()

        // Intermediate check: main-1, main-2, main-3, fork-a-4, fork-a-5, fork-a-6.
        const afterA = (await em.find(Data, {order: {id: 'asc'}})).map((r) => r.id)
        expect(afterA).toEqual(['fork-a-4', 'fork-a-5', 'fork-a-6', 'main-1', 'main-2', 'main-3'])

        // 3) Reorg B: deeper — drop main-3, fork-a-4..6; install
        //    fork-b-3..7 on top of main-2.
        await db.transactHot(
            {
                baseHead: {height: 2, hash: 'main-2'},
                newBlocks: Array.from({length: 5}, (_, i) => ({
                    height: i + 3,
                    hash: `fork-b-${i + 3}`,
                })),
                finalizedHead: {height: -1, hash: '0x'},
            },
            async (store, block) => {
                await store.insert(new Data({id: `fork-b-${block.height}`, text: `fork-b-${block.height}`}))
            },
        )

        // Final: only main-1..2 and fork-b-3..7 remain.
        const afterB = (await em.find(Data, {order: {id: 'asc'}})).map((r) => r.id)
        expect(afterB).toEqual(['fork-b-3', 'fork-b-4', 'fork-b-5', 'fork-b-6', 'fork-b-7', 'main-1', 'main-2'])

        // Every fork-a row must be gone — no trace on any table.
        expect(await em.count(Data, {where: {id: 'fork-a-4'}})).toBe(0)
        expect(await em.count(Data, {where: {id: 'fork-a-5'}})).toBe(0)
        expect(await em.count(Data, {where: {id: 'fork-a-6'}})).toBe(0)

        // hot_block reflects the current view only: main-1, main-2, fork-b-3..7.
        const hotBlocks = (await em.query('SELECT height, hash FROM squid_processor.hot_block ORDER BY height')).map(
            (r: {height: number; hash: string}) => ({height: r.height, hash: r.hash}),
        )
        expect(hotBlocks).toEqual([
            {height: 1, hash: 'main-1'},
            {height: 2, hash: 'main-2'},
            {height: 3, hash: 'fork-b-3'},
            {height: 4, hash: 'fork-b-4'},
            {height: 5, hash: 'fork-b-5'},
            {height: 6, hash: 'fork-b-6'},
            {height: 7, hash: 'fork-b-7'},
        ])

        // hot_change_log, via cascade, must not reference any fork-a or
        // old main-3..5 block heights.
        const changeLogHeights: number[] = (
            await em.query('SELECT DISTINCT block_height FROM squid_processor.hot_change_log ORDER BY block_height')
        ).map((r: {block_height: number}) => r.block_height)
        // Note: since main-3 now has been rolled back along with fork-a,
        // and replaced by fork-b-3, we expect change_log entries at exactly
        // the current top[] heights.
        expect(changeLogHeights).toEqual([1, 2, 3, 4, 5, 6, 7])

        // Post-reconnect state agrees.
        await db.disconnect()
        const state = await db.connect()
        expect(state).toMatchObject({height: -1, hash: '0x'})
        expect(state.top.map((b) => b.hash)).toEqual([
            'main-1',
            'main-2',
            'fork-b-3',
            'fork-b-4',
            'fork-b-5',
            'fork-b-6',
            'fork-b-7',
        ])
    })
})
