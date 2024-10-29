import {KeyvAdapter} from '@apollo/utils.keyvadapter'
import {InMemoryLRUCache} from '@apollo/utils.keyvaluecache'
import {mergeSchemas} from '@graphql-tools/schema'
import {Logger} from '@subsquid/logger'
import {Context, OpenreaderContext} from '@subsquid/openreader/lib/context'
import {DbType, PoolOpenreaderContext} from '@subsquid/openreader/lib/db'
import {Dialect, getSchemaBuilder} from '@subsquid/openreader/lib/dialect'
import type {Model} from '@subsquid/openreader/lib/model'
import {addServerCleanup, Dispose, runApollo} from '@subsquid/openreader/lib/server'
import {loadModel, resolveGraphqlSchema} from '@subsquid/openreader/lib/tools'
import {ResponseSizeLimit} from '@subsquid/openreader/lib/util/limit'
import {def} from '@subsquid/util-internal'
import {ListeningServer} from '@subsquid/util-internal-http-server'
import {isTsNode} from '@subsquid/util-internal-ts-node'
import {ApolloServerPluginCacheControl, KeyValueCache, PluginDefinition} from 'apollo-server-core'
import responseCachePlugin from 'apollo-server-plugin-response-cache'
import assert from 'assert'
import {GraphQLInt, GraphQLObjectType, GraphQLSchema, GraphQLString} from 'graphql'
import Keyv from 'keyv'
import * as path from 'path'
import {Pool} from 'pg'
import * as process from 'process'
import type {DataSource} from 'typeorm'
import {createCheckPlugin, RequestCheckFunction} from './check'
import {TypeormOpenreaderContext} from './typeorm'


export interface ServerOptions {
    dir?: string
    log?: Logger
    maxRequestSizeBytes?: number
    maxRootFields?: number
    maxResponseNodes?: number
    sqlStatementTimeout?: number
    squidStatus?: boolean
    subscriptions?: boolean
    subscriptionPollInterval?: number
    subscriptionMaxResponseNodes?: number
    dumbCache?: DumbRedisCacheOptions | DumbInMemoryCacheOptions
    dialect?: Dialect
}


export interface DumbRedisCacheOptions {
    kind: 'redis'
    url: string
    maxAgeMs: number
}


export interface DumbInMemoryCacheOptions {
    kind: 'in-memory'
    maxSizeMb: number
    ttlMs: number
    maxAgeMs: number
}


export class Server {
    private dir: string
    private disposals: Dispose[] = []

    constructor(private options: ServerOptions = {}) {
        this.dir = path.resolve(options.dir || process.cwd())
    }

    @def
    start(): Promise<ListeningServer> {
        return addServerCleanup(this.disposals, this.bootstrap(), this.options.log)
    }

    private async bootstrap(): Promise<ListeningServer> {
        let schema = await this.schema()
        let context = await this.context()
        let plugins: PluginDefinition[] = []

        if (this.options.dumbCache) {
            plugins.push(
                ApolloServerPluginCacheControl({defaultMaxAge: this.options.dumbCache.maxAgeMs / 1000}),
                responseCachePlugin()
            )
        }

        let requestCheck = this.customCheck()
        if (requestCheck) {
            plugins.push(createCheckPlugin(requestCheck, this.model()))
        }

        return runApollo({
            port: this.port(),
            disposals: this.disposals,
            schema,
            context,
            plugins,
            log: this.options.log,
            subscriptions: this.options.subscriptions,
            graphiqlConsole: true,
            maxRequestSizeBytes: this.options.maxRequestSizeBytes,
            maxRootFields: this.options.maxRootFields,
            cache: this.cache()
        })
    }

    @def
    private async schema(): Promise<GraphQLSchema> {
        const schemaBuilder = await getSchemaBuilder({
            model: this.model(),
            subscriptions: this.options.subscriptions,
            dialect: this.options.dialect,
        })

        let schemas = [
            schemaBuilder.build(),
        ]

        if (this.options.squidStatus !== false) {
            schemas.push(this.squidStatusSchema())
        }

        let customResolvers = await this.customResolvers()
        if (customResolvers) {
            schemas.push(customResolvers)
        }

        return mergeSchemas({schemas})
    }

    @def
    private squidStatusSchema(): GraphQLSchema {
        let statusQuery = {
            sql: `
                SELECT
                    f.height AS "finalizedHeight",
                    f.hash AS "finalizedHash",
                    COALESCE(h.height, f.height) AS "height",
                    COALESCE(h.hash, f.hash) AS "hash"
                FROM squid_processor.status AS f
                FULL JOIN (
                    SELECT hash, height FROM squid_processor.hot_block
                    ORDER BY height DESC
                    LIMIT 1)
                AS h ON TRUE
                WHERE f.id = 0`,
            params: [],
            map(rows: any[][]): {finalizedHeight: number; finalizedHash: string; height: number; hash: string} {
                assert(rows.length == 1)
                return {
                    finalizedHeight: parseInt(rows[0][0], 10),
                    finalizedHash: rows[0][1],
                    height: parseInt(rows[0][2], 10),
                    hash: rows[0][3],
                }
            },
        }

        return new GraphQLSchema({
            query: new GraphQLObjectType({
                name: 'Query',
                fields: {
                    squidStatus: {
                        type: new GraphQLObjectType({
                            name: 'SquidStatus',
                            fields: {
                                height: {
                                    type: GraphQLInt,
                                    description: 'The height of the last processed block',
                                },
                                hash: {
                                    type: GraphQLString,
                                    description: 'The hash of the last processed block',
                                },
                                finalizedHeight: {
                                    type: GraphQLInt,
                                    description: 'The height of the last processed finalized block',
                                },
                                finalizedHash: {
                                    type: GraphQLString,
                                    description: 'The hash of the last processed finalized block',
                                },
                            }
                        }),
                        resolve(source, args, context: Context) {
                            return context.openreader.executeQuery(statusQuery)
                        }
                    }
                }
            })
        })
    }

