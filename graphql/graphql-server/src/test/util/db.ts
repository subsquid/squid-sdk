import {createConnectionOptions} from '@subsquid/typeorm-config/lib/connectionOptions'
import {toPgClientConfig} from '@subsquid/typeorm-config/lib/pg'
import {Client as PgClient, ClientBase} from 'pg'


export function isCockroach(): boolean {
    return process.env.DB_TYPE == 'cockroach'
}


if (!process.env.DB_PORT) {
    let port = isCockroach() ? process.env.DB_PORT_COCKROACH : process.env.DB_PORT_PG
    if (port) {
        process.env.DB_PORT = port
    }
}


const db_config =  toPgClientConfig(createConnectionOptions())


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
