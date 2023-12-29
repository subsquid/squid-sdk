import type {Logger} from '@subsquid/logger'
import type {Dialect} from './dialect'
import type {Query} from './sql/query'
import type {Limit} from './util/limit'


export interface Context {
    openreader: OpenreaderContext
}


export interface OpenreaderContext {
    id: number
    dialect: Dialect
    executeQuery<T>(query: Query<T>): Promise<T>
    subscription<T>(query: Query<T>): AsyncIterable<T>
    responseSizeLimit?: Limit
    subscriptionResponseSizeLimit?: Limit
    log?: Logger
}
