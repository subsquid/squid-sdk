import {Transaction} from "./db"
import {Dialect} from "./dialect"
import {Query} from "./sql/query"


export interface Context {
    openreader: OpenreaderContext
}


export class OpenreaderContext {
    constructor(
        public readonly tx: Transaction,
        public readonly dialect: Dialect
    ) {
    }

    async executeQuery<T>(query: Query<T>): Promise<T> {
        let db = await this.tx.get()
        let result = await db.query(query.sql, query.params)
        return query.map(result)
    }
}
