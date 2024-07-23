import type {Logger} from '@subsquid/logger'
import {addErrorContext} from '@subsquid/util-internal'
import type {ClientBase, Pool} from 'pg'
import {QueryResult} from 'pg'
import {OpenreaderContext} from './context'
import {Query} from './sql/query'
import {Subscription} from './subscription'
import {LazyTransaction} from './util/lazy-transaction'


let CTX_COUNTER = 0


export type DbType = 'postgres' | 'cockroach'


export class PoolOpenreaderContext implements OpenreaderContext {
    public id = (CTX_COUNTER = (CTX_COUNTER + 1) % Number.MAX_SAFE_INTEGER)
    public log?: Logger
    private tx: LazyTransaction<Database>
    private subscriptionPool: Pool
    private queryCounter = 0

    constructor(
        public readonly dbType: DbType,
        pool: Pool,
        subscriptionPool?: Pool,
        private subscriptionPollInterval: number = 1000,
        log?: Logger
    ) {
        this.log = log?.child({graphqlCtx: this.id})
        this.tx = new LazyTransaction(cb => this.transact(pool, cb))
        this.subscriptionPool = subscriptionPool || pool
    }

    close(): Promise<void> {
        return this.tx.close()
    }

    async executeQuery<T>(query: Query<T>): Promise<T> {
        let db = await this.tx.get()
        let result = await db(query.sql, query.params)
        return query.map(result)
    }

    subscription<T>(query: Query<T>): AsyncIterable<T> {
        return new Subscription(this.subscriptionPollInterval, () => this.transact(this.subscriptionPool, async db => {
            let result = await db(query.sql, query.params)
            return query.map(result)
        }))
    }

    private async transact<T>(pool: Pool, cb: (db: Database) => Promise<T>): Promise<T> {
        let client = await pool.connect()
        try {
            await this.query(client, 'START TRANSACTION ISOLATION LEVEL SERIALIZABLE READ ONLY')
            try {
                return await cb(async (sql, parameters) => {
                    let result = await this.query(client, sql, parameters)
                    return result.rows
                })
            } finally {
                await this.query(client, 'COMMIT').catch(() => {})
            }
        } finally {
            client.release()
        }
    }

    private async query(client: ClientBase, sql: string, parameters?: any[]): Promise<QueryResult> {
        let queryId = this.queryCounter = (this.queryCounter + 1) % Number.MAX_SAFE_INTEGER

        let ctx = {
            graphqlCtx: this.id,
            graphqlSqlQuery: queryId,
        }

        let log = this.log?.child('sql', ctx)

        log?.debug({
            sql,
            parameters
        }, 'sql query')

        try {
            let result = await client.query({text: sql, rowMode: 'array'}, parameters)
            log?.debug({
                rowCount: result.rowCount || 0,
                rows: log.isTrace() ? result.rows : undefined
            }, 'sql result')
            return result
        } catch(err: any) {
            throw addErrorContext(err, {
                ...ctx,
                sql,
                parameters
            })
        }
    }
}


interface Database {
    (sql: string, parameters?: any[]): Promise<any[][]>
}
