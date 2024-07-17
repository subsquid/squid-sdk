import { createOrmConfig, getDbType } from '@subsquid/typeorm-config';
import { DataSource, EntityManager } from 'typeorm';

async function withClient(projectDir: string, block: (client: DataSource) => Promise<void>): Promise<undefined> {
    let client = new DataSource({
        ...createOrmConfig({ projectDir }),
        logging: !!process.env.DB_LOG
    })
    await client.initialize()
    try {
        await block(client)
    } finally {
        await client.destroy()
    }
}

const schemaName = process.env.DB_USER || 'public'


type InitSql = string | ((client: DataSource) => Promise<unknown>)

export async function databaseDelete(client: DataSource): Promise<void> {
    if (getDbType() === 'sqlite') {
        await client.dropDatabase()
        return
    }

    await client.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`)
    await client.query(`DROP SCHEMA IF EXISTS squid_processor CASCADE`)
    await client.query(`CREATE SCHEMA ${schemaName}`)
}

export async function databaseInit(client: DataSource, sql: InitSql[]): Promise<void> {
    await client.synchronize(true)

    for (let exec of sql) {
        if(typeof exec === 'function') {
            await exec(client)
        } else {
            await client.query(exec)
        }
    }
}

export function useDatabase(projectDir: string, sql: InitSql[] = []): void {
    beforeEach(async () => {
        try {
            await withClient(projectDir,async client => {
                await databaseDelete(client)
                await databaseInit(client, sql)
            })
        } catch (err) {
            console.error(err)
            throw err
        }
    })
}
