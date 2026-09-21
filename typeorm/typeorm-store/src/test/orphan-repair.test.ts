import type {ClientBase} from 'pg'
import {TypeormDatabase} from '../database'
import {orphanRepairStatements} from '../repair'
import {db_config, getEntityManager, isCockroach, useDatabase, withClient} from './util'

// Regression suite for the orphan-repair pass run by connect().
//
// The production failure this guards against: a squid with a deep hot window
// (thousands of unfinalized blocks) writing a few hundred entity changes per
// block builds a hot_change_log of >1M rows. The repair pass used to say
//
//     DELETE FROM hot_block WHERE height NOT IN (SELECT block_height FROM hot_change_log)
//
// which the planner turns into a SubPlan, not an anti-join. It can hash that
// SubPlan only while the subquery result is estimated to fit in work_mem;
// past that it degrades to a Materialize node rescanned once per outer row.
// Against a hosted default work_mem the plan cost jumped ~34000x, blew through
// statement_timeout and aborted connect() — so the processor crash-looped
// forever, never able to shrink the tables that were timing it out.
//
// The assertions below are on *plan shape* rather than wall-clock, so they
// fail deterministically on a regression instead of flaking on a slow runner.

const HOT_BLOCKS = 400
const CHANGES_PER_BLOCK = 250

// Deliberately tiny, so the hash-fits-in-work_mem threshold is crossed by a
// seed small enough to insert quickly.
const SMALL_WORK_MEM = '64kB'

const SCHEMA = 'squid_processor'

// The pre-fix formulation, kept verbatim so the test documents *which* shape
// is pathological rather than just asserting the new one is fine.
const LEGACY_HOT_BLOCK_REPAIR =
    `DELETE FROM ${SCHEMA}.hot_block ` +
    `WHERE height NOT IN (SELECT block_height FROM ${SCHEMA}.hot_change_log)`

