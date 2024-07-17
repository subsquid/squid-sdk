import type { Logger } from '@subsquid/logger';
import { addErrorContext } from '@subsquid/util-internal';
import type { ClientBase, Pool, QueryResult } from 'pg';
import { Query, RawQuery, RunQuery } from '../sql/query';
import { Subscription } from '../subscription';
import { DbType, OpenReaderContext, TestOpenReaderContext } from './types';
import { PgContextOptions } from './index';

let CTX_COUNTER = 0;

export interface Database {
    (sql: string, parameters?: any[]): Promise<any[][]>;
}

export async function getPgContext({
   dbType,
   log,
   dbUrl,
   sqlStatementTimeout,
   subscriptionPollInterval,
}: PgContextOptions): Promise<OpenReaderContext> {
    const {Pool} = await import('pg');

    const pool = new Pool({
        connectionString: dbUrl,
        statement_timeout: sqlStatementTimeout || undefined
    });

    return new PgOpenReaderContext(
        dbType,
        pool,
        subscriptionPollInterval,
        log
    );
}

type IsolationLevel = 'SERIALIZABLE READ ONLY' | 'READ COMMITTED'

export class PgOpenReaderContext implements OpenReaderContext {
    public id = (CTX_COUNTER = (CTX_COUNTER + 1) % Number.MAX_SAFE_INTEGER);
    private queryCounter = 0;

    constructor(
        public readonly dbType: DbType,
        private pool: Pool,
        private subscriptionPollInterval: number = 1000,
        public log?: Logger
    ) {
        this.log = log?.child({graphqlCtx: this.id});
    }

    close() {
        return this.pool.end();
    }

    async executeQuery<T>(query: Query<T>): Promise<T> {
        let isolationLevel: IsolationLevel = query instanceof RunQuery ? 'READ COMMITTED' : 'SERIALIZABLE READ ONLY';
        let result = await this.transact(isolationLevel, async db => db(query.sql, query.params));

        return query.map(result);
    }

    subscription<T>(query: Query<T>): AsyncIterable<T> {
        return new Subscription(
            this.subscriptionPollInterval,
            () => this.transact('SERIALIZABLE READ ONLY', async db => {
            let result = await db(query.sql, query.params);

            return query.map(result);
        }));
    }

    private async transact<T>(isolationLevel: IsolationLevel,  cb: (db: Database) => Promise<T>): Promise<T> {
        let client = await this.pool.connect();
        try {
            await this.query(client, `BEGIN TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
            try {
                return await cb(async (sql, parameters) => {
                    let result = await this.query(client, sql, parameters);

                    return result.rows;
                });
            } finally {
                await this.query(client, 'COMMIT').catch(() => {
                });
            }
        } finally {
            client.release();
        }
    }

    private async query(client: ClientBase, sql: string, parameters?: any[]): Promise<QueryResult> {
        let queryId = this.queryCounter = (this.queryCounter + 1) % Number.MAX_SAFE_INTEGER;
        let ctx = {
            graphqlCtx: this.id,
            graphqlSqlQuery: queryId,
        };

        let log = this.log?.child('sql', ctx);

        log?.debug({sql, parameters}, 'sql query');

        try {
            let result = await client.query({text: sql, rowMode: 'array'}, parameters);
            log?.debug({rowCount: result.rowCount || 0, rows: log.isTrace() ? result.rows : undefined}, 'sql result');

            return result;
        } catch (err: any) {
            throw addErrorContext(err, {
                ...ctx,
                sql,
                parameters
            });
        }
    }
}

export class TestPgOpenReaderContext implements TestOpenReaderContext {
    constructor(public context: PgOpenReaderContext) {}

    jsonColumn(name: string): string {
        return `${name} jsonb`
    }
    jsonInsert(value: any): string {
        return `'${JSON.stringify(value)}'::jsonb`
    }

    intArrayColumn(name: string): string {
        return `${name} text`
    }
    intArrayInsert(value: number[]): string {
        return `{${value.join(',')}}`
    }

    numericArrayColumn(name: string): string {
        return `${name} text`
    }
    numericArrayInsert(value: bigint[]): string {
        return `{${value.join(',')}}`
    }

    datetimeArrayColumn(name: string): string {
        return `${name} text`
    }
    datetimeArrayInsert(value: Date[]): string {
        return `array[${value.join(',')}]::timestamptz[]`
    }

    enumArrayColumn(name: string): string {
        return `${name} text`
    }
    enumInsert(value: string[]): string {
        return `array[${value.map(v => `'${v}'`).join(',')}]`
    }

    bytesArrayColumn(name: string): string {
        return `${name} text`
    }
    bytesInsert(value: string[]): string {
        return `array[${value.map(v => `'${v}'`).join(',')}]::bytea[]`
    }

    async dropDatabase() {
        await this.executeQuery(`DROP SCHEMA IF EXISTS root CASCADE`);
        await this.executeQuery(`CREATE SCHEMA root`);
    }

    async executeQuery(query: string, params?: unknown[]): Promise<any> {
        const sql = query.trim().toLowerCase()
        if (
            sql.startsWith('create') ||
            sql.startsWith('pragma') ||
            sql.startsWith('drop') ||
            sql.startsWith('update') ||
            sql.startsWith('start') ||
            sql.startsWith('insert')
        ) {
            return this.context.executeQuery(new RunQuery(query, params));
        }

        return this.context.executeQuery(new RawQuery(query, params));
    }
}

