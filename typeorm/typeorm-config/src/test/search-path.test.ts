import {Client} from 'pg'
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
        const client = new Client(toPgClientConfig(createConnectionOptions()) as any)
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
