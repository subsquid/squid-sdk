/// <reference types="vitest/globals" />
import {createOrmConfig} from '@subsquid/typeorm-config'
import {assertNotNull} from '@subsquid/util-internal'
import {Client as PgClient, ClientBase} from 'pg'
import {DataSource, EntityManager} from 'typeorm'


export const db_config = {
    host: 'localhost',
    port: parseInt(assertNotNull(process.env.DB_PORT)),
    user: assertNotNull(process.env.DB_USER),
    password: assertNotNull(process.env.DB_PASS),
    database: assertNotNull(process.env.DB_NAME)
}


/**
 * Run `block` against a dedicated single connection.
 *
 * Session-scoped `SET`s (work_mem, statement_timeout, ...) are stable here in
 * a way they are not on a pooled EntityManager, where consecutive queries may
 * land on different backends.
 */
export async function withClient<T>(block: (client: ClientBase) => Promise<T>): Promise<T> {
    let client = new PgClient(db_config)
    await client.connect()
    try {
        return await block(client)
    } finally {
        await client.end()
    }
}


/**
 * True when the suite is pointed at CockroachDB rather than Postgres.
 *
 * The Makefile runs the whole suite twice against different ports; tests that
 * assert on Postgres planner internals use this to opt out.
 */
export async function isCockroach(): Promise<boolean> {
    let version = await withClient(async client => {
        let res = await client.query('SELECT version() AS v')
        return res.rows[0].v as string
    })
    return /cockroach/i.test(version)
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
        await client.query(`DROP SCHEMA IF EXISTS ${db_config.user} CASCADE`)
        await client.query(`DROP SCHEMA IF EXISTS squid_processor CASCADE`)
        await client.query(`CREATE SCHEMA ${db_config.user}`)
    })
}


export function useDatabase(sql: string[]): void {
    beforeEach(async () => {
        await databaseDelete()
        await databaseInit(sql)
    })
}


let connection: Promise<DataSource> | undefined


export function getEntityManager(): Promise<EntityManager> {
    if (connection == null) {
        let cfg = createOrmConfig({projectDir: __dirname})
        connection = new DataSource(cfg).initialize()
    }
    return connection.then(con => con.createEntityManager())
}
