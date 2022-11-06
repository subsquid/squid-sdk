import {Logger} from '@subsquid/logger'
import {listen, ListeningServer} from '@subsquid/util-internal-http-server'
import {KeyValueCache, PluginDefinition} from 'apollo-server-core'
import {ApolloServer} from 'apollo-server-express'
import express from 'express'
import fs from 'fs'
import {ExecutionArgs, GraphQLSchema} from 'graphql'
import {useServer as useWsServer} from 'graphql-ws/lib/use/ws'
import http from 'http'
import path from 'path'
import type {Pool} from 'pg'
import {WebSocketServer} from 'ws'
import {Context, OpenreaderContext} from './context'
import {PoolOpenreaderContext} from './db'
import type {Dialect} from './dialect'
import type {Model} from './model'
import {SchemaBuilder} from './opencrud/schema'
import {logGraphQLError} from './util/error-handling'
import {executeWithLimit} from './util/execute'
import {ResponseSizeLimit} from './util/limit'


export interface ServerOptions {
    port: number | string
    model: Model
    connection: Pool
    dialect?: Dialect
    graphiqlConsole?: boolean
    log?: Logger
    maxRequestSizeBytes?: number
    maxRootFields?: number
    maxResponseNodes?: number
    subscriptions?: boolean
    subscriptionPollInterval?: number
    subscriptionConnection?: Pool
    subscriptionMaxResponseNodes?: number,
    cache?: KeyValueCache
}

export async function serve(options: ServerOptions): Promise<ListeningServer> {
    let {connection, subscriptionConnection, subscriptionPollInterval, maxResponseNodes, subscriptionMaxResponseNodes} = options
    let dialect = options.dialect ?? 'postgres'

    let schema = new SchemaBuilder(options).build()

    let context = () => {
        let openreader: OpenreaderContext = new PoolOpenreaderContext(
            dialect,
            connection,
            subscriptionConnection,
            subscriptionPollInterval
        )

        if (maxResponseNodes) {
            openreader.responseSizeLimit = new ResponseSizeLimit(maxResponseNodes)
            openreader.subscriptionResponseSizeLimit = new ResponseSizeLimit(maxResponseNodes)
        }

        if (subscriptionMaxResponseNodes) {
            openreader.subscriptionResponseSizeLimit = new ResponseSizeLimit(subscriptionMaxResponseNodes)
        }

        return {
            openreader
        }
    }

    let disposals: Dispose[] = []

    return addServerCleanup(disposals, runApollo({
        port: options.port,
        schema,
        context,
        disposals,
        subscriptions: options.subscriptions,
        log: options.log,
        graphiqlConsole: options.graphiqlConsole,
        maxRequestSizeBytes: options.maxRequestSizeBytes,
        maxRootFields: options.maxRootFields,
        cache: options.cache,
    }), options.log)
}


export type Dispose = () => Promise<void>


export interface ApolloOptions {
    port: number | string
    disposals: Dispose[]
    context: () => Context
    schema: GraphQLSchema
    plugins?: PluginDefinition[]
    subscriptions?: boolean
    graphiqlConsole?: boolean
    log?: Logger
    maxRequestSizeBytes?: number
    maxRootFields?: number
    cache?: KeyValueCache
}


export async function runApollo(options: ApolloOptions): Promise<ListeningServer> {
    const {disposals, context, schema, log, maxRootFields} = options

    let maxRequestSizeBytes = options.maxRequestSizeBytes ?? 256 * 1024
    let app = express()
    let server = http.createServer(app)

    const execute = maxRootFields
            ? (args: ExecutionArgs) => executeWithLimit(maxRootFields, args)
            : undefined

    if (options.subscriptions) {
        let wsServer = new WebSocketServer({
            server,
            path: '/graphql',
            maxPayload: maxRequestSizeBytes
        })
        let wsServerCleanup = useWsServer(
            {
                schema,
                context,
                execute,
                onError(ctx, message, errors) {
                    if (log) {
                        // FIXME: we don't want to log client errors
                        for (let err of errors) {
                            logGraphQLError(log, err)
                        }
                    }
                },
                onNext(_ctx, _message, args, result) {
                    args.contextValue.openreader.close()
                    return result
                }
            },
            wsServer
        )
        disposals.push(async () => wsServerCleanup.dispose())
    }


    let apollo = new ApolloServer({
        schema,
        context,
        cache: options.cache,
        stopOnTerminationSignals: false,
        allowBatchedHttpRequests: false,
        executor: execute && (async req => {
            return execute({
                schema,
                document: req.document,
                rootValue: {},
                contextValue: req.context,
                variableValues: req.request.variables,
                operationName: req.operationName
            })
        }),
        plugins: [
            ...options.plugins || [],
            {
                async requestDidStart() {
                    return {
                        willSendResponse(req: any) {
                            return req.context.openreader.close()
                        },
                        async didEncounterErrors(req) {
                            if (req.operation && log) {
                                for (let err of req.errors) {
                                    logGraphQLError(log, err)
                                }
                            }
                        }
                    }
                }
            },
        ]
    })

    if (options.graphiqlConsole !== false) {
        setupGraphiqlConsole(app)
    }

    await apollo.start()
    disposals.push(() => apollo.stop())

    apollo.applyMiddleware({
        app,
        bodyParserConfig: {
            limit: maxRequestSizeBytes
        }
    })

    return listen(server, options.port)
}

export function addServerCleanup(disposals: Dispose[], server: Promise<ListeningServer>, log?: Logger): Promise<ListeningServer> {
    async function cleanup() {
        for (let i = disposals.length - 1; i >= 0; i--) {
            await disposals[i]().catch(err => log?.error(err))
        }
    }

    return server.then(
        s => {
            return {
                port: s.port,
                close: () => s.close().finally(cleanup)
            }
        },
        async err => {
            await cleanup()
            throw err
        }
    )
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
