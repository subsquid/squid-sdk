import {mergeSchemas} from "@graphql-tools/schema"
import {Context} from "@subsquid/openreader/dist/context"
import {PoolOpenreaderContext} from "@subsquid/openreader/dist/db"
import {Dialect} from "@subsquid/openreader/dist/dialect"
import type {Model} from "@subsquid/openreader/dist/model"
import {SchemaBuilder} from "@subsquid/openreader/dist/opencrud/schema"
import {setupGraphiqlConsole} from "@subsquid/openreader/dist/server"
import {loadModel, resolveGraphqlSchema} from "@subsquid/openreader/dist/tools"
import {def} from "@subsquid/util-internal"
import {listen, ListeningServer} from "@subsquid/util-internal-http-server"
import {PluginDefinition} from "apollo-server-core"
import {ApolloServer} from "apollo-server-express"
import assert from "assert"
import express from "express"
import {GraphQLInt, GraphQLObjectType, GraphQLSchema} from "graphql"
import {useServer as useWsServer} from "graphql-ws/lib/use/ws"
import * as http from "http"
import * as path from "path"
import {Pool} from "pg"
import * as process from "process"
import type {DataSource} from "typeorm"
import {WebSocketServer} from "ws"
import {createCheckPlugin, RequestCheckFunction} from "./check"
import {loadCustomResolvers} from "./resolvers"
import {TypeormOpenreaderContext} from "./typeorm"


export interface ServerOptions {
    dir?: string
    sqlStatementTimeout?: number
    squidStatus?: boolean
    subscriptions?: boolean
    subscriptionPollInterval?: number
    subscriptionSqlStatementTimeout?: number
}


export class Server {
    private dir: string
    private cleanup: (() => Promise<void>)[] = []

    constructor(private options: ServerOptions = {}) {
        this.dir = path.resolve(options.dir || process.cwd())
    }

    @def
    async start(): Promise<ListeningServer> {
        return this.bootstrap().then(
            server => {
                return {
                    port: server.port,
                    close: () => {
                        return server.close().finally(() => this.dispose())
                    }
                }
            },
            async err => {
                await this.dispose()
                throw err
            }
        )
    }

    private async dispose(): Promise<void> {
        for (let i = this.cleanup.length - 1; i >= 0; i--) {
            await this.cleanup[i]().catch(err => {})
        }
    }

    private async bootstrap(): Promise<ListeningServer> {
        let schema = await this.schema()
        let context = await this.context()
        let app = express()
        let httpServer = http.createServer(app)

        let apolloPlugins: PluginDefinition[] = []
        let requestCheck = this.customCheck()
        if (requestCheck) {
            apolloPlugins.push(createCheckPlugin(requestCheck, this.model()))
        }

        if (this.options.subscriptions) {
            let wsServer = new WebSocketServer({server: httpServer, path: '/graphql'})
            let wsServerCleanup = useWsServer(
                {
                    schema,
                    context,
                    onNext(_ctx, _message, args, result) {
                        args.contextValue.openreader.close()
                        return result
                    }
                },
                wsServer
            )
            this.cleanup.push(async () => await wsServerCleanup.dispose())
        }

        apolloPlugins.push({
            async requestDidStart() {
                return {
                    willSendResponse(req: any) {
                        return req.context.openreader.close()
                    }
                }
            }
        })

        let apollo = new ApolloServer({
            schema,
            context,
            plugins: apolloPlugins,
            stopOnTerminationSignals: false
        })

        await apollo.start()
        setupGraphiqlConsole(app)
        apollo.applyMiddleware({app})
        return listen(httpServer, this.port())
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
            this.cleanup.push(() => con.destroy())
            let subscriptionCon = con
            if (this.options.subscriptions) {
                subscriptionCon = await this.createTypeormConnection({sqlStatementTimeout: this.options.subscriptionSqlStatementTimeout})
                this.cleanup.push(() => subscriptionCon.destroy())
            }
            return () => {
                return {
                    openreader: new TypeormOpenreaderContext(dialect, con, subscriptionCon, this.options.subscriptionPollInterval)
                }
            }
        } else {
            let pool = await this.createPgPool()
            this.cleanup.push(() => pool.end())
            let subscriptionPool = pool
            if (this.options.subscriptions) {
                subscriptionPool = await this.createPgPool({sqlStatementTimeout: this.options.subscriptionSqlStatementTimeout})
                this.cleanup.push(() => subscriptionPool.end())
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
