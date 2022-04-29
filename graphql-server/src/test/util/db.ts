import {assertNotNull} from "@subsquid/util-internal"
import {Client as PgClient, ClientBase} from "pg"


export function isCockroach(): boolean {
    return process.env.DB_TYPE == 'cockroach'
}


const PORT = parseInt(assertNotNull(
    isCockroach() ? process.env.DB_PORT_COCKROACH : process.env.DB_PORT_PG
))


process.env.DB_PORT = ''+PORT


export const db_config = {
    host: 'localhost',
    port: PORT,
    user: 'root',
    password: 'root',
    database: 'defaultdb'
}


async function withClient(block: (client: ClientBase) => Promise<void>): Promise<void> {
    let client = new PgClient(db_config)
    await client.connect()
    try {
        await block(client)
    } finally {
        await client.end()
    }
}


export function databaseInit(sql: string[]): Promise<void> {
    return withClient(async client => {
        for (let i = 0; i < sql.length; i++) {
            await client.query(sql[i])
        }
    })
}


export function databaseDelete(): Promise<void> {
    return withClient(async client => {
        await client.query(`DROP SCHEMA IF EXISTS root CASCADE`)
        await client.query(`CREATE SCHEMA root`)
    })
}


export function useDatabase(sql: string[]): void {
    before(async () => {
        await databaseDelete()
        await databaseInit(sql)
    })
}
