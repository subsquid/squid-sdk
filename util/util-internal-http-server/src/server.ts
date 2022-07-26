import assert from "assert"
import * as http from "http"
import {RequestListener} from "http"
import stoppable from "stoppable"


export interface ListeningServer {
    readonly port: number
    close(): Promise<void>
}


export interface HttpRequest extends http.IncomingMessage {
    method: string
    url: string
}


export class HttpContext {
    private _url?: URL

    constructor(
        public readonly request: HttpRequest,
        public readonly response: http.ServerResponse
    ) {
    }

    get url(): URL {
        if (this._url == null) {
            this._url = new URL(this.request.url, `http://localhost/`)
        }
        return this._url
    }

    send(status: number, body?: string | Uint8Array | object, contentType?: string): void {
        body = body || http.STATUS_CODES[status] || ''
        if (typeof body == 'object' && !(body instanceof Uint8Array)) {
            body = JSON.stringify(body)
            contentType = contentType || 'application/json'
        }
        let len: number
        if (typeof body == 'string') {
            contentType = contentType || 'text/plain'
            contentType += '; charset=UTF-8'
            len = Buffer.byteLength(body)
        } else {
            len = body.length
        }
        this.response.writeHead(status, {
            'content-type': contentType,
            'content-length': len
        }).end(body)
    }
}


export interface RequestHandler {
    (ctx: HttpContext): Promise<void>
}


export function createHttpServer(handler: RequestHandler, port?: number | string): Promise<ListeningServer> {
    return createNodeHttpServer(async (req, res) => {
        let ctx = new HttpContext(req as HttpRequest, res)
        try {
            await handler(ctx)
        } catch(err: any) {
            if (res.headersSent) {
                res.destroy()
            } else {
                ctx.send(500, err.stack)
            }
        }
    }, port)
}


export function createNodeHttpServer(handler: RequestListener, port?: number | string): Promise<ListeningServer> {
    let server = http.createServer(handler)
    return listen(server, port)
}


export function listen(server: http.Server, port?: number | string): Promise<ListeningServer> {
    let s = stoppable(server, 5000)

    function close(): Promise<void> {
        return new Promise((resolve, reject) => {
            s.stop((err, gracefully) => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    }

    return new Promise<ListeningServer>((resolve, reject) => {
        s.listen(port || 0, (err?: Error) => {
            if (err) {
                reject(err)
            } else {
                let address = s.address()
                assert(address != null && typeof address == 'object')
                resolve({
                    port: address.port,
                    close
                })
            }
        })
    })
}


export function waitForInterruption(server: ListeningServer): Promise<void> {
    return new Promise((resolve, reject) => {
        function terminate() {
            process.off('SIGINT', terminate)
            process.off('SIGTERM', terminate)
            server.close().then(resolve, reject)
        }

        process.on('SIGINT', terminate)
        process.on('SIGTERM', terminate)
    })
}
