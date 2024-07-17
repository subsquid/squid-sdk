import type { Query } from '../sql/query';
import type { Limit } from '../util/limit';
import { Logger } from '@subsquid/logger';

export interface OpenReaderContext {
    id: number
    dbType: DbType
    executeQuery<T>(query: Query<T>): Promise<T>
    subscription<T>(query: Query<T>): AsyncIterable<T>
    close(): Promise<void>
    maxResponseNodes?: number
    subscriptionMaxResponseNodes?: number
    log?: Logger
}

export interface TestOpenReaderContext {
    context: OpenReaderContext
    dropDatabase(): Promise<void>

    jsonColumn(name: string): string
    jsonInsert(value: any): string
    intArrayColumn(name: string): string
    numericArrayColumn(name: string): string
    datetimeArrayColumn(name: string): string
    enumArrayColumn(name: string): string
    bytesArrayColumn(name: string): string

    executeQuery<T = any>(query: string, params?: unknown[]): Promise<T>
}

export interface Context {
    openreader: OpenReaderContext
}

export type DbType = 'postgres' | 'cockroachdb' | 'sqlite'
