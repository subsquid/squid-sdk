import {TypeormDatabase} from '../database'
import {Data} from './lib/model'
import {getEntityManager, useDatabase} from './util'

describe('TypeormDatabase — crash recovery', function () {
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

    describe('mid-callback failure inside transactHot2', () => {
        it('rolls back every write from every block group, not just the one that threw', async function () {
            await db.connect()

            // Pre-crash baseline: a hot chain of two blocks with one row each.
            await db.transactHot2(
                {
                    baseHead: {height: -1, hash: '0x'},
                    finalizedHead: {height: -1, hash: '0x'},
                    newBlocks: [
                        {height: 0, hash: 'h-0'},
                        {height: 1, hash: 'h-1'},
                    ],
                },
                async (store, beg, end) => {
                    for (let i = beg; i < end; i++) {
                        await store.insert(new Data({id: `baseline-${i}`, text: 'baseline'}))
                    }
                },
            )

            const em = await getEntityManager()

            async function snapshot() {
                // CockroachDB's pg-driver serializes integer columns as
                // strings; vanilla Postgres returns numbers. Coerce every
                // numeric field to Number so snapshots taken on the two
                // engines compare structurally via toEqual.
                const status = await em.query('SELECT height, hash FROM squid_processor.status')
                const hotBlocks = await em.query(
                    'SELECT height, hash FROM squid_processor.hot_block ORDER BY height',
                )
                const count = (
                    await em.query('SELECT COUNT(*)::int AS n FROM squid_processor.hot_change_log')
                )[0].n
                return {
                    status: status.map((r: {height: number | string; hash: string}) => ({
                        height: Number(r.height),
                        hash: r.hash,
                    })),
                    hotBlocks: hotBlocks.map((r: {height: number | string; hash: string}) => ({
                        height: Number(r.height),
                        hash: r.hash,
                    })),
                    changeLogCount: Number(count),
                    dataRows: await em.query('SELECT id FROM "data" ORDER BY id'),
                }
            }

            const beforeCrash = await snapshot()

            // Attempt to add three more hot blocks. The callback throws on
            // the SECOND group invocation — after the first group has already
            // inserted its hot_block row, its change-log entries, and its
            // 'in-flight-2' data row. The transactHot2 wrapper's submit() holds
            // a single outer transaction; the throw must unwind every write
            // from both groups, not just the one where the throw happened.
            let callCount = 0
            let error: unknown
            try {
                await db.transactHot2(
                    {
                        baseHead: {height: 1, hash: 'h-1'},
                        finalizedHead: {height: -1, hash: '0x'},
                        newBlocks: [
                            {height: 2, hash: 'h-2'},
                            {height: 3, hash: 'h-3'},
                            {height: 4, hash: 'h-4'},
                        ],
                    },
                    async (store, beg, end) => {
                        callCount++
                        for (let i = beg; i < end; i++) {
                            const block = {height: 2 + i, hash: `h-${2 + i}`}
                            await store.insert(new Data({id: `in-flight-${block.height}`, text: 'about to die'}))
                        }
                        if (callCount >= 2) {
                            throw new Error('simulated crash mid-transact')
                        }
                    },
                )
            } catch (e) {
                error = e
            }

            expect(String(error)).toMatch(/simulated crash mid-transact/)

            // State immediately after the crash — same DB connection, same
            // TypeormDatabase instance — must already be the pre-crash state.
            const afterCrash = await snapshot()
            expect(afterCrash).toEqual(beforeCrash)

            // And after a disconnect/reconnect, still the same.
            await db.disconnect()
            db = new TypeormDatabase({projectDir: __dirname, supportHotBlocks: true})
            const state = await db.connect()

            expect(state).toMatchObject({height: -1, hash: '0x'})
            expect(state.top.map((b) => b.hash)).toEqual(['h-0', 'h-1'])

            // No 'in-flight-*' row made it to disk. CockroachDB returns
            // COUNT(*)::int as string via em.query — coerce to Number.
            const inFlight = await em.query(`SELECT COUNT(*)::int AS n FROM "data" WHERE id LIKE 'in-flight-%'`)
            expect(Number(inFlight[0].n)).toBe(0)
        })
    })

    describe('connect() with corrupted internal state', () => {
        it('handles hot blocks that wrote no change-log entries (no-op handler)', async function () {
            await db.connect()

            // Three hot blocks, each processed by a no-op handler. hot_block
            // gets three rows; hot_change_log stays empty. This is an
            // entirely legitimate state — a block that didn't write anything
            // shouldn't leave any change-log entries — but it exercises the
            // "orphan hot_block" reconstruction path on reconnect.
            await db.transactHot2(
                {
                    baseHead: {height: -1, hash: '0x'},
                    finalizedHead: {height: -1, hash: '0x'},
                    newBlocks: [
                        {height: 0, hash: 'h-0'},
                        {height: 1, hash: 'h-1'},
                        {height: 2, hash: 'h-2'},
                    ],
                },
                async () => {},
            )

            const em = await getEntityManager()
            expect(
                Number((await em.query('SELECT COUNT(*)::int AS n FROM squid_processor.hot_block'))[0].n),
            ).toBe(3)
            expect(
                Number((await em.query('SELECT COUNT(*)::int AS n FROM squid_processor.hot_change_log'))[0].n),
            ).toBe(0)

            // Reconnect: state reflects all three hot blocks, each with
            // empty templates.
            await db.disconnect()
            db = new TypeormDatabase({projectDir: __dirname, supportHotBlocks: true})
            const state = await db.connect()

            expect(state.top.map((b) => ({height: b.height, hash: b.hash, templates: b.templates}))).toEqual([
                {height: 0, hash: 'h-0', templates: []},
                {height: 1, hash: 'h-1', templates: []},
                {height: 2, hash: 'h-2', templates: []},
            ])
        })

        // FIXME: TEST NEEDS TO BE FIXED — documents a latent integrity gap in
        // connect()'s state reconstruction.
        //
        // What's wrong: connect() builds state from three sources:
        //     - status (the single finalized head row)
        //     - hot_block (one row per unfinalized block)
        //     - template_registry (indexed by height)
        // Finalized templates come from `WHERE height <= status.height`, and
        // each hot block's templates come from `WHERE height = block.height`.
        // A template_registry row whose height is neither ≤ status.height nor
        // present in hot_block is simply ignored — the row stays in the table
        // forever, invisible to state and leaking one slot of disk + index
        // pressure per occurrence.
        //
        // How an orphan can appear today: in principle every template-registry
        // insert happens inside the same submit() transaction that inserts
        // the hot_block row, so a successful commit leaves them in sync. But
        // the state can diverge if:
        //   - a human (or migration) manually edits these tables;
        //   - a future refactor separates template writes from hot_block writes
        //     into distinct transactions;
        //   - a bug we haven't found yet causes a half-commit.
        // The symptom is silent data loss — the template "disappears" from
        // the processor's view without any indication anything is wrong.
        //
        // Fix direction: on connect(), either (a) delete every
        // template_registry row whose height is > status.height and not in
        // hot_block (with a warning log), or (b) refuse to start and surface
        // the orphan heights so operators can decide. The delete option is
        // safe because the row was already invisible to state.
        //
        // Wrapped in `it.fails`. When connect() gains orphan handling, vitest
        // reports an unexpected pass — the signal to remove this FIXME and
        // replace `it.fails(...)` with a regular `it(...)` (or update the
        // assertion to match a different decided policy).
        it.fails('removes orphan template_registry rows whose height matches no state', async function () {
            await db.connect()

            // Seed an orphan: height 999 is way past anything status or
            // hot_block could ever reference in this test.
            const em = await getEntityManager()
            await em.query(
                `INSERT INTO squid_processor.template_registry (key, value, type, block_number, height)
                 VALUES ('orphan', '0xghost', true, 999, 999)`,
            )

            // Reconnect — this is the point where connect() should notice
            // and repair (or refuse).
            await db.disconnect()
            db = new TypeormDatabase({projectDir: __dirname, supportHotBlocks: true})
            await db.connect()

            const remaining = (
                await em.query('SELECT COUNT(*)::int AS n FROM squid_processor.template_registry WHERE height = 999')
            )[0].n
            expect(Number(remaining)).toBe(0)
        })

        // FIXME: TEST NEEDS TO BE FIXED — documents the "orphan hot_block"
        // corruption mode (inv-16 case A).
        //
        // What's wrong: if a transactHot2 commits the hot_block INSERT but
        // somehow fails to insert any hot_change_log entries for that
        // height (e.g. mid-write crash of the database itself, manual
        // intervention, restore from a partial backup), reconnect leaves
        // the table in a state where `hot_block` has a row at height H
        // but `hot_change_log` has none.
        //
        // The existing "no-op handler" test above pins the LEGITIMATE case:
        // a block whose user handler made zero writes. There's no way at
        // connect() time to tell the legitimate case apart from the
        // pathological corruption — both produce exactly the same table
        // state. Reconnect silently accepts and, on the next fork, the
        // rollback of that height reverts zero user-table rows, orphaning
        // whatever the crashed transactHot2 actually committed to the user
        // tables before dying.
        //
        // Fix direction: have transactHot2 always INSERT at least one
        // sentinel row into hot_change_log per hot block (a no-op marker),
        // so connect() can detect the difference between "legit no-op"
        // (marker present) and "pathological" (nothing at all). Or: at
        // connect(), cross-check the data layer for any evidence that the
        // block's writes landed, and surface an error if inconsistent.
        //
        // Wrapped in `it.fails`. When the ambiguity is resolved, this flips
        // to pass — signal to re-assess what connect() should actually do.
        it.fails('detects or repairs an orphan hot_block row (hot_block without change-log entries)', async function () {
            await db.connect()

            // Simulate the corruption directly: an INSERT of a hot_block
            // row that was never paired with any log entries or templates.
            const em = await getEntityManager()
            await em.query(
                `INSERT INTO squid_processor.hot_block (height, hash) VALUES (42, 'h-42-orphan')`,
            )

            await db.disconnect()
            db = new TypeormDatabase({projectDir: __dirname, supportHotBlocks: true})
            await db.connect()

            // Contract (either enforced):
            //   (A) connect() rejects startup — an error mentioning height 42.
            //   (B) connect() repairs the corruption (drops the orphan row)
            //       and logs a warning.
            // Neither is currently implemented; connect() silently accepts.
            const surviving = (
                await em.query('SELECT COUNT(*)::int AS n FROM squid_processor.hot_block WHERE height = 42')
            )[0].n
            expect(Number(surviving)).toBe(0)
        })

        // FIXME: TEST NEEDS TO BE FIXED — documents the "orphan hot_change_log"
        // corruption mode (inv-16 case B).
        //
        // What's wrong: hot_change_log has a FK `block_height references
        // hot_block(height) on delete cascade`, so in normal operation a
        // log row without a matching hot_block row cannot exist — the FK
        // prevents the INSERT and the cascade removes entries when
        // hot_block is deleted.
        //
        // It can still be reached out-of-band:
        //   - manual DB intervention (DBA deletes from hot_block bypassing
        //     the cascade via ALTER TABLE / constraint disable);
        //   - partial restore from a backup taken mid-transaction;
        //   - future refactor that relaxes the FK.
        // In all three cases, connect() reads hot_change_log without
        // cross-checking against hot_block. Dangling log rows accumulate
        // and silently contribute no rollback work (a later rollbackBlock
        // for a no-longer-existing height matches them via DELETE but
        // doesn't replay them in reverse as part of any active block).
        //
        // Fix direction: on connect(), either (a) delete any hot_change_log
        // row whose block_height is not in hot_block (with a warning log),
        // or (b) refuse to start and surface the count.
        //
        // This test temporarily drops the FK so we can install an orphan
        // log row deterministically on both Postgres and CockroachDB
        // (DISABLE TRIGGER ALL requires superuser on Postgres and doesn't
        // exist on CockroachDB, making the trigger-disable approach non-
        // portable).
        //
        // Wrapped in `it.fails`. When connect() gains orphan handling, it
        // flips to pass.
        it.fails('removes orphan hot_change_log rows whose block_height matches no hot_block', async function () {
            await db.connect()

            const em = await getEntityManager()
            // Discover and drop the FK constraint on hot_change_log so
            // the orphan INSERT can land.
            const fkName: string = (
                await em.query(
                    `SELECT conname FROM pg_constraint
                     WHERE conrelid = 'squid_processor.hot_change_log'::regclass
                       AND contype = 'f'
                     LIMIT 1`,
                )
            )[0].conname
            await em.query(`ALTER TABLE squid_processor.hot_change_log DROP CONSTRAINT "${fkName}"`)

            // Install a log row with no corresponding hot_block parent.
            await em.query(
                `INSERT INTO squid_processor.hot_change_log (block_height, index, change)
                 VALUES (99, 0, '{"kind":"insert","table":"item","id":"ghost"}'::jsonb)`,
            )

            // Reconnect — this is where connect() should notice and repair.
            await db.disconnect()
            db = new TypeormDatabase({projectDir: __dirname, supportHotBlocks: true})
            await db.connect()

            const remaining = (
                await em.query(
                    'SELECT COUNT(*)::int AS n FROM squid_processor.hot_change_log WHERE block_height = 99',
                )
            )[0].n
            expect(Number(remaining)).toBe(0)
        })
    })
})
