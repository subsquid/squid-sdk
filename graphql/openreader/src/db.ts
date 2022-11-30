import type {ClientBase, Pool} from "pg"
import {OpenreaderContext} from "./context"
import {Dialect} from "./dialect"
import {Query} from "./sql/query"
import {Subscription} from "./subscription"
import {withErrorContext} from "./util/error-handling"
import {LazyTransaction} from "./util/lazy-transaction"


export interface Database {
    query(sql: string, parameters?: any[]): Promise<any[][]>
}


export class PgDatabase implements Database {
    constructor(private client: ClientBase) {}

    query(sql: string, parameters?: any[]): Promise<any[][]> {
        return this.client.query({text: sql, rowMode: 'array'}, parameters)
            .then(result => result.rows)
            .catch(withErrorContext({sql, parameters}))
    }
}


export class PoolOpenreaderContext implements OpenreaderContext {
    private tx: LazyTransaction<Database>
    private subscriptionPool: Pool

    constructor(
        public readonly dialect: Dialect,
        pool: Pool,
        subscriptionPool?: Pool,
        private subscriptionPollInterval: number = 1000
    ) {
        this.tx = new LazyTransaction(cb => transact(pool, cb))
        this.subscriptionPool = subscriptionPool || pool
    }

    close(): Promise<void> {
        return this.tx.close()
    }

    async executeQuery<T>(query: Query<T>): Promise<T> {
        let db = await this.tx.get()
        let result = await db.query(query.sql, query.params)
        return query.map(result)
    }

    subscription<T>(query: Query<T>): AsyncIterable<T> {
        return new Subscription(this.subscriptionPollInterval, () => transact(this.subscriptionPool, async db => {
            let result = await db.query(query.sql, query.params)
            return query.map(result)
        }))
    }
}


async function transact<T>(pool: Pool, cb: (db: Database) => Promise<T>): Promise<T> {
    let client = await pool.connect()
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
