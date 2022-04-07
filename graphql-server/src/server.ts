import {mergeResolvers} from "@graphql-tools/merge"
import {createPoolConfig, PoolTransaction} from "@subsquid/openreader/dist/db"
import {buildServerSchema} from "@subsquid/openreader/dist/gql/opencrud"
import {Model} from "@subsquid/openreader/dist/model"
import {buildResolvers, ResolverContext} from "@subsquid/openreader/dist/resolver"
import {listen, ListeningServer, setupGraphiqlConsole} from "@subsquid/openreader/dist/server"
import {loadModel, resolveGraphqlSchema} from "@subsquid/openreader/dist/tools"
import {assertNotNull, def} from "@subsquid/util-internal"
import {ApolloServerPluginDrainHttpServer, PluginDefinition} from "apollo-server-core"
import {ApolloServer, ApolloServerExpressConfig} from "apollo-server-express"
import assert from "assert"
import express from "express"
import * as http from "http"
import * as path from "path"
import {Pool} from "pg"
import * as process from "process"
import type {Connection} from "typeorm"
import {createCheckPlugin, RequestCheckFunction} from "./check"
import type {CustomResolvers} from "./resolvers"
import {TypeormTransaction} from "./typeorm"


export class Server {
    private dir: string
    private db?: Pool | Connection

    constructor(dir?: string) {
        this.dir = path.resolve(dir || process.cwd())
    }

    path(name: string): string {
        return path.join(this.dir, name)
    }

    run(): void {
        this.start().then(
            s => {
                console.log(`Squid graphql server is listening on port ${s.port}`)
            },
            err => {
                console.error(err)
                process.exit(1)
            }
        )
    }

    private getPort(): number | string {
        return process.env.GQL_PORT || process.env.GRAPHQL_SERVER_PORT || 4000
    }

    @def
    async start(): Promise<ListeningServer> {
        let app = this.app()
        let cfg = await this.config()
        let apollo = new ApolloServer(cfg)

        await apollo.start()

        try {
            setupGraphiqlConsole(app)
            apollo.applyMiddleware({app})
            return await listen(apollo, this.httpServer(), this.getPort())
        } catch(e: any) {
            await apollo.stop().catch(err => {
                e = new Error(e.stack + '\n\n' + err.stack)
            })
            throw e
        }
    }

    @def
    app(): express.Application {
        return express()
    }

    @def
    httpServer(): http.Server {
        return http.createServer(this.app())
    }

    @def
    async config(): Promise<ApolloServerExpressConfig> {
        let plugins: PluginDefinition[] = []
        let typeDefs = [buildServerSchema(this.model())]
        let resolvers = buildResolvers(this.model())

        let requestCheck = this.customCheck()
        if (requestCheck) {
            plugins.push(createCheckPlugin(requestCheck, this.model()))
        }

        let context: () => ResolverContext

        let customResolvers = await this.customResolvers()
        if (customResolvers) {
            typeDefs.push(customResolvers.typeDefs)
            resolvers = mergeResolvers([resolvers, customResolvers.resolvers])
            context = () => this.createTypeormResolverContext()
        } else {
            context = () => this.createPoolResolverContext()
        }

        plugins.push({
            serverWillStart: async () => {
                if (customResolvers) {
                    this.db = await this.typeormConnection()
                } else {
                    this.db = this.pgPool()
                }
                return {
                    serverWillStop: async () => {
                        if (this.db == null) return
                        if (this.db instanceof Pool) {
                            await this.db.end()
                        } else {
                            await this.db.close()
                        }
                    }
                }
            },
            async requestDidStart() {
                return {
                    willSendResponse(req: any) {
                        return req.context.openReaderTransaction.close()
                    }
                }
            }
        })

        plugins.push(
            ApolloServerPluginDrainHttpServer({httpServer: this.httpServer()})
        )

        return {
            typeDefs,
            resolvers,
            context,
            plugins
        }
    }

    private createTypeormResolverContext(): ResolverContext {
        let db = assertNotNull(this.db)
        assert(!(db instanceof Pool))
        return {openReaderTransaction: new TypeormTransaction(db)}
    }

    private createPoolResolverContext(): ResolverContext {
        let db = assertNotNull(this.db)
        assert(db instanceof Pool)
        return {openReaderTransaction: new PoolTransaction(db)}
    }

    @def
    async customResolvers(): Promise<CustomResolvers | undefined> {
        let loc = this.module('lib/server-extension/resolvers')
        if (loc == null) return undefined
        let {loadCustomResolvers} = await import('./resolvers')
        return loadCustomResolvers(loc)
    }

    @def
    customCheck(): RequestCheckFunction | undefined {
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
    pgPool() {
        let cfg = createPoolConfig()
        return new Pool(cfg)
    }

    @def
    async typeormConnection(): Promise<Connection> {
        let {createOrmConfig} = await import('@subsquid/typeorm-config')
        let {createConnection} = await import('typeorm')
        let cfg = createOrmConfig({projectDir: this.dir})
        return createConnection(cfg)
    }

    @def
    model(): Model {
        let file = resolveGraphqlSchema(this.dir)
        return loadModel(file)
    }
}
