import type {Logger} from "@subsquid/logger"
import {listen, ListeningServer} from "@subsquid/util-internal-http-server"
import {ApolloServer} from "apollo-server-express"
import express from "express"
import fs from "fs"
import {Disposable} from "graphql-ws"
import {useServer as useWsServer} from "graphql-ws/lib/use/ws"
import http from "http"
import path from "path"
import type {Pool} from "pg"
import {WebSocketServer} from "ws"
import {PoolOpenreaderContext} from "./db"
import type {Dialect} from "./dialect"
import type {Model} from "./model"
import {SchemaBuilder} from "./opencrud/schema"


export interface ServerOptions {
    port: number | string
    model: Model
    connection: Pool
    dialect?: Dialect
    subscriptions?: boolean
    subscriptionPollInterval?: number
    subscriptionConnection?: Pool
    graphiqlConsole?: boolean
    log?: Logger
}


export async function serve(options: ServerOptions): Promise<ListeningServer> {
    let {connection, subscriptionConnection, subscriptionPollInterval} = options
    let dialect = options.dialect ?? 'postgres'

    let schema = new SchemaBuilder(options).build()

    let app = express()
    let server = http.createServer(app)
    let wsServerCleanup: Disposable | undefined

    if (options.subscriptions) {
        let wsServer = new WebSocketServer({server, path: '/graphql'})
        wsServerCleanup = useWsServer(
            {
                schema,
                context() {
                    return {
                        openreader: new PoolOpenreaderContext(dialect, connection, subscriptionConnection, subscriptionPollInterval)
                    }
                },
                onNext(_ctx, _message, args, result) {
                    args.contextValue.openreader.close()
                    return result
                }
            },
            wsServer
        )
    }

    let apollo = new ApolloServer({
        schema,
        context: () => {
            return {
                openreader: new PoolOpenreaderContext(dialect, connection)
            }
        },
        plugins: [
            {
                async requestDidStart() {
                    return {
                        willSendResponse(req: any) {
                            return req.context.openreader.close()
                        }
                    }
                }
            }
        ],
        stopOnTerminationSignals: false
    })

    if (options.graphiqlConsole !== false) {
        setupGraphiqlConsole(app)
    }

    await apollo.start()
    apollo.applyMiddleware({app})
    return listen(server, options.port).then(s => {
        return {
            port: s.port,
            async close() {
                try {
                    await wsServerCleanup?.dispose()
                } catch(e: any) {}
                await s.close()
            }
        }
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
