/// <reference types="vitest/globals" />
import {Client as PgClient} from 'pg'


function isCockroach(): boolean {
    return process.env.DB_TYPE == 'cockroach'
}


// Mirror util/db.ts: resolve DB_PORT from the per-engine test ports so the
// server under test (which reads DB_PORT via @subsquid/typeorm-config) connects
// to the docker-compose database rather than the default 5432.
if (!process.env.DB_PORT) {
    let port = isCockroach() ? process.env.DB_PORT_COCKROACH : process.env.DB_PORT_PG
    if (port) {
        process.env.DB_PORT = port
    }
}


function basePort(): number {
    if (process.env.DB_PORT) return Number.parseInt(process.env.DB_PORT, 10)
    let p = isCockroach() ? process.env.DB_PORT_COCKROACH : process.env.DB_PORT_PG
    return Number.parseInt(p || '5432', 10)
}


// Quote a schema name as a Postgres identifier, escaping embedded double quotes.
function quoteIdent(id: string): string {
    return `"${id.replace(/"/g, '""')}"`
}


/**
 * A pg client on the plain connection — no `DB_SCHEMA`/search_path — used by the
 * tests to provision (and later drop) a dedicated data schema out-of-band. This
 * deliberately does NOT go through @subsquid/typeorm-config, so the setup client
 * is unaffected by the `DB_SCHEMA` we toggle to exercise the server.
 */
async function withBaseClient(block: (client: PgClient) => Promise<void>): Promise<void> {
    let client = new PgClient({
        host: process.env.DB_HOST || 'localhost',
        port: basePort(),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASS || 'postgres',
        database: process.env.DB_NAME || 'postgres',
    })
    await client.connect()
    try {
        await block(client)
    } finally {
        await client.end()
    }
}


/**
 * Registers hooks that, for the duration of the enclosing `describe`, point
 * `DB_SCHEMA` at a freshly created schema, provision the given tables/rows inside
 * it, and tear it all down afterwards (restoring the previous env). The server
 * started by `useServer` then reads/writes that schema via its search_path.
 */
export function useSchema(schema: string, sql: string[]): void {
    let savedSchema: string | undefined
    let savedIncludePublic: string | undefined

    beforeAll(async () => {
        savedSchema = process.env.DB_SCHEMA
        savedIncludePublic = process.env.DB_SCHEMA_INCLUDE_PUBLIC
        process.env.DB_SCHEMA = schema
        delete process.env.DB_SCHEMA_INCLUDE_PUBLIC

        let ident = quoteIdent(schema)
        await withBaseClient(async client => {
            await client.query(`DROP SCHEMA IF EXISTS ${ident} CASCADE`)
            await client.query(`CREATE SCHEMA ${ident}`)
            // Create the fixtures inside the schema without qualifying each name.
            await client.query(`SET search_path TO ${ident}`)
            for (let stmt of sql) {
                await client.query(stmt)
            }
        })
    })

    afterAll(async () => {
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
        await withBaseClient(async client => {
            await client.query(`DROP SCHEMA IF EXISTS ${quoteIdent(schema)} CASCADE`)
        })
    })
}
