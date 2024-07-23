import type {Logger} from '@subsquid/logger'
import type {DbType} from './db'
import type {Query} from './sql/query'
import type {Limit} from './util/limit'


export interface Context {
    openreader: OpenreaderContext
}


export interface OpenreaderContext {
    id: number
    dbType: DbType
    executeQuery<T>(query: Query<T>): Promise<T>
    subscription<T>(query: Query<T>): AsyncIterable<T>
    responseSizeLimit?: Limit
    subscriptionResponseSizeLimit?: Limit
    log?: Logger
}
