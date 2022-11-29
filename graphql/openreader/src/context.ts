import {Dialect} from './dialect'
import {Query} from './sql/query'
import {Limit} from './util/limit'


export interface Context {
    openreader: OpenreaderContext
}


export interface OpenreaderContext {
    dialect: Dialect
    executeQuery<T>(query: Query<T>): Promise<T>
    subscription<T>(query: Query<T>): AsyncIterable<T>
    responseSizeLimit?: Limit
    subscriptionResponseSizeLimit?: Limit
}
