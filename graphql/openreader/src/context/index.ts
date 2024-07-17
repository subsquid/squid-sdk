import { Logger } from '@subsquid/logger';
import type { Pool } from 'pg';
import { DbType, OpenReaderContext } from './types';
import { getPgContext } from './pg-context';
import { getSqliteContext } from './sqlite-context';

export * from './types'

export type CommonContextOptions = {
    log?: Logger,
    maxRequestSizeBytes?: number
    subscriptionMaxResponseNodes?: number
    maxResponseNodes?: number
    subscriptionPollInterval?: number
}

export type PgContextOptions = CommonContextOptions & {
    dbType: 'postgres' | 'cockroachdb',
    dbUrl: string,
    sqlStatementTimeout?: number
    subscriptionPool?: Pool
}

export type SqliteContextOptions = CommonContextOptions & {
    dbType: 'sqlite',
    dbUrl: string,
}

export async function getDefaultContext(opts: PgContextOptions | SqliteContextOptions): Promise<OpenReaderContext> {
    let ctx: OpenReaderContext
    switch (opts.dbType) {
        case 'postgres':
        case 'cockroachdb':
            ctx = await getPgContext(opts)
            break;
        case 'sqlite':
            ctx = await getSqliteContext(opts)
            break;
        default:
            throw new Error(`Unsupported db type: ${(opts as any).dbType}`)
    }

    ctx.maxResponseNodes = opts.maxResponseNodes
    ctx.subscriptionMaxResponseNodes = opts.subscriptionMaxResponseNodes ?? opts.maxResponseNodes

    return ctx
}


export function isSQLiteFamily(dbType: DbType) {
    return dbType === 'sqlite'
}