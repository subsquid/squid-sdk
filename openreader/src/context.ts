import {Dialect} from "./dialect"
import {Query} from "./sql/query"


export interface Context {
    openreader: OpenreaderContext
}


export interface OpenreaderContext {
    dialect: Dialect
    executeQuery<T>(query: Query<T>): Promise<T>
    executePollingQuery<T>(query: Query<T>): Promise<T>
}
