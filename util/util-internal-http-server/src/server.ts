import assert from "assert"
import * as http from "http"
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
    let server = stoppable(http.createServer(async (req, res) => {
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
    }), 1000)

    function close(): Promise<void> {
        return new Promise((resolve, reject) => {
            server.stop((err, gracefully) => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    }

    return new Promise<ListeningServer>((resolve, reject) => {
        server.listen(port || 0, (err?: Error) => {
            if (err) {
                reject(err)
            } else {
                let address = server.address()
                assert(address != null && typeof address == 'object')
                resolve({
                    port: address.port,
                    close
                })
            }
        })
    })
}
