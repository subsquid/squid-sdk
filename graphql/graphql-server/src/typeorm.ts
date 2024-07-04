import type {Logger} from '@subsquid/logger'
import type {OpenreaderContext} from '@subsquid/openreader/lib/context'
import {DbType} from '@subsquid/openreader/lib/db'
import type {Dialect} from '@subsquid/openreader/lib/dialect'
import type {Query} from '@subsquid/openreader/lib/sql/query'
import {Subscription} from '@subsquid/openreader/lib/subscription'
import {LazyTransaction} from '@subsquid/openreader/lib/util/lazy-transaction'
import {addErrorContext} from '@subsquid/util-internal'
import type {DataSource, EntityManager} from 'typeorm'


let CTX_COUNTER = 0


export class TypeormOpenreaderContext implements OpenreaderContext {
    public id = (CTX_COUNTER = (CTX_COUNTER + 1) % Number.MAX_SAFE_INTEGER)
    public log?: Logger
    private tx: LazyTransaction<EntityManager>
    private subscriptionConnection: DataSource
    private queryCounter = 0

    constructor(
        public readonly dbType: DbType,
        private connection: DataSource,
        subscriptionConnection?: DataSource,
        private subscriptionPollInterval: number = 1000,
        log?: Logger
    ) {
        this.log = log?.child({graphqlCtx: this.id})
        this.tx = new LazyTransaction(cb => this.connection.transaction(cb))
        this.subscriptionConnection = subscriptionConnection || this.connection
    }

    async executeQuery<T>(query: Query<T>): Promise<T> {
        let em = await this.tx.get()
        let result = await this.query(em, query.sql, query.params)
        return query.map(result)
    }

    subscription<T>(query: Query<T>): AsyncIterable<T> {
        return new Subscription(this.subscriptionPollInterval, () => this.subscriptionConnection.transaction(async em => {
            let result = await this.query(em, query.sql, query.params)
            return query.map(result)
        }))
    }

    getEntityManager(): Promise<EntityManager> {
        return this.tx.get()
    }

    close(): Promise<void> {
        return this.tx.close()
    }

    private async query(em: EntityManager, sql: string, parameters?: any[]): Promise<any[][]> {
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
            let rows = await em.query(sql, parameters).then(mapRecords)
            log?.debug({
                rowCount: rows.length,
                rows: log.isTrace() ? rows : undefined
            }, 'sql result')
            return rows
        } catch(err: any) {
            throw addErrorContext(err, {
                ...ctx,
                sql,
                parameters
            })
        }
    }
}


function mapRecords(records: any[]): any[][] {
    let rows: any[][] = new Array(records.length)
    let len = 0
    for (let i = 0; i < records.length; i++) {
        let rec = records[i]
        let row: any[] = new Array(len)
        let j = 0
        for (let key in rec) {
            row[j] = rec[key]
            j += 1
        }
        len = j
        rows[i] = row
    }
    return rows
}
