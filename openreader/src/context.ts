import {Dialect} from "./dialect"
import {Query} from "./sql/query"


export interface Context {
    openreader: OpenreaderContext
}


export interface OpenreaderContext {
    dialect: Dialect
    executeQuery<T>(query: Query<T>): Promise<T>
    subscription<T>(query: Query<T>): AsyncIterator<T>
}
