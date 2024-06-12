import {createOrmConfig} from '@subsquid/typeorm-config'
import { assertNotNull } from '@subsquid/util-internal';
import {Client as PgClient, ClientBase} from 'pg'
import {DataSource, EntityManager} from 'typeorm'
import process from 'process';

function assertEnvVariable(name: string): string {
    assertNotNull(process.env[name], `Environment variable ${name} is not set`)

    return process.env[name]!
}

export const db_config = {
    host: 'localhost',
    port: parseInt(assertEnvVariable('DB_PORT')),
    user: assertEnvVariable('DB_USER'),
    password: assertEnvVariable('DB_PASS'),
    database: assertEnvVariable('DB_NAME')
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
