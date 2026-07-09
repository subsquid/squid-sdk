import {Client, ClientConfig} from 'pg'
import {createConnectionOptions} from '../connectionOptions'
import {toPgClientConfig} from '../pg'
import {withClient} from './util'


// Live-DB characterization: a connection built from the package's config
// functions uses Postgres' default search_path, so unqualified DDL lands in
// `public`. This is the baseline the schema/search_path feature will change.
describe('search_path (current behavior, live DB)', () => {
    beforeEach(async () => {
        await withClient(async client => {
            await client.query('DROP TABLE IF EXISTS public.harness_probe')
        })
    })

    test('default search_path includes public and unqualified DDL lands there', async () => {
        const client = new Client(toPgClientConfig(createConnectionOptions()) as unknown as ClientConfig)
        await client.connect()
        try {
            const sp = await client.query('SHOW search_path')
            expect(sp.rows[0].search_path).toContain('public')

            await client.query('CREATE TABLE harness_probe (id text primary key)')
            const landed = await client.query(
                `SELECT schemaname FROM pg_tables WHERE tablename = 'harness_probe'`
            )
            expect(landed.rows.map((r: any) => r.schemaname)).toEqual(['public'])
        } finally {
            await client.end()
        }
    })
})


// Feature: with DB_SCHEMA set, the connection's search_path points at that
// schema, so unqualified DDL lands there instead of `public`.
describe('search_path with DB_SCHEMA (feature, live DB)', () => {
    const schema = 'data_feature_test'
    let savedSchema: string | undefined

    beforeEach(async () => {
        savedSchema = process.env.DB_SCHEMA
        await withClient(async client => {
            await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`)
            await client.query(`CREATE SCHEMA ${schema}`)
        })
    })

    afterEach(async () => {
        if (savedSchema === undefined) {
            delete process.env.DB_SCHEMA
        } else {
            process.env.DB_SCHEMA = savedSchema
        }
        await withClient(async client => {
            await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`)
        })
    })

    test('unqualified DDL lands in DB_SCHEMA, not public', async () => {
        process.env.DB_SCHEMA = schema
        const client = new Client(toPgClientConfig(createConnectionOptions()) as unknown as ClientConfig)
        await client.connect()
        try {
            const sp = await client.query('SHOW search_path')
            expect(sp.rows[0].search_path).toContain(schema)

            await client.query('CREATE TABLE feature_probe (id text primary key)')
            const landed = await client.query(
                `SELECT schemaname FROM pg_tables WHERE tablename = 'feature_probe'`
            )
            expect(landed.rows.map((r: any) => r.schemaname)).toEqual([schema])
        } finally {
            await client.end()
        }
    })
})
