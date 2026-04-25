import {TypeormDatabase} from '../database'
import {Data} from './lib/model'
import {getEntityManager, useDatabase} from './util'

describe('TypeormDatabase — deep fork scenarios', function () {
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

    it('deep reorg (>10 blocks) rolls back to the common ancestor', async function () {
        await db.connect()

        // Phase 1: 12 hot blocks, each inserting one Data row tagged 'main-N'.
        const mainBlocks = Array.from({length: 12}, (_, i) => ({
            height: i,
            hash: `main-${i}`,
        }))

        await db.transactHot(
            {
                baseHead: {height: -1, hash: '0x'},
                newBlocks: mainBlocks,
                finalizedHead: {height: -1, hash: '0x'},
            },
            async (store, block) => {
                await store.insert(
                    new Data({
                        id: `main-${block.height}`,
                        text: `main-${block.height}`,
                    }),
                )
            },
        )

        const em = await getEntityManager()
        expect(await em.count(Data)).toBe(12)

        // Phase 2: reorg — fork off the common ancestor at height 0. The
        // eleven blocks 1..11 of the main chain are rolled back and replaced
        // with an eleven-block alternate branch inserting 'fork-N' rows.
        const forkBlocks = Array.from({length: 11}, (_, i) => ({
            height: i + 1,
            hash: `fork-${i + 1}`,
        }))

        await db.transactHot(
            {
                baseHead: {height: 0, hash: 'main-0'},
                newBlocks: forkBlocks,
                finalizedHead: {height: -1, hash: '0x'},
            },
            async (store, block) => {
                await store.insert(
                    new Data({
                        id: `fork-${block.height}`,
                        text: `fork-${block.height}`,
                    }),
                )
            },
        )

        // Common ancestor survives; every 'main-*' above the ancestor is gone;
        // every 'fork-*' row is present.
        const ids = (await em.find(Data, {order: {id: 'asc'}})).map((r) => r.id).sort()
        const expected = ['main-0', ...forkBlocks.map((b) => `fork-${b.height}`)].sort()
        expect(ids).toEqual(expected)

        // And the reconstructed state confirms the new hot chain.
        await db.disconnect()
        const state = await db.connect()
        expect(state).toMatchObject({height: -1, hash: '0x'})
        expect(state.top.map((b) => b.hash)).toEqual(['main-0', ...forkBlocks.map((b) => b.hash)])
    })

    // FIXME: TEST NEEDS TO BE FIXED — the production code it targets is buggy.
    //
    // What's wrong: transactHot2 in database.ts batches unfinalized blocks
    // into groups of
    //     groupSize = Math.max(1, Math.floor(newBlocks.length / 100))
    // to avoid transaction timeouts. It then inserts ONLY the last block of
    // each group into the hot_block table, while still calling the user
    // callback for every block in the slice.
    //
    // Consequence: for any transactHot call with 200+ unfinalized blocks
    // (groupSize >= 2), mid-group heights never get a hot_block row. A
    // subsequent fork at one of those mid-group heights cannot locate its
    // baseHead in `chain = [state, ...state.top]` — the `findIndex` on
    // baseHead.hash returns -1 and the next line,
    //     assert(baseHeadPos >= 0, RACE_MSG),
    // fires a "status table was updated by foreign process" error which is
    // doubly misleading: it's not a concurrency problem, and the suggested
    // mitigation (kill duplicate processor) has nothing to do with the real
    // cause. The processor crashes on what should be a legal reorg.
    //
    // The fix in database.ts is one of:
    //   (A) Persist every block in hot_block — drop the group-writes-only-last
    //       optimization; change tracking can still group the callback-side
    //       work, but every block needs its own row so any height is
    //       addressable as baseHead.
    //   (B) Round-down baseHead on arrival — accept it at the last persisted
    //       checkpoint at or below the requested height and replay the
    //       in-group suffix from the incoming stream.
    //
    // Wrapped in `it.fails` so the suite stays green today. When database.ts
    // is fixed, vitest reports an unexpected pass — the signal to remove
    // this FIXME block and replace `it.fails(...)` with a regular `it(...)`.
    it.fails('accepts a fork at a mid-group baseHead with 200+ hot blocks', async function () {
        await db.connect()

        // Feed 200 hot blocks. groupSize = floor(200 / 100) = 2, so
        // hot_block receives only heights 1, 3, 5, ..., 199 — the last
        // block of each 2-block slice. Heights 0, 2, 4, ..., 198 exist
        // only in memory during the callback; they leave no persisted trace.
        const mainBlocks = Array.from({length: 200}, (_, i) => ({
            height: i,
            hash: `main-${i}`,
        }))

        await db.transactHot(
            {
                baseHead: {height: -1, hash: '0x'},
                newBlocks: mainBlocks,
                finalizedHead: {height: -1, hash: '0x'},
            },
            async () => {}, // no data writes — we only care about hot_block rows
        )

        // Sanity-check the persisted state: odd heights only, because the
        // grouping writes the second block of each pair.
        const em = await getEntityManager()
        const rows: {height: number}[] = await em.query('SELECT height FROM squid_processor.hot_block ORDER BY height')
        const persistedHeights = rows.map((r) => r.height)
        expect(persistedHeights[0]).toBe(1)
        expect(persistedHeights.every((h) => h % 2 === 1)).toBe(true)
        expect(persistedHeights).not.toContain(72)

        // Fork at height 72 — an even, mid-group block the processor saw
        // and acknowledged on the main chain but that was never persisted
        // to hot_block. The follow-up transactHot should succeed and
        // produce a valid rolled-back state on the alternate branch.
        //
        // Currently this throws RACE_MSG because state.top (reconstructed
        // from hot_block) has no entry for hash 'main-72', so baseHeadPos
        // lands at -1.
        await db.transactHot(
            {
                baseHead: {height: 72, hash: 'main-72'},
                newBlocks: [{height: 73, hash: 'fork-73'}],
                finalizedHead: {height: -1, hash: '0x'},
            },
            async () => {},
        )
    })
})
