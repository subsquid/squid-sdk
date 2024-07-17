import { assertEnvVariable } from '@subsquid/util-internal';
import { ListeningServer } from '@subsquid/util-internal-http-server';
import { Client } from 'gql-test-client';
import { parse } from 'graphql';
import { buildModel, buildSchema } from '../model.schema';
import { serve, ServerOptions } from '../server';
import { DbType, getDefaultContext, TestOpenReaderContext } from '../context';
import { createLogger } from '@subsquid/logger';
import { TestSqliteOpenReaderContext } from '../context/sqlite-context';
import { PgOpenReaderContext, TestPgOpenReaderContext } from '../context/pg-context';

export function isCockroach() {
    return process.env.DB_TYPE as DbType === 'cockroachdb';
}

async function getTestContext(options?: Partial<ServerOptions>): Promise<TestOpenReaderContext> {
    const ctx =  await getDefaultContext({
        dbType: process.env.DB_TYPE as DbType || 'postgres',
        subscriptionPollInterval: 500,
        dbUrl: assertEnvVariable('DB_URL'),
        // log: createLogger('openreader-test'),
        ...options,
    });

    switch (ctx.dbType) {
        case 'sqlite':
            return new TestSqliteOpenReaderContext(ctx);
        default:
            return new TestPgOpenReaderContext(ctx as PgOpenReaderContext);
    }
}

export async function withDatabase(block: (client: TestOpenReaderContext) => Promise<void>): Promise<void> {
    const test = await getTestContext();
    try {
        await block(test);
    } finally {
        await test.context.close();
    }
}

type TestQuery = string | ((ctx: TestOpenReaderContext) => string);


export function databaseExecute(sql: TestQuery[]): Promise<void> {
    return withDatabase(async (context) => {
        for (let query of sql) {
            if (typeof query === 'function') {
                query = query(context);
            }

            await context.executeQuery(query);
        }
    })
}


export async function databaseDelete(): Promise<void> {
    return withDatabase(async (context) => {
        await context.dropDatabase()
    })
}


export function useDatabase(sql: TestQuery[]): void {
    before(async () => {
        await databaseDelete();
        await databaseExecute(sql);
    });
}

export function useServer(schema: string, options?: Partial<ServerOptions>): Client {
    let client = new Client('not defined');
    let info: ListeningServer | undefined;

    before(async () => {
        const test = await getTestContext(options);

        info = await serve({
            context: test.context,
            model: buildModel(buildSchema(parse(schema))),
            port: 0,
            subscriptions: true,
            maxRootFields: 10,
            ...options,
        });

        client.endpoint = `http://localhost:${info.port}/graphql`;
    });

    after(() => {
        info?.close();
    });

    return client;
}
