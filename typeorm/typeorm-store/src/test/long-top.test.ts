import {TypeormDatabase} from '../database'
import {useDatabase} from './util'

describe('TypeormDatabase — long hot-block queue', function () {
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

    afterEach(() => db?.disconnect().catch(() => {}))

    it('insert of 1000 hot blocks + full rollback from genesis stays within a generous budget', async function () {
        await db.connect()

        // 1000 hot blocks. transactHot2 groups them at
        //     groupSize = floor(1000 / 100) = 10
        // so hot_block ends up with ~100 rows (one per group). Handler is
        // a no-op — we are measuring the database-layer cost of the
        // transact itself (hot_block inserts, change-log plumbing,
        // template tracker startup/teardown), not user work.
        const N = 1000
        const newBlocks = Array.from({length: N}, (_, i) => ({
            height: i,
            hash: `h-${i}`,
        }))

        const insertStart = Date.now()
        await db.transactHot2(
            {
                baseHead: {height: -1, hash: '0x'},
                finalizedHead: {height: -1, hash: '0x'},
                newBlocks,
            },
            async () => {},
        )
        const insertMs = Date.now() - insertStart

        // Now provoke a rollback of the entire hot chain: set baseHead
        // back to genesis (the persisted chain[0]) and install a single
        // alternate block. This forces rollbackBlock for every hot_block
        // row state.top has — the work grows with the size of the queue.
        const rollbackStart = Date.now()
        await db.transactHot2(
            {
                baseHead: {height: -1, hash: '0x'},
                finalizedHead: {height: -1, hash: '0x'},
                newBlocks: [{height: 0, hash: 'h-0-alt'}],
            },
            async () => {},
        )
        const rollbackMs = Date.now() - rollbackStart

        // Sanity after the rollback: status still genesis, single alt
        // block in the hot chain.
        await db.disconnect()
        db = new TypeormDatabase({projectDir: __dirname, supportHotBlocks: true})
        const state = await db.connect()
        expect(state).toMatchObject({height: -1, hash: '0x'})
        expect(state.top.map((b) => ({height: b.height, hash: b.hash}))).toEqual([{height: 0, hash: 'h-0-alt'}])

        // 30-second ceilings are deliberately loose — they flag an
        // algorithmic collapse (O(N²) or worse), not drift on the linear
        // fast path. On a healthy implementation both phases complete in
        // a few seconds at most.
        expect(insertMs).toBeLessThan(30_000)
        expect(rollbackMs).toBeLessThan(30_000)
    }, 60_000)
})
