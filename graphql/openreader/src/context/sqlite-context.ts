import type { Logger } from '@subsquid/logger';
import { addErrorContext } from '@subsquid/util-internal';
import type { Database } from 'better-sqlite3';
import { RunQuery, Query, RawQuery } from '../sql/query';
import { Subscription } from '../subscription';
import { DbType, OpenReaderContext, TestOpenReaderContext } from './types';
import { SqliteContextOptions } from './index';

let CTX_COUNTER = 0;

export async function getSqliteContext(options: SqliteContextOptions): Promise<OpenReaderContext> {
    const {default: Database} = await import('better-sqlite3');

    return new SqliteOpenReaderContext(
        options.dbType,
        new Database(options.dbUrl),
        options.subscriptionPollInterval,
        options.log,
    );
}

export class SqliteOpenReaderContext implements OpenReaderContext {
    public id = (CTX_COUNTER = (CTX_COUNTER + 1) % Number.MAX_SAFE_INTEGER);
    private queryCounter = 0;

    constructor(
        public readonly dbType: DbType,
        private readonly db: Database,
        private subscriptionPollInterval: number = 1000,
        public log?: Logger
    ) {
        this.log = log?.child({graphqlCtx: this.id});
    }

    async close() {
        this.db.close();
        return;
    }

    async executeQuery<T = any[]>(query: Query<T>): Promise<T> {
        let result = await this.query<any>(query);

        return query.map(result);
    }

    subscription<T>(query: Query<T>): AsyncIterable<T> {
        return new Subscription(this.subscriptionPollInterval, async () => {
            let result = await this.query<any>(query);

            return query.map(result);
        });
    }

    private async query<T>(query: Query<T>): Promise<T[]> {
        let queryId = this.queryCounter = (this.queryCounter + 1) % Number.MAX_SAFE_INTEGER;

        let ctx = {
            graphqlCtx: this.id,
            graphqlSqlQuery: queryId,
        };

        let log = this.log?.child('sql', ctx);

        log?.debug({sql: query.sql, parameters: query.params}, 'sql query');

        try {
            if (query instanceof RunQuery) {
                this.db.prepare(query.sql).run(query.params);
                return Promise.resolve([]);
            }

            let result = this.db.prepare(query.sql).all(query.params) as T[];

            log?.debug({rowCount: result.length || 0, rows: log.isTrace() ? result : undefined}, 'sql result');

            return this.mapRecords(query, result) as T[];
        } catch (err: any) {
            throw addErrorContext(err, {
                ...ctx,
                sql: query.sql,
                parameters: query.params
            });
        }
    }

    mapRecords(query: Query<unknown>, records: any[]): any[][] {
        let rows: any[][] = new Array(records.length)
        let len = 0

        for (let i = 0; i < records.length; i++) {
            let rec = records[i]
            let row: any[] = new Array(len)
            let j = 0

            const field = Array.isArray(query.fields) && query.fields?.[0]
            for (let key in rec) {
                // Parse joined tables JSON
                if(field && field.kind === 'list-lookup') {
                    row[j] = JSON.parse(rec[key])
                } else {
                    row[j] = rec[key]
                }
                j += 1
            }
            len = j
            rows[i] = row
        }
        return rows
    }
}


export class TestSqliteOpenReaderContext implements TestOpenReaderContext {
    constructor(public context: OpenReaderContext) {}

    jsonColumn(name: string): string {
        return `${name} text`
    }
    jsonInsert(value: any): string {
        return `'${JSON.stringify(value)}'`
    }
    intArrayColumn(name: string): string {
        return `${name} integer[]`
    }
    numericArrayColumn(name: string): string {
        return `${name} numeric[]`
    }
    datetimeArrayColumn(name: string): string {
        return `${name} timestamptz[]`
    }
    enumArrayColumn(name: string): string {
        return `${name} text[]`
    }
    bytesArrayColumn(name: string): string {
        return `${name} bytea[]`
    }

    intArrayInsert(value: number[]): string {
        return `${name} integer[]`
    }


    executeQuery(query: string, params?: unknown[]): Promise<any> {
        const sql = query.trim().toLowerCase()
        if (
            sql.startsWith('create') ||
            sql.startsWith('pragma') ||
            sql.startsWith('update') ||
            sql.startsWith('drop') ||
            sql.startsWith('insert')
        ) {
            return this.context.executeQuery(new RunQuery(query, params));
        }

        return this.context.executeQuery(new RawQuery(query, params));
    }

    async dropDatabase(): Promise<void> {
        await this.context.executeQuery(new RunQuery('PRAGMA foreign_keys = OFF'));
        const drops = await this.context.executeQuery(
            new RawQuery(`SELECT 'DROP TABLE "' || name || '";' as query FROM "sqlite_master" WHERE "type" = 'table' AND "name" != 'sqlite_sequence'`
            ));
        for (const drop of drops) {
            await this.context.executeQuery(new RunQuery(drop[0]));
        }
        await this.context.executeQuery(new RunQuery('PRAGMA foreign_keys = ON'));
        return;
    }
}