describe('TypeormDatabase — orphan repair on a deep hot window', function () {
    useDatabase(['CREATE TABLE item (id text primary key, name text)'])

    let db!: TypeormDatabase
    let cockroach = false

    beforeAll(async () => {
        cockroach = await isCockroach()
    })

    beforeEach(() => {
        db = new TypeormDatabase({projectDir: __dirname, supportHotBlocks: true})
    })

    afterEach(async () => {
        await db?.disconnect().catch(() => {})
        // ALTER DATABASE settings outlive the schema drop in useDatabase, so
        // they must be undone or they leak into every later test file.
        await withClient(async client => {
            await client.query(`ALTER DATABASE "${db_config.database}" RESET work_mem`)
            await client.query(`ALTER DATABASE "${db_config.database}" RESET statement_timeout`)
        }).catch(() => {})
    })

    /**
     * Fill hot_block / hot_change_log with a healthy (non-orphaned) hot window
     * of `HOT_BLOCKS` blocks, then refresh planner statistics — without ANALYZE
     * the planner still sees the empty-table estimates and every plan below
     * would be meaningless.
     */
    async function seedHotWindow(client: ClientBase, blocks = HOT_BLOCKS): Promise<void> {
        await client.query(
            `INSERT INTO ${SCHEMA}.hot_block (height, hash)
             SELECT g, 'h-' || g FROM generate_series(1, $1::int) AS g`,
            [blocks],
        )
        await client.query(
            `INSERT INTO ${SCHEMA}.hot_change_log (block_height, index, change)
             SELECT b.height, i, '{"kind":"sentinel"}'::jsonb
               FROM generate_series(1, $1::int) AS b(height),
                    generate_series(0, $2::int) AS i`,
            [blocks, CHANGES_PER_BLOCK - 1],
        )
        // Best-effort: only the Postgres-only plan assertions below care, and
        // CockroachDB spells statistics collection differently.
        for (let table of ['hot_block', 'hot_change_log', 'template_registry']) {
            await client.query(`ANALYZE ${SCHEMA}.${table}`).catch(() => {})
        }
    }

    /**
     * Flatten an `EXPLAIN (FORMAT JSON)` tree into a list of shape tags.
     *
     * Note that JSON output does *not* spell anti-joins the way text output
     * does: text prints `Hash Anti Join`, JSON prints
     * `"Node Type": "Hash Join"` plus a separate `"Join Type": "Anti"`. Both
     * are folded into a single `<strategy> Anti Join` tag here. SubPlans are
     * reported through the child's `Parent Relationship`.
     */
    function planTags(plan: any): string[] {
        let out: string[] = []
        let visit = (node: any) => {
            if (node == null || typeof node !== 'object') return
            if (Array.isArray(node)) return node.forEach(visit)
            let nodeType = node['Node Type']
            if (typeof nodeType === 'string') {
                out.push(nodeType)
                if (typeof node['Join Type'] === 'string') {
                    out.push(`${nodeType} ${node['Join Type']} Join`)
                }
            }
            if (node['Parent Relationship'] === 'SubPlan') out.push('SubPlan')
            for (let v of Object.values(node)) visit(v)
        }
        visit(plan)
        return out
    }

    async function explainJson(client: ClientBase, sql: string): Promise<any> {
        let res = await client.query(`EXPLAIN (FORMAT JSON) ${sql}`)
        let raw = res.rows[0]['QUERY PLAN']
        // node-postgres parses json/jsonb for us on most versions, but EXPLAIN
        // returns an untyped text column on some.
        return typeof raw === 'string' ? JSON.parse(raw) : raw
    }

    async function explain(client: ClientBase, sql: string): Promise<string[]> {
        return planTags(await explainJson(client, sql))
    }

    async function totalCost(client: ClientBase, sql: string): Promise<number> {
        return (await explainJson(client, sql))[0].Plan['Total Cost']
    }

    it('plans every repair statement as an anti-join, even under a tiny work_mem', async function (ctx) {
        // Postgres planner internals; CockroachDB has neither work_mem nor
        // these node names.
        if (cockroach) return ctx.skip()

        await db.connect()

        await withClient(async client => {
            await seedHotWindow(client)
            await client.query(`SET work_mem = '${SMALL_WORK_MEM}'`)

            for (let sql of orphanRepairStatements(SCHEMA)) {
                let nodes = await explain(client, sql)

                // The whole point of the rewrite: a real anti-join, whichever
                // strategy the planner picks for it.
                expect(nodes.some(n => /Anti Join/.test(n)), `no anti-join in plan for:\n${sql}\n${nodes}`).toBe(true)

                // A SubPlan is the pathological shape — it is what degrades to
                // a per-outer-row rescan once the hash no longer fits.
                expect(nodes, `SubPlan in plan for:\n${sql}`).not.toContain('SubPlan')
            }
        })
    })

    it('is orders of magnitude cheaper than the legacy NOT IN formulation', async function (ctx) {
        if (cockroach) return ctx.skip()

        await db.connect()

        await withClient(async client => {
            await seedHotWindow(client)
            await client.query(`SET work_mem = '${SMALL_WORK_MEM}'`)

            let legacyNodes = await explain(client, LEGACY_HOT_BLOCK_REPAIR)
            // Guard the guard: if a future Postgres learns to plan this
            // NOT IN as an anti-join, the cliff is gone and this test should
            // be revisited rather than silently passing for the wrong reason.
            expect(legacyNodes, 'legacy NOT IN no longer produces a SubPlan — revisit this test').toContain('SubPlan')

            let legacyCost = await totalCost(client, LEGACY_HOT_BLOCK_REPAIR)
            let fixedCost = await totalCost(client, orphanRepairStatements(SCHEMA)[1])

            // Measured ~34000x on the production database that hit this; two
            // orders of magnitude is a loose floor that still fails loudly if
            // the anti-join is ever lost.
            expect(fixedCost * 100).toBeLessThan(legacyCost)
        })
    })

    // End-to-end counterpart to the two plan assertions above: drives the real
    // connect() path (not EXPLAIN) against a deep hot window under the same
    // constrained work_mem that production runs with.
    //
    // Deliberately *not* a wall-clock assertion. The production symptom is a
    // statement_timeout, but reproducing that timing needs the rescanned
    // Materialize tuplestore to spill to slow storage; in a local container it
    // stays in page cache and the legacy statement still finishes in ~100ms at
    // any seed size that is reasonable to insert here. Timing it would mean a
    // multi-million-row seed and a flaky threshold. The plan-shape and cost
    // assertions above are the regression guards; the generous timeout below
    // is only a backstop so a pathological regression fails instead of hanging
    // the suite.
    it('connect() returns the full hot chain on a deep hot window at small work_mem', async function (ctx) {
        if (cockroach) return ctx.skip()

        // Create the tables, then fill them behind connect()'s back to
        // simulate a processor restarting onto an existing deep hot window.
        await db.connect()
        await db.disconnect()

        await withClient(async client => {
            await seedHotWindow(client)
            // Applies to connections opened from now on — i.e. the ones
            // TypeormDatabase.connect() is about to make.
            await client.query(`ALTER DATABASE "${db_config.database}" SET work_mem = '${SMALL_WORK_MEM}'`)
            await client.query(`ALTER DATABASE "${db_config.database}" SET statement_timeout = '20s'`)
        })

        db = new TypeormDatabase({projectDir: __dirname, supportHotBlocks: true})

        let state = await db.connect()

        expect(state.top).toHaveLength(HOT_BLOCKS)
        expect(state.top[0].height).toBe(1)
        expect(state.top[HOT_BLOCKS - 1].height).toBe(HOT_BLOCKS)
    })

    it('removes exactly the orphaned rows and keeps the healthy hot window', async function () {
        // Runs on both engines. CockroachDB is far slower at bulk inserts, and
        // the window depth is irrelevant to this assertion — only the plan
        // tests above need scale.
        const blocks = cockroach ? 20 : HOT_BLOCKS

        await db.connect()
        await db.disconnect()

        await withClient(async client => {
            await seedHotWindow(client, blocks)

            // Orphan #1: a hot_block with no change-log entry at all — never
            // went through insertHotBlock.
            await client.query(`INSERT INTO ${SCHEMA}.hot_block (height, hash) VALUES (900, 'h-900-orphan')`)

            // Orphan #2: change-log rows with no parent hot_block. Requires
            // dropping the cascade FK first, which is exactly the manual
            // surgery the repair pass exists to clean up after.
            let fk = (
                await client.query(
                    `SELECT conname FROM pg_constraint
                      WHERE conrelid = '${SCHEMA}.hot_change_log'::regclass AND contype = 'f' LIMIT 1`,
                )
            ).rows[0].conname
            await client.query(`ALTER TABLE ${SCHEMA}.hot_change_log DROP CONSTRAINT "${fk}"`)
            await client.query(
                `INSERT INTO ${SCHEMA}.hot_change_log (block_height, index, change)
                 VALUES (901, 0, '{"kind":"insert","table":"item","id":"ghost"}'::jsonb)`,
            )

            // Orphan #3: a template_registry row above status.height that no
            // surviving hot_block accounts for.
            await client.query(
                `INSERT INTO ${SCHEMA}.template_registry (key, value, type, block_number, height)
                 VALUES ('orphan', '0xghost', true, 902, 902)`,
            )

            // A healthy template_registry row pinned to a real hot block must
            // survive — the third repair statement is an AND of two
            // conditions and dropping either would take this row with it.
            await client.query(
                `INSERT INTO ${SCHEMA}.template_registry (key, value, type, block_number, height)
                 VALUES ('keep', '0xalive', true, 7, 7)`,
            )
        })

        db = new TypeormDatabase({projectDir: __dirname, supportHotBlocks: true})
        await db.connect()

        const em = await getEntityManager()
        const count = async (sql: string) => Number((await em.query(sql))[0].n)

        expect(await count(`SELECT COUNT(*)::int AS n FROM ${SCHEMA}.hot_block WHERE height = 900`)).toBe(0)
        expect(await count(`SELECT COUNT(*)::int AS n FROM ${SCHEMA}.hot_change_log WHERE block_height = 901`)).toBe(0)
        expect(await count(`SELECT COUNT(*)::int AS n FROM ${SCHEMA}.template_registry WHERE height = 902`)).toBe(0)

        // Nothing healthy was collateral damage.
        expect(await count(`SELECT COUNT(*)::int AS n FROM ${SCHEMA}.hot_block`)).toBe(blocks)
        expect(await count(`SELECT COUNT(*)::int AS n FROM ${SCHEMA}.hot_change_log`)).toBe(
            blocks * CHANGES_PER_BLOCK,
        )
        expect(await count(`SELECT COUNT(*)::int AS n FROM ${SCHEMA}.template_registry WHERE key = 'keep'`)).toBe(1)
    })
})
