import type {ClientBase, Pool, PoolConfig} from "pg"
import {OpenreaderContext} from "./context"
import {Dialect} from "./dialect"
import {Query} from "./sql/query"
import {Subscription} from "./subscription"


export interface Database {
    query(sql: string, parameters?: any[]): Promise<any[][]>
}


export class PgDatabase implements Database {
    constructor(private client: ClientBase) {}

    query(sql: string, parameters?: any[]): Promise<any[][]> {
        return this.client.query({text: sql, rowMode: 'array'}, parameters).then(result => result.rows)
    }
}


export class PoolOpenreaderContext implements OpenreaderContext {
    private tx: LazyTransaction<Database>

    constructor(public readonly dialect: Dialect, private pool: Pool) {
        this.tx = new LazyTransaction(cb => this.transact(cb))
    }

    close(): Promise<void> {
        return this.tx.close()
    }

    async executeQuery<T>(query: Query<T>): Promise<T> {
        let db = await this.tx.get()
        let result = await db.query(query.sql, query.params)
        return query.map(result)
    }

    subscription<T>(query: Query<T>): AsyncIterator<T> {
        return new Subscription(() => this.transact(async db => {
            let result = await db.query(query.sql, query.params)
            return query.map(result)
        }))
    }

    private async transact<T>(cb: (db: Database) => Promise<T>): Promise<T> {
        let client = await this.pool.connect()
        try {
            await client.query('START TRANSACTION ISOLATION LEVEL SERIALIZABLE READ ONLY')
            try {
                let db = new PgDatabase(client)
                return await cb(db)
            } finally {
                await client.query('COMMIT').catch(() => {})
            }
        } finally {
            client.release()
        }
    }
}


export class LazyTransaction<T> {
    private closed = false

    private tx?: Promise<{
        close(): void,
        ctx: T
    }>

    constructor(private transact: (f: (ctx: T) => Promise<void>) => Promise<void>) {}

    async get(): Promise<T> {
        if (this.closed) {
            throw new Error('Too late to request transaction')
        }
        this.tx = this.tx || this.startTransaction()
        let {ctx} = await this.tx
        return ctx
    }

    private async startTransaction(): Promise<{close(): void, ctx: T}> {
        return new Promise((resolve, reject) => {
            let promise = this.transact(ctx => {
                return new Promise<void>(close => {
                    resolve({
                        ctx,
                        close: () => {
                            close()
                            return promise
                        }
                    })
                })
            })
            promise.catch(err => reject(err))
        })
    }

    async close(): Promise<void> {
        this.closed = true
        if (this.tx) {
            let tx = this.tx
            this.tx = undefined
            await tx.then(tx => tx.close())
        }
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
