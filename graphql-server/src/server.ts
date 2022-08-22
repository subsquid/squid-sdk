import {mergeSchemas} from "@graphql-tools/schema"
import {Logger} from "@subsquid/logger"
import {Context} from "@subsquid/openreader/lib/context"
import {PoolOpenreaderContext} from "@subsquid/openreader/lib/db"
import {Dialect} from "@subsquid/openreader/lib/dialect"
import type {Model} from "@subsquid/openreader/lib/model"
import {SchemaBuilder} from "@subsquid/openreader/lib/opencrud/schema"
import {addServerCleanup, Dispose, runApollo} from "@subsquid/openreader/lib/server"
import {loadModel, resolveGraphqlSchema} from "@subsquid/openreader/lib/tools"
import {def} from "@subsquid/util-internal"
import {ListeningServer} from "@subsquid/util-internal-http-server"
import {PluginDefinition} from "apollo-server-core"
import assert from "assert"
import {GraphQLInt, GraphQLObjectType, GraphQLSchema} from "graphql"
import * as path from "path"
import {Pool} from "pg"
import * as process from "process"
import type {DataSource} from "typeorm"
import {createCheckPlugin, RequestCheckFunction} from "./check"
import {loadCustomResolvers} from "./resolvers"
import {TypeormOpenreaderContext} from "./typeorm"


export interface ServerOptions {
    dir?: string
    log?: Logger
    maxRequestSizeBytes?: number
    sqlStatementTimeout?: number
    squidStatus?: boolean
    subscriptions?: boolean
    subscriptionPollInterval?: number
    subscriptionSqlStatementTimeout?: number
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
            maxRequestSizeBytes: this.options.maxRequestSizeBytes
        })
    }

    @def
    private async schema(): Promise<GraphQLSchema> {
        let schemas = [
            new SchemaBuilder({model: this.model(), subscriptions: this.options.subscriptions}).build()
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
            sql: `SELECT height FROM squid_processor.status WHERE id = 0`,
            params: [],
            map(rows: any[][]): {height: number} {
                assert(rows.length == 1)
                let height = parseInt(rows[0][0], 10)
                return {height}
            }
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
                                    description: 'The height of the processed part of the chain'
                                }
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
        let loc = this.module('lib/server-extension/resolvers')
        if (loc == null) return undefined
        let {loadCustomResolvers} = await import('./resolvers')
        return loadCustomResolvers(loc)
    }

    @def
    private customCheck(): RequestCheckFunction | undefined {
        let loc = this.module('lib/server-extension/check')
        if (loc == null) return undefined
        let mod = require(loc)
        if (typeof mod.requestCheck != 'function') {
            throw new Error(`${loc} should export requestCheck() function`)
        }
        return mod.requestCheck
    }

    private module(name: string): string | undefined {
        let loc = this.path(name)
        try {
            return require.resolve(loc)
        } catch(e: any) {
            return undefined
        }
    }

    @def
    private async context(): Promise<() => Context> {
        let dialect = this.dialect()
        if (await this.customResolvers()) {
            let con = await this.createTypeormConnection({sqlStatementTimeout: this.options.sqlStatementTimeout})
            this.disposals.push(() => con.destroy())
            let subscriptionCon = con
            if (this.options.subscriptions) {
                subscriptionCon = await this.createTypeormConnection({
                    sqlStatementTimeout: this.options.subscriptionSqlStatementTimeout || this.options.sqlStatementTimeout
                })
                this.disposals.push(() => subscriptionCon.destroy())
            }
            return () => {
                return {
                    openreader: new TypeormOpenreaderContext(dialect, con, subscriptionCon, this.options.subscriptionPollInterval)
                }
            }
        } else {
            let pool = await this.createPgPool({sqlStatementTimeout: this.options.sqlStatementTimeout})
            this.disposals.push(() => pool.end())
            let subscriptionPool = pool
            if (this.options.subscriptions) {
                subscriptionPool = await this.createPgPool({
                    sqlStatementTimeout: this.options.subscriptionSqlStatementTimeout || this.options.sqlStatementTimeout
                })
                this.disposals.push(() => subscriptionPool.end())
            }
            return () => {
                return {
                    openreader: new PoolOpenreaderContext(dialect, pool, subscriptionPool, this.options.subscriptionPollInterval)
                }
            }
        }
    }

    private async createTypeormConnection(options?: ConnectionOptions): Promise<DataSource> {
        let {createOrmConfig} = await import('@subsquid/typeorm-config')
        let {DataSource} = await import('typeorm')
        let cfg = {
            ...createOrmConfig({projectDir: this.dir}),
            extra: {
                statement_timeout: options?.sqlStatementTimeout || undefined
            }
        }
        let con = new DataSource(cfg)
        await con.initialize()
        return con
    }

    private async createPgPool(options?: ConnectionOptions): Promise<Pool> {
        let {createConnectionOptions} = await import('@subsquid/typeorm-config/lib/connectionOptions')
        let params = createConnectionOptions()
        return new Pool({
            host: params.host,
            port: params.port,
            database: params.database,
            user: params.username,
            password: params.password,
            statement_timeout: options?.sqlStatementTimeout || undefined
        })
    }

    private dialect(): Dialect {
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
