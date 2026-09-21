import type {HashAndHeight, HotTxInfo} from '../interfaces'
import {TypeormDatabase} from '../database'
import {Data} from './lib/model'
import {databaseDelete, databaseInit, getEntityManager, useDatabase} from './util'

const SCHEMA = [
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
]

describe('TypeormDatabase — transactHot vs transactHot2 parity', function () {
    useDatabase(SCHEMA)

    let db!: TypeormDatabase

    beforeEach(() => {
        db = new TypeormDatabase({projectDir: __dirname, supportHotBlocks: true})
    })

    afterEach(() => db?.disconnect())

    // Per-block work that both API paths will invoke for each block in
    // info.newBlocks. Keeping it pure makes the two paths genuinely
    // equivalent operations on the same state.
    async function workOnBlock(
        store: {insert: (e: Data) => Promise<void>; save: (e: Data) => Promise<void>},
        block: HashAndHeight,
    ): Promise<void> {
        await store.insert(new Data({id: `b-${block.height}`, text: block.hash, integer: block.height}))
    }

    type CallHot = (db: TypeormDatabase, info: HotTxInfo) => Promise<void>

    const callHot: CallHot = (db, info) =>
        db.transactHot(info, async (store, block) => {
            await workOnBlock(store, block)
        })

    const callHot2: CallHot = (db, info) =>
        db.transactHot2(info, async (store, sliceBeg, sliceEnd) => {
            for (let i = sliceBeg; i < sliceEnd; i++) {
                await workOnBlock(store, info.newBlocks[i])
            }
        })

    async function runFullSequence(apply: CallHot): Promise<void> {
        // Phase 1: three hot blocks.
        await apply(db, {
            baseHead: {height: -1, hash: '0x'},
            newBlocks: [
                {height: 0, hash: 'h-0'},
                {height: 1, hash: 'h-1'},
                {height: 2, hash: 'h-2'},
            ],
            finalizedHead: {height: -1, hash: '0x'},
        })
        // Phase 2: advance finalization, add one more hot block.
        await apply(db, {
            baseHead: {height: 2, hash: 'h-2'},
            newBlocks: [{height: 3, hash: 'h-3'}],
            finalizedHead: {height: 1, hash: 'h-1'},
        })
        // Phase 3: reorg — replace h-3 with an alternate.
        await apply(db, {
            baseHead: {height: 2, hash: 'h-2'},
            newBlocks: [{height: 3, hash: 'h-3-alt'}],
            finalizedHead: {height: 1, hash: 'h-1'},
        })
    }

    interface Snapshot {
        status: unknown
        hotBlocks: unknown
        changeLog: unknown
        data: unknown
    }

    async function snapshot(): Promise<Snapshot> {
        const em = await getEntityManager()
        return {
            status: await em.query('SELECT height, hash FROM squid_processor.status'),
            hotBlocks: await em.query('SELECT height, hash FROM squid_processor.hot_block ORDER BY height'),
            // `change` is deliberately excluded — it carries the same per-row
            // payload in both runs by construction, but the internal ordering
            // of its jsonb fields can vary between runs. block_height + index
            // are the observable ordering invariants we want to lock in.
            changeLog: await em.query(
                'SELECT block_height, index FROM squid_processor.hot_change_log ORDER BY block_height, index',
            ),
            data: await em.query('SELECT id, "text", "integer" FROM "data" ORDER BY id'),
        }
    }

    async function reset(): Promise<void> {
        await databaseDelete()
        await databaseInit(SCHEMA)
    }

    it('the same fork+finalize sequence yields identical state through both APIs', async () => {
        // Run 1: the transactHot wrapper path.
        await db.connect()
        await runFullSequence(callHot)
        const snapshotHot = await snapshot()
        await db.disconnect()

        // Hard reset between runs — we want each API to start from a fully
        // clean state so the comparison is apples-to-apples.
        await reset()

        // Run 2: the raw transactHot2 path.
        db = new TypeormDatabase({projectDir: __dirname, supportHotBlocks: true})
        await db.connect()
        await runFullSequence(callHot2)
        const snapshotHot2 = await snapshot()

        expect(snapshotHot2).toEqual(snapshotHot)
    })

    it('transactHot2 with groupSize > 1 delivers correct non-zero sliceBeg values', async () => {
        // With 200 unfinalized blocks and nothing else, transactHot2 computes
        //     groupSize = floor(200 / 100) = 2
        // and invokes the callback 100 times with sliceBeg = 0, 2, 4, …, 198.
        // The concern is that callers interpreting `sliceBeg` must see the
        // true slice boundary, not always zero.
        await db.connect()

        const slices: Array<[number, number]> = []
        const newBlocks = Array.from({length: 200}, (_, i) => ({height: i, hash: `h-${i}`}))

        await db.transactHot2(
            {
                baseHead: {height: -1, hash: '0x'},
                newBlocks,
                finalizedHead: {height: -1, hash: '0x'},
            },
            async (_store, sliceBeg, sliceEnd) => {
                slices.push([sliceBeg, sliceEnd])
            },
        )

        // 100 callbacks, each covering exactly two consecutive blocks.
        expect(slices.length).toBe(100)
        expect(slices[0]).toEqual([0, 2])
        expect(slices[1]).toEqual([2, 4])
        expect(slices[99]).toEqual([198, 200])

        // Contiguous and covering: slice[i].end === slice[i+1].beg, the last
        // slice ends at newBlocks.length.
        for (let i = 0; i < slices.length - 1; i++) {
            expect(slices[i][1]).toBe(slices[i + 1][0])
        }
        expect(slices[slices.length - 1][1]).toBe(newBlocks.length)
    })
})
