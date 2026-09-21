import {TypeormDatabase} from '../database'
import {Data} from './lib/model'
import {getEntityManager, useDatabase} from './util'

// This file exists to exercise the typeorm-store DDL / init-transaction path
// on whichever backend the test run happens to be pointing at. The repo's
// Makefile runs `make test` twice — once against Postgres (DB_PORT=27436),
// once against CockroachDB (DB_PORT=27437) — so these assertions execute
// under both engines without any runtime branching here.
//
// The focus is narrow: prove that the init transaction's `CREATE SCHEMA /
// CREATE TABLE IF NOT EXISTS / ALTER TABLE` sequence succeeds, survives a
// reconnect (second connect() exercises the IF-NOT-EXISTS branches), and
// that subsequent transact / transactHot2 calls all commit cleanly.
describe('TypeormDatabase — init/DDL smoke test on the active backend', function () {
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

    it('connect() succeeds on a fresh schema', async function () {
        const state = await db.connect()
        expect(state).toMatchObject({height: -1, hash: '0x', top: []})

        // After connect, the squid_processor schema should exist with its
        // expected tables — validate via information_schema so the check is
        // portable across Postgres and CockroachDB.
        const em = await getEntityManager()
        const tables = (
            await em.query(
                `SELECT table_name FROM information_schema.tables
                 WHERE table_schema = 'squid_processor'
                 ORDER BY table_name`,
            )
        ).map((r: {table_name: string}) => r.table_name)

        expect(tables).toEqual(expect.arrayContaining(['hot_block', 'hot_change_log', 'status', 'template_registry']))
    })

    it('second connect() is a no-op: CREATE IF NOT EXISTS branches pass cleanly', async function () {
        await db.connect()
        await db.disconnect()

        // The DDL path in the init transaction re-runs on the second
        // connect. Every CREATE uses IF NOT EXISTS, so it should be a
        // clean no-op — any backend that takes exclusive DDL locks on
        // each statement needs to serialize through without throwing
        // "transaction used too many locks" or similar.
        db = new TypeormDatabase({projectDir: __dirname, supportHotBlocks: true})
        const state = await db.connect()
        expect(state).toMatchObject({height: -1, hash: '0x', top: []})
    })

    it('a full commit cycle (transact + transactHot2 + rollback) runs end-to-end', async function () {
        await db.connect()

        // Finalized commit.
        await db.transact(
            {
                prevHead: {height: -1, hash: '0x'},
                nextHead: {height: 10, hash: 'h-10'},
            },
            async (store) => {
                await store.insert(new Data({id: 'finalized-1', text: 'committed'}))
            },
        )

        // Hot commit on top of the finalized head.
        await db.transactHot2(
            {
                baseHead: {height: 10, hash: 'h-10'},
                finalizedHead: {height: 10, hash: 'h-10'},
                newBlocks: [{height: 11, hash: 'h-11'}],
            },
            async (store) => {
                await store.insert(new Data({id: 'hot-1', text: 'unfinalized'}))
            },
        )

        // Reorg: replace h-11 with h-11-alt.
        await db.transactHot2(
            {
                baseHead: {height: 10, hash: 'h-10'},
                finalizedHead: {height: 10, hash: 'h-10'},
                newBlocks: [{height: 11, hash: 'h-11-alt'}],
            },
            async (store) => {
                await store.insert(new Data({id: 'hot-alt', text: 'post-reorg'}))
            },
        )

        // After all that: finalized row stayed put, hot-1 rolled back,
        // hot-alt is the current hot view. Every stage must have committed
        // cleanly on whatever backend this suite is running against.
        const em = await getEntityManager()
        const rows = (await em.query('SELECT id FROM "data" ORDER BY id')).map((r: {id: string}) => r.id)
        expect(rows).toEqual(['finalized-1', 'hot-alt'])
    })
})
