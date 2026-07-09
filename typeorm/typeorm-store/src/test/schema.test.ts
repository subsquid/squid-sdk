import {Client} from 'pg'
import {TypeormDatabase} from '../database'
import {Data} from './lib/model'
import {db_config} from './util'


// Feature (typeorm-config search_path): entity DATA follows the connection's
// search_path into DB_SCHEMA, while the processor STATE tables stay explicitly
// qualified with `stateSchema`. The two are independent dials; this proves they
// resolve to different schemas at the same time, with no leakage between them.
const DATA_SCHEMA = 'store_data_v1'
const STATE_SCHEMA = 'store_state_v1'


const CREATE_TABLES = [
    `CREATE TABLE item (id text primary key, name text)`,
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


async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
    let client = new Client(db_config)
    await client.connect()
    try {
        return await fn(client)
    } finally {
        await client.end()
    }
}


async function tableSchemas(table: string): Promise<string[]> {
    return withClient(async client => {
        let res = await client.query(
            `SELECT schemaname FROM pg_tables WHERE tablename = $1 ORDER BY schemaname`,
            [table]
        )
        return res.rows.map((r: any) => r.schemaname)
    })
}


describe('TypeormDatabase data schema (DB_SCHEMA) vs state schema', function () {
    let db!: TypeormDatabase
    let savedSchema: string | undefined
    let savedIncludePublic: string | undefined

    beforeEach(async () => {
        savedSchema = process.env.DB_SCHEMA
        savedIncludePublic = process.env.DB_SCHEMA_INCLUDE_PUBLIC
        process.env.DB_SCHEMA = DATA_SCHEMA
        delete process.env.DB_SCHEMA_INCLUDE_PUBLIC

        // The data schema + entity tables are what migrations would create.
        await withClient(async client => {
            await client.query(`DROP SCHEMA IF EXISTS "${DATA_SCHEMA}" CASCADE`)
            await client.query(`DROP SCHEMA IF EXISTS "${STATE_SCHEMA}" CASCADE`)
            await client.query(`CREATE SCHEMA "${DATA_SCHEMA}"`)
            await client.query(`SET search_path TO "${DATA_SCHEMA}"`)
            for (let sql of CREATE_TABLES) {
                await client.query(sql)
            }
        })

        db = new TypeormDatabase({projectDir: __dirname, stateSchema: STATE_SCHEMA, supportHotBlocks: true})
    })

    afterEach(async () => {
        await db?.disconnect()
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
            await client.query(`DROP SCHEMA IF EXISTS "${DATA_SCHEMA}" CASCADE`)
            await client.query(`DROP SCHEMA IF EXISTS "${STATE_SCHEMA}" CASCADE`)
        })
    })

    it('writes entity data into DB_SCHEMA and processor state into stateSchema', async () => {
        await db.connect()
        await db.transact({
            prevHead: {height: -1, hash: '0x'},
            nextHead: {height: 10, hash: '0x10'}
        }, async store => {
            await store.insert(new Data({id: '1', text: 'hello', integer: 10}))
        })
        await db.disconnect()

        // entity data -> DATA_SCHEMA, and not in the state schema
        expect(await tableSchemas('data')).toContain(DATA_SCHEMA)
        expect(await tableSchemas('data')).not.toContain(STATE_SCHEMA)
        let rows = await withClient(client =>
            client.query(`SELECT id, "text" FROM "${DATA_SCHEMA}"."data" ORDER BY id`).then(r => r.rows)
        )
        expect(rows).toEqual([{id: '1', text: 'hello'}])

        // processor state -> STATE_SCHEMA, and not in the data schema
        expect(await tableSchemas('status')).toContain(STATE_SCHEMA)
        expect(await tableSchemas('status')).not.toContain(DATA_SCHEMA)
        expect(await tableSchemas('hot_block')).toContain(STATE_SCHEMA)

        expect(DATA_SCHEMA).not.toBe(STATE_SCHEMA)
    })
})
