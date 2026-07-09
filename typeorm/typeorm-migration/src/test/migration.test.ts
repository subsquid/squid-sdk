import * as path from 'path'
import {ACCOUNT_MODEL, FixtureProject, isolateSchemaEnv, tableSchemas, withClient} from './util'


// The CLIs inherit process.env; keep an ambient DB_SCHEMA from redirecting them
// away from the default (public) schema these tests characterize.
isolateSchemaEnv()


const PROJECT_DIR = path.join(__dirname, '.tmp-migration-project')


async function resetDb(): Promise<void> {
    await withClient(async client => {
        await client.query('DROP TABLE IF EXISTS "account" CASCADE')
        await client.query('DROP TABLE IF EXISTS "migrations" CASCADE')
        await client.query('DROP TABLE IF EXISTS "typeorm_metadata" CASCADE')
    })
}


describe('squid-typeorm-migration (current behavior, live DB)', () => {
    let project: FixtureProject

    beforeEach(async () => {
        await resetDb()
        project = FixtureProject.create(PROJECT_DIR, ACCOUNT_MODEL)
    })

    afterEach(async () => {
        project.destroy()
        await resetDb()
    })

    test('generate emits schema-neutral (unqualified) DDL and no CREATE TYPE for enums', () => {
        project.generate()

        const files = project.migrationFiles()
        expect(files).toHaveLength(1)

        const sql = project.readMigration(files[0])
        expect(sql).toMatch(/CREATE TABLE "account"/)      // unqualified table name
        expect(sql).not.toMatch(/"public"\."account"/)     // NOT pinned to a schema
        expect(sql).not.toMatch(/CREATE TYPE/i)            // enums are varchar -> no native type
        expect(sql).toMatch(/"status" character varying/)  // the enum-typed field is a varchar
    })

    test('apply creates the data table + migrations ledger; revert drops the data table', async () => {
        project.generate()
        project.apply()

        // Both the data table and TypeORM's bookkeeping table land in the
        // default schema (public) when DB_SCHEMA is unset.
        expect(await tableSchemas('account')).toEqual(['public'])
        expect(await tableSchemas('migrations')).toEqual(['public'])

        project.revert()

        expect(await tableSchemas('account')).toEqual([])
        // the migrations ledger itself persists across a revert
        expect(await tableSchemas('migrations')).toEqual(['public'])
    })
})