    @def
    private async customResolvers(): Promise<GraphQLSchema | undefined> {
        let loc = this.module('server-extension/resolvers')
        if (loc == null) return undefined
        let {loadCustomResolvers} = await import('./resolvers')
        return loadCustomResolvers(loc)
    }

    @def
    private customCheck(): RequestCheckFunction | undefined {
        let loc = this.module('server-extension/check')
        if (loc == null) return undefined
        let mod = require(loc)
        if (typeof mod.requestCheck != 'function') {
            throw new Error(`${loc} should export requestCheck() function`)
        }
        return mod.requestCheck
    }

    private module(name: string): string | undefined {
        let dir = isTsNode() ? 'src' : 'lib'
        let loc = this.path(`${dir}/${name}`)
        try {
            return require.resolve(loc)
        } catch(e: any) {
            return undefined
        }
    }

    @def
    private async context(): Promise<() => Context> {
        let dbType = this.dbType()
        let createOpenreader: () => OpenreaderContext
        if (await this.customResolvers()) {
            let con = await this.createTypeormConnection({sqlStatementTimeout: this.options.sqlStatementTimeout})
            this.disposals.push(() => con.destroy())
            createOpenreader = () => {
                return new TypeormOpenreaderContext(
                    dbType,
                    con,
                    con,
                    this.options.subscriptionPollInterval,
                    this.options.log
                )
            }
        } else {
            let pool = await this.createPgPool({sqlStatementTimeout: this.options.sqlStatementTimeout})
            this.disposals.push(() => pool.end())
            createOpenreader = () => {
                return new PoolOpenreaderContext(
                    dbType,
                    pool,
                    pool,
                    this.options.subscriptionPollInterval,
                    this.options.log
                )
            }
        }
        return () => {
            let openreader = createOpenreader()

            if (this.options.maxResponseNodes) {
                openreader.responseSizeLimit = new ResponseSizeLimit(this.options.maxResponseNodes)
                openreader.subscriptionResponseSizeLimit = new ResponseSizeLimit(this.options.maxResponseNodes)
            }

            if (this.options.subscriptionMaxResponseNodes) {
                openreader.subscriptionResponseSizeLimit = new ResponseSizeLimit(this.options.subscriptionMaxResponseNodes)
            }

            return {openreader}
        }
    }

    private async createTypeormConnection(options?: ConnectionOptions): Promise<DataSource> {
        let {createOrmConfig} = await import('@subsquid/typeorm-config')
        let {DataSource} = await import('typeorm')
        let cfg = {
            ...createOrmConfig({projectDir: this.dir}),
            extra: {
                statement_timeout: options?.sqlStatementTimeout || undefined,
                max: this.connectionPoolSize(),
                min: this.connectionPoolSize()
            }
        }
        let con = new DataSource(cfg)
        await con.initialize()
        return con
    }

    private async createPgPool(options?: ConnectionOptions): Promise<Pool> {
        let {createConnectionOptions} = await import('@subsquid/typeorm-config/lib/connectionOptions')
        let {toPgClientConfig} = await import('@subsquid/typeorm-config/lib/pg')
        let params = createConnectionOptions()
        return new Pool({
            ...toPgClientConfig(params),
            statement_timeout: options?.sqlStatementTimeout || undefined,
            max: this.connectionPoolSize(),
            min: this.connectionPoolSize(),
        })
    }

    @def
    private connectionPoolSize(): number {
        return envNat('GQL_DB_CONNECTION_POOL_SIZE') || 5
    }

    private dbType(): DbType {
        let type = process.env.DB_TYPE
        if (!type) return 'postgres'
        switch(type) {
            case 'cockroach':
                return 'cockroach'
            case 'postgres':
                return 'postgres'
            default:
                throw new Error(`Unknown database type passed via DB_TYPE environment variable: ${type}`)
        }
    }

    @def
    private model(): Model {
        let file = resolveGraphqlSchema(this.dir)
        return loadModel(file)
    }

    @def
    private cache(): KeyValueCache | undefined {
        let log = this.options.log
        let opts = this.options.dumbCache
        switch(opts?.kind) {
            case 'redis':
                log?.warn(`enabling dumb redis cache (max-age: ${opts.maxAgeMs}ms)`)
                return new KeyvAdapter(new Keyv(opts.url))
            case 'in-memory':
                log?.warn(`enabling dumb in-memory cache (size: ${opts.maxSizeMb}mb, ttl: ${opts.ttlMs}ms, max-age: ${opts.maxAgeMs}ms)`)
                return new InMemoryLRUCache({
                    maxSize: opts.maxSizeMb * 1024 * 1024,
                    ttl: opts.ttlMs,
                })
        }
    }

    private port(): number | string {
        return process.env.GQL_PORT || process.env.GRAPHQL_SERVER_PORT || 4000
    }

    private path(name: string): string {
        return path.join(this.dir, name)
    }
}


interface ConnectionOptions {
    sqlStatementTimeout?: number
}


function envNat(name: string): number | undefined {
    let env = process.env[name]
    if (!env) return undefined
    let val = parseInt(env, 10)
    if (Number.isSafeInteger(val) && val >= 0) return val
    throw new Error(`Invalid env variable ${name}: ${env}. Expected positive integer`)
}
