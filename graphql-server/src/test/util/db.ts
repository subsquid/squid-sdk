import {createPoolConfig} from "@subsquid/openreader/dist/db"
import {Client as PgClient, ClientBase} from "pg"


export const db_config = createPoolConfig()


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
        await client.query(`DROP SCHEMA IF EXISTS public CASCADE`)
        await client.query(`CREATE SCHEMA public`)
    })
}


export function useDatabase(sql: string[]): void {
    before(async () => {
        await databaseDelete()
        await databaseInit(sql)
    })
}
