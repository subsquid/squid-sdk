import { createOrmConfig, getDbType } from '@subsquid/typeorm-config';
import { DataSource, EntityManager } from 'typeorm';

async function withClient(block: (client: DataSource) => Promise<void>): Promise<undefined> {
    let client = new DataSource({
        ...createOrmConfig({ projectDir: __dirname }),
        // logging: true
    })
    await client.initialize()
    try {
        await block(client)
    } finally {
        await client.destroy()
    }
}

const schemaName = process.env.DB_USER || 'public'

export async function databaseDelete(client: DataSource): Promise<void> {
        if (getDbType() === 'sqlite') {
            await client.dropDatabase()
            return
        }

        await client.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`)
        await client.query(`DROP SCHEMA IF EXISTS squid_processor CASCADE`)
        await client.query(`CREATE SCHEMA ${schemaName}`)
}

export async function databaseInit(client: DataSource, sql: string[]): Promise<void> {
    await client.synchronize(true)

    for (let i = 0; i < sql.length; i++) {
        await client.query(sql[i])
    }
}


export function useDatabase(sql: string[] = []): void {
    beforeEach(async () => {
        try {
            await withClient(async client => {
                await databaseDelete(client)
                await databaseInit(client, sql)
            })
        } catch (err) {
            console.error(err)
            throw err
        }
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
