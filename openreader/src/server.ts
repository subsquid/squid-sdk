import {ApolloServerPluginDrainHttpServer} from "apollo-server-core"
import {ApolloServer} from "apollo-server-express"
import assert from "assert"
import express from "express"
import fs from "fs"
import http from "http"
import path from "path"
import type {Pool} from "pg"
import {PoolTransaction} from "./db"
import {buildServerSchema} from "./gql/opencrud"
import type {Model} from "./model"
import {buildResolvers} from "./resolver"


export interface ListeningServer {
    readonly port: number
    stop(): Promise<void>
}


export interface ServerOptions {
    model: Model
    db: Pool
    port: number | string
    graphiqlConsole?: boolean
}


export async function serve(options: ServerOptions): Promise<ListeningServer> {
    let {model, db} = options
    let resolvers = buildResolvers(model)
    let typeDefs = buildServerSchema(model)
    let app = express()
    let server = http.createServer(app)

    let apollo = new ApolloServer({
        typeDefs,
        resolvers,
        context: () => ({openReaderTransaction: new PoolTransaction(db)}),
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
            ApolloServerPluginDrainHttpServer({httpServer: server})
        ]
    })

    if (options.graphiqlConsole !== false) {
        setupGraphiqlConsole(app)
    }

    await apollo.start()
    apollo.applyMiddleware({app})
    return listen(apollo, server, options.port)
}


export function listen(apollo: ApolloServer, server: http.Server, port: number | string): Promise<ListeningServer> {
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
        server.listen(port)
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
