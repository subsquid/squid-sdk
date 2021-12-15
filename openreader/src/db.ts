import type {ClientBase, Pool, PoolClient, PoolConfig} from "pg"


export interface Database {
    query(sql: string, parameters?: any[]): Promise<any[][]>
    escapeIdentifier(name: string): string
}


/**
 * This is an interface OpenReader uses to interact with underling database.
 */
export interface Transaction {
    get(): Promise<Database>
}


export class PgDatabase implements Database {
    constructor(private client: ClientBase) {}

    query(sql: string, parameters?: any[]): Promise<any[]> {
        return this.client.query({text: sql, rowMode: 'array'}, parameters).then(result => result.rows)
    }

    escapeIdentifier(name: string): string {
        return this.client.escapeIdentifier(name)
    }
}


export class PoolTransaction implements Transaction {
    private tx: Promise<{client: PoolClient, db: Database}> | undefined
    private closed = false

    constructor(private pool: Pool) {}

    async get(): Promise<Database> {
        if (this.closed) {
            throw new Error('Too late to request transaction')
        }
        this.tx = this.tx || this.startTransaction()
        let {db} = await this.tx
        return db
    }

    private async startTransaction(): Promise<{client: PoolClient, db: Database}> {
        let client = await this.pool.connect()
        try {
            await client.query('START TRANSACTION ISOLATION LEVEL SERIALIZABLE READ ONLY')
            return {
                client,
                db: new PgDatabase(client)
            }
        } catch(e: any) {
            client.release()
            throw e
        }
    }

    close(): Promise<void> {
        this.closed = true
        return this.tx?.then(async ({client}) => {
            try {
                await client.query('COMMIT')
            } catch(e: any) {
                // ignore
            } finally {
                client.release()
            }
        }) || Promise.resolve()
    }
}


export function createPoolConfig(): PoolConfig {
    return {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
        database: process.env.DB_NAME || 'postgres',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASS || 'postgres'
    }
}
