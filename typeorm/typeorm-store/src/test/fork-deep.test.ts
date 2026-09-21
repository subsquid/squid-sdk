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

    it('accepts a fork at a mid-group baseHead with 200+ hot blocks', async function () {
        await db.connect()

        // Feed 200 hot blocks. transactHot2 groups the user callback for
        // performance, and only group tips get hot_block rows.
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
            async () => {},
        )

        const em = await getEntityManager()
        const rows: {height: number}[] = await em.query('SELECT height FROM squid_processor.hot_block ORDER BY height')
        const persistedHeights = rows.map((r) => Number(r.height))
        expect(persistedHeights).toEqual(mainBlocks.map((b) => b.height).filter((h) => h % 2 === 1))

        // Fork at a persisted group tip — the processor must locate baseHead
        // in state.top and roll back cleanly.
        await db.transactHot(
            {
                baseHead: {height: 73, hash: 'main-73'},
                newBlocks: [{height: 74, hash: 'fork-74'}],
                finalizedHead: {height: -1, hash: '0x'},
            },
            async () => {},
        )

        const after: {height: number; hash: string}[] = await em.query(
            'SELECT height, hash FROM squid_processor.hot_block ORDER BY height',
        )
        expect(after[after.length - 1]).toMatchObject({height: 74, hash: 'fork-74'})
    })
})
