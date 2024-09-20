import {createLogger, Logger} from '@subsquid/logger'
import assert from 'assert'
import {HttpContext, HttpContextOptions, HttpRequest, HttpResponse} from './ctx'
import {isHttpError} from './http-error'
import {GetPatternParams, PathPattern} from './path-pattern'
import {HttpResource} from './resource'
import {createHttpServer, HttpServerOptions, ListeningServer} from './server'


interface RoutePath {
    match(path: string): object | undefined
}


interface Route {
    resource: HttpResource<object>
    path: RoutePath
}


export class HttpApp {
    private routes: Route[] = []
    private loggingNamespace = 'sqd:http-server'
    private _log?: Logger
    private ctx: HttpContextOptions = {
        maxRequestBody: 1024 * 1024
    }
    private serverOptions: HttpServerOptions = {}

    add<P extends string>(path: P, resource: HttpResource<GetPatternParams<P>>): this {
        this.routes.push({
            path: new PathPattern(path),
            resource
        })
        return this
    }

    setMaxRequestBody(bytes: number): this {
        assert(bytes > 0)
        this.ctx.maxRequestBody = bytes
        return this
    }

    setLogger(log: Logger): this {
        this._log = log
        return this
    }

    setLoggingNamespace(ns: string): this {
        this.loggingNamespace = ns
        return this
    }

    setSocketTimeout(ms: number): this {
        this.serverOptions.socketTimeout = ms
        return this
    }

    private get log(): Logger {
        if (this._log) return this._log
        return this._log = createLogger(this.loggingNamespace)
    }

    listen(port: number | string = 0): Promise<ListeningServer> {
        return createHttpServer((req, res) => {
            this.handle(req as HttpRequest, res).catch(
                err => this.handleSystemError(err, req as HttpRequest, res)
            )
        }, {
            ...this.serverOptions,
            port
        })
    }

    private async handle(req: HttpRequest, res: HttpResponse): Promise<void> {
        let ctx = new HttpContext(req, res, {}, this.ctx)
        let path = ctx.url.pathname
        for (let route of this.routes) {
            let params = route.path.match(path)
            if (params) {
                ctx.params = params
                return this.handleResource(ctx, route.resource).catch(err => {
                    this.handleError(err, ctx)
                })
            }
        }
        ctx.send(404, `${path} not found`)
    }

    private async handleResource(ctx: HttpContext<unknown>, resource: HttpResource<unknown>): Promise<void> {
        let method = ctx.request.method
        let res = resource as {
            [method: string]: (ctx: HttpContext<unknown>) => Promise<void>
        }
        if (res[method]) return res[method](ctx)
        if (method == 'HEAD' && res['GET']) return res['GET'](ctx)
        // Handle OPTIONS
        ctx.response.setHeader('allow', allowedMethods(Object.keys(resource)))
        if (method == 'OPTIONS') {
            ctx.send(204)
        } else {
            ctx.send(405, `${method} is not allowed`)
        }
    }

    private handleError(err: Error, ctx: HttpContext): void {
        if (ctx.response.headersSent) {
            this.handleSystemError(err, ctx.request, ctx.response)
        } else if (isHttpError(err)) {
            if (err.headers) {
                for (let name in err.headers) {
                    ctx.response.setHeader(name, err.headers[name])
                }
            }
            ctx.send(err.status, err.body)
        } else {
            this.handleSystemError(err, ctx.request, ctx.response)
        }
    }

    private handleSystemError(err: Error, req: HttpRequest, res: HttpResponse): void {
        err = ensureError(err)
        this.log.error(err)
        if (res.headersSent) {
            res.destroy()
        } else {
            clearHeaders(res)
            let body = 'Internal server error\n\n' + err.stack
            res.writeHead(500, {
                'content-type': 'text/plain; charset=UTF-8',
                'content-length': Buffer.byteLength(body)
            }).end(body)
        }
    }
}


function allowedMethods(methods: string[]): string {
    let options = new Set(methods)
    if (options.has('GET')) {
        options.add('HEAD')
    }
    options.add('OPTIONS')
    return Array.from(options).sort().join(', ')
}


function clearHeaders(res: HttpResponse): void {
    for (let name of res.getHeaderNames()) {
        res.removeHeader(name)
    }
}


class NonErrorThrow extends Error {
    constructor(public readonly value: unknown) {
        super('Non-error object was thrown')
    }
}


function ensureError(val: unknown): Error {
    if (val instanceof Error) {
        return val
    } else {
        return new NonErrorThrow(val)
    }
}
