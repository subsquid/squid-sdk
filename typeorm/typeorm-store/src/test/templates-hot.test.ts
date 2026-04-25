import {TypeormDatabase} from '../database'
import {getEntityManager, useDatabase} from './util'

describe('TypeormDatabase — template registry on the hot path', function () {
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

    it('hot-block reorg removes its templates but leaves finalized ones untouched', async function () {
        await db.connect()

        // Phase 1: blocks 0..5 all ≤ finalizedHead(5) → they take the finalized
        // template path. One callback invocation covers the whole slice and
        // registers template X at blockNumber=5.
        await db.transactHot2(
            {
                baseHead: {height: -1, hash: '0x'},
                finalizedHead: {height: 5, hash: 'h-5'},
                newBlocks: [
                    {height: 0, hash: 'h-0'},
                    {height: 1, hash: 'h-1'},
                    {height: 2, hash: 'h-2'},
                    {height: 3, hash: 'h-3'},
                    {height: 4, hash: 'h-4'},
                    {height: 5, hash: 'h-5'},
                ],
            },
            async () => ({
                templates: [{type: 'add', key: 'contract-X', value: '0xaaa', blockNumber: 5}],
            }),
        )

        // Sanity: finalized state exposes template X.
        await db.disconnect()
        db = new TypeormDatabase({projectDir: __dirname, supportHotBlocks: true})
        let state = await db.connect()
        expect(state).toMatchObject({height: 5, hash: 'h-5', top: []})
        expect(state.templates).toEqual([{type: 'add', key: 'contract-X', value: '0xaaa', blockNumber: 5}])

        // Phase 2: a hot block on top (6, h-6) registers its own template Y.
        await db.transactHot2(
            {
                baseHead: {height: 5, hash: 'h-5'},
                finalizedHead: {height: 5, hash: 'h-5'},
                newBlocks: [{height: 6, hash: 'h-6'}],
            },
            async () => ({
                templates: [{type: 'add', key: 'contract-Y', value: '0xbbb', blockNumber: 6}],
            }),
        )

        // Phase 3: reorg — replace h-6 with an alternate hot block that
        // registers no templates.
        await db.transactHot2(
            {
                baseHead: {height: 5, hash: 'h-5'},
                finalizedHead: {height: 5, hash: 'h-5'},
                newBlocks: [{height: 6, hash: 'h-6-alt'}],
            },
            async () => {},
        )

        // Reconnect and inspect.
        await db.disconnect()
        db = new TypeormDatabase({projectDir: __dirname, supportHotBlocks: true})
        state = await db.connect()

        // Finalized template X survives. Hot template Y is gone. The alternate
        // hot block exists with an empty templates list.
        expect(state).toMatchObject({height: 5, hash: 'h-5'})
        expect(state.templates).toEqual([{type: 'add', key: 'contract-X', value: '0xaaa', blockNumber: 5}])
        expect(state.top).toHaveLength(1)
        expect(state.top[0]).toMatchObject({
            height: 6,
            hash: 'h-6-alt',
            templates: [],
        })

        // template_registry invariant: no rows reference the rolled-back
        // hot block (height = 6) anymore. The single finalized row remains.
        const em = await getEntityManager()
        const rows = await em.query('SELECT height FROM squid_processor.template_registry ORDER BY height')
        // CockroachDB's pg-driver serializes int columns as strings; Postgres
        // returns them as numbers. Coerce for a uniform assertion.
        expect(rows.map((r: {height: number | string}) => Number(r.height))).toEqual([5])
    })

    // FIXME: TEST NEEDS TO BE FIXED — documents a subtle mismatch between the
    // registry insert-conflict key and the rollback delete key.
    //
    // What's wrong: TemplateRegistryTracker inserts rows into template_registry
    // with
    //     INSERT ... (key, value, type, block_number, height) VALUES ...
    //     ON CONFLICT (key, value, type, block_number) DO NOTHING
    // i.e. the conflict key IGNORES height. When a hot block "re-registers" a
    // template whose (key, value, type, block_number) tuple was already
    // inserted by a finalized earlier block, the INSERT is silently dropped
    // and no row is created at the hot block's height.
    //
    // Consequence on reconnect: state.top[i].templates is rebuilt by
    //     SELECT … FROM template_registry WHERE height = <hot block height>
    // which returns zero rows, so the hot block's templates list comes back
    // empty — even though its handler explicitly asked to register the
    // template. Callers reading `state.top[i].templates` as "what did block i
    // declare" see a view inconsistent with what the handler actually did.
    //
    // Possible fixes in templates.ts / hot.ts:
    //   (A) Change the INSERT conflict key to include `height`, so a
    //       re-registration at a different height creates its own row. The
    //       existing DELETE WHERE height = ... then cleans it up on rollback.
    //   (B) On reconnect, derive state.top[i].templates by asking
    //       "which in-flight (finalized + prior hot) templates is this block
    //       re-asserting?" rather than a naked SELECT-by-height.
    //   (C) Document this as the intended contract and spell out that callers
    //       must union state.templates with every state.top[j].templates
    //       (j ≤ i) to get block i's effective view — in which case the test
    //       should flip to asserting the empty templates list and naming the
    //       contract explicitly.
    //
    // Wrapped in `it.fails`. When the behavior changes, vitest reports an
    // unexpected pass — the signal to remove this FIXME and replace
    // `it.fails(...)` with a regular `it(...)` (or update the assertion to
    // match the decided contract from (C)).
    it.fails('hot block re-registering a finalized template is reflected in state.top[i].templates', async function () {
        await db.connect()

        // Phase 1: finalized block 5 registers template X at block_number=5.
        await db.transactHot2(
            {
                baseHead: {height: -1, hash: '0x'},
                finalizedHead: {height: 5, hash: 'h-5'},
                newBlocks: [
                    {height: 0, hash: 'h-0'},
                    {height: 1, hash: 'h-1'},
                    {height: 2, hash: 'h-2'},
                    {height: 3, hash: 'h-3'},
                    {height: 4, hash: 'h-4'},
                    {height: 5, hash: 'h-5'},
                ],
            },
            async () => ({
                templates: [{type: 'add', key: 'contract-X', value: '0xaaa', blockNumber: 5}],
            }),
        )

        // Phase 2: hot block 6 re-declares the SAME template — same key,
        // same value, same block_number. ON CONFLICT DO NOTHING fires.
        await db.transactHot2(
            {
                baseHead: {height: 5, hash: 'h-5'},
                finalizedHead: {height: 5, hash: 'h-5'},
                newBlocks: [{height: 6, hash: 'h-6'}],
            },
            async () => ({
                templates: [{type: 'add', key: 'contract-X', value: '0xaaa', blockNumber: 5}],
            }),
        )

        await db.disconnect()
        db = new TypeormDatabase({projectDir: __dirname, supportHotBlocks: true})
        const state = await db.connect()

        // Hot block 6 attempted to register template X; state.top[0].templates
        // should reflect that. Today it's empty because no row was ever
        // inserted at height = 6 (the conflict key excluded height).
        expect(state.top).toHaveLength(1)
        expect(state.top[0]).toMatchObject({
            height: 6,
            hash: 'h-6',
            templates: [{type: 'add', key: 'contract-X', value: '0xaaa', blockNumber: 5}],
        })
    })
})
