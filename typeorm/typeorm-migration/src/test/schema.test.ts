import * as path from 'path'
import {ACCOUNT_MODEL, FixtureProject, tableSchemas, withClient} from './util'


// Feature: with DB_SCHEMA set, `apply` creates that schema and the connection's
// search_path (from @subsquid/typeorm-config) makes unqualified migration DDL —
// and TypeORM's own `migrations` ledger — land in it, not in `public`.
const PROJECT_DIR = path.join(__dirname, '.tmp-migration-schema-project')
const SCHEMA = 'mig_feature_test'


describe('squid-typeorm-migration with DB_SCHEMA (feature, live DB)', () => {
    let project: FixtureProject
    let savedSchema: string | undefined
    let savedIncludePublic: string | undefined

    beforeEach(async () => {
        savedSchema = process.env.DB_SCHEMA
        savedIncludePublic = process.env.DB_SCHEMA_INCLUDE_PUBLIC
        process.env.DB_SCHEMA = SCHEMA
        delete process.env.DB_SCHEMA_INCLUDE_PUBLIC

        // Only touch our dedicated schema — never mutate public. Leaving public
        // alone also means the assertions below would catch an accidental leak
        // of tables into it rather than masking one.
        await withClient(async client => {
            await client.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`)
        })
        project = FixtureProject.create(PROJECT_DIR, ACCOUNT_MODEL)
    })

    afterEach(async () => {
        if (savedSchema === undefined) {
            delete process.env.DB_SCHEMA
        } else {
            process.env.DB_SCHEMA = savedSchema
        }
        if (savedIncludePublic === undefined) {
            delete process.env.DB_SCHEMA_INCLUDE_PUBLIC
        } else {
            process.env.DB_SCHEMA_INCLUDE_PUBLIC = savedIncludePublic
        }
        project?.destroy()
        await withClient(async client => {
            await client.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`)
        })
    })

    test('generate still emits schema-neutral (unqualified) DDL with DB_SCHEMA set', () => {
        project.generate()
        const sql = project.readMigration(project.migrationFiles()[0])
        expect(sql).toMatch(/CREATE TABLE "account"/)
        expect(sql).not.toMatch(new RegExp(`"${SCHEMA}"\\.`)) // not pinned to the schema
    })

    test('apply creates the schema and lands the data table + migrations ledger in it', async () => {
        project.generate()
        project.apply()

        // in our schema, and NOT leaked into public
        let account = await tableSchemas('account')
        expect(account).toContain(SCHEMA)
        expect(account).not.toContain('public')

        let migrations = await tableSchemas('migrations')
        expect(migrations).toContain(SCHEMA)
        expect(migrations).not.toContain('public')
    })

    test('revert drops the data table within the schema; the ledger persists', async () => {
        project.generate()
        project.apply()
        project.revert()

        expect(await tableSchemas('account')).not.toContain(SCHEMA)
        expect(await tableSchemas('migrations')).toContain(SCHEMA)
    })
})


// Regression: `apply` creates the schema unquoted, so Postgres folds the name
// exactly as it does in the (unquoted) search_path. A mixed-case DB_SCHEMA must
// therefore resolve to the same (folded) schema — quoting the CREATE would
// create "MixedCaseSchema" while search_path targets "mixedcaseschema", and
// apply would fail to find/create tables there.
describe('squid-typeorm-migration DB_SCHEMA case folding (live DB)', () => {
    const MIXED = 'MixedCaseSchema'
    const FOLDED = 'mixedcaseschema'
    const DIR = path.join(__dirname, '.tmp-migration-fold-project')
    let savedSchema: string | undefined
    let savedIncludePublic: string | undefined

    beforeEach(async () => {
        savedSchema = process.env.DB_SCHEMA
        savedIncludePublic = process.env.DB_SCHEMA_INCLUDE_PUBLIC
        process.env.DB_SCHEMA = MIXED
        delete process.env.DB_SCHEMA_INCLUDE_PUBLIC
        await withClient(async client => {
            await client.query(`DROP SCHEMA IF EXISTS ${FOLDED} CASCADE`)
        })
    })

    afterEach(async () => {
        if (savedSchema === undefined) {
            delete process.env.DB_SCHEMA
        } else {
            process.env.DB_SCHEMA = savedSchema
        }
        if (savedIncludePublic === undefined) {
            delete process.env.DB_SCHEMA_INCLUDE_PUBLIC
        } else {
            process.env.DB_SCHEMA_INCLUDE_PUBLIC = savedIncludePublic
        }
        await withClient(async client => {
            await client.query(`DROP SCHEMA IF EXISTS ${FOLDED} CASCADE`)
        })
    })

    test('a mixed-case DB_SCHEMA folds consistently, so migrations land in the folded schema', async () => {
        const project = FixtureProject.create(DIR, ACCOUNT_MODEL)
        try {
            project.generate()
            project.apply()
            const account = await tableSchemas('account')
            expect(account).toContain(FOLDED)
            expect(account).not.toContain(MIXED)
            expect(account).not.toContain('public')
        } finally {
            project.destroy()
        }
    })
})
