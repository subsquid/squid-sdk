import {mergeResolvers} from "@graphql-tools/merge"
import type {IResolvers} from "@graphql-tools/utils"
import {ApolloServerPluginDrainHttpServer, Context, ContextFunction} from "apollo-server-core"
import type {PluginDefinition} from "apollo-server-core/src/types"
import {ApolloServer, ExpressContext} from "apollo-server-express"
import assert from "assert"
import express from "express"
import fs from "fs"
import type {DocumentNode} from "graphql"
import http from "http"
import path from "path"
import type {Pool} from "pg"
import {buildServerSchema} from "./gql/opencrud"
import type {Model} from "./model"
import {buildResolvers} from "./resolver"
import {Transaction} from "./db"


export type ResolversMap = IResolvers
export {PluginDefinition}


export interface ListeningServer {
    readonly port: number
    stop(): Promise<void>
}


export interface ServerOptions {
    model: Model
    db: Pool
    port: number | string
    graphiqlConsole?: boolean
    customTypeDefs?: [DocumentNode]
    customResolvers?: ResolversMap
    customContext?: (ctx: ExpressContext) => Promise<Record<string, any>>
    customPlugins?: PluginDefinition[]
    applyCustomMiddlewares?: (app: express.Application) => void
}


export async function serve(options: ServerOptions): Promise<ListeningServer> {
    let resolvers = buildResolvers(options.model)
    if (options.customResolvers) {
        resolvers = mergeResolvers([resolvers, options.customResolvers])
    }

    let typeDefs = [
        buildServerSchema(options.model),
        ...(options.customTypeDefs || [])
    ]

    let db = options.db
    let context: Context | ContextFunction
    if (options.customContext) {
        let customContext = options.customContext
        context = async (ctx) => {
            return {
                openReaderTransaction: new Transaction(db),
                ...(await customContext(ctx))
            }
        }
    } else {
        context = () => ({openReaderTransaction: new Transaction(db)})
    }

    let app = express()
    let server = http.createServer(app)
    let apollo = new ApolloServer({
        typeDefs,
        resolvers,
        context,
        plugins: [
            {
                async requestDidStart() {
                    return {
                        willSendResponse(req: any) {
                            return req.context.openReaderTransaction.close()
                        }
                    }
                }
            },
            ...(options.customPlugins || []),
            ApolloServerPluginDrainHttpServer({httpServer: server})
        ]
    })

    await apollo.start()

    options.applyCustomMiddlewares?.(app)
    if (options.graphiqlConsole !== false) {
        setupGraphiqlConsole(app)
    }
    apollo.applyMiddleware({app})

    return new Promise((resolve, reject) => {
        function onerror(err: Error) {
            cleanup()
            reject(err)
        }

        function onlistening() {
            cleanup()
            let address = server.address()
            assert(address != null && typeof address == 'object')
            resolve({
                port: address.port,
                stop: () => apollo.stop()
            })
        }

        function cleanup() {
            server.removeListener('error', onerror)
            server.removeListener('listening', onlistening)
        }

        server.on('error', onerror)
        server.on('listening', onlistening)
        server.listen(options.port)
    })
}


export function setupGraphiqlConsole(app: express.Application): void {
    let assets = path.join(
        require.resolve('@subsquid/graphiql-console/package.json'),
        '../build'
    )

    let indexHtml = fs.readFileSync(path.join(assets, 'index.html'), 'utf-8')
        .replace(/\/static\//g, 'console/static/')
        .replace('/manifest.json', 'console/manifest.json')
        .replace('${GRAPHQL_API}', 'graphql')
        .replace('${APP_TITLE}', 'Query node playground')

    app.use('/console', express.static(assets))

    app.use('/graphql', (req, res, next) => {
        if (req.path != '/') return next()
        if (req.method != 'GET' && req.method != 'HEAD') return next()
        if (req.query['query']) return next()
        res.vary('Accept')
        if (!req.accepts('html')) return next()
        res.type('html').send(indexHtml)
    })
}
