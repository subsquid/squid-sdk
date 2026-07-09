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

        await withClient(async client => {
            await client.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`)
            // make sure nothing lingers in public from a previous run
            await client.query('DROP TABLE IF EXISTS public.account CASCADE')
            await client.query('DROP TABLE IF EXISTS public.migrations CASCADE')
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

        expect(await tableSchemas('account')).toEqual([SCHEMA])
        expect(await tableSchemas('migrations')).toEqual([SCHEMA])
    })

    test('revert drops the data table within the schema; the ledger persists', async () => {
        project.generate()
        project.apply()
        project.revert()

        expect(await tableSchemas('account')).toEqual([])
        expect(await tableSchemas('migrations')).toEqual([SCHEMA])
    })
})
