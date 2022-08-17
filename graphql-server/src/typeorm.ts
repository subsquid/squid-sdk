import type {OpenreaderContext} from "@subsquid/openreader/lib/context"
import type {Database} from "@subsquid/openreader/lib/db"
import type {Dialect} from "@subsquid/openreader/lib/dialect"
import type {Query} from "@subsquid/openreader/lib/sql/query"
import {Subscription} from "@subsquid/openreader/lib/subscription"
import {withErrorContext} from "@subsquid/openreader/lib/util/error-handling"
import {LazyTransaction} from "@subsquid/openreader/lib/util/lazy-transaction"
import type {DataSource, EntityManager} from "typeorm"


export class EMDatabase implements Database {
    constructor(private em: EntityManager) {}

    async query(sql: string, parameters?: any[]): Promise<any[][]> {
        let records: any[] = await this.em.query(sql, parameters).catch(withErrorContext({sql, parameters}))
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
}


export class TypeormOpenreaderContext implements OpenreaderContext {
    private tx: LazyTransaction<EntityManager>
    private subscriptionConnection: DataSource

    constructor(
        public readonly dialect: Dialect,
        private connection: DataSource,
        subscriptionConnection?: DataSource,
        private subscriptionPollInterval: number = 1000
    ) {
        this.tx = new LazyTransaction(cb => this.connection.transaction(cb))
        this.subscriptionConnection = subscriptionConnection || this.connection
    }

    async executeQuery<T>(query: Query<T>): Promise<T> {
        let em = await this.tx.get()
        let db = new EMDatabase(em)
        let result = await db.query(query.sql, query.params)
        return query.map(result)
    }

    subscription<T>(query: Query<T>): AsyncIterable<T> {
        return new Subscription(this.subscriptionPollInterval, () => this.subscriptionConnection.transaction(async em => {
            let db = new EMDatabase(em)
            let result = await db.query(query.sql, query.params)
            return query.map(result)
        }))
    }

    getEntityManager(): Promise<EntityManager> {
        return this.tx.get()
    }

    close(): Promise<void> {
        return this.tx.close()
    }
}
