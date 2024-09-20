import assert from 'assert'
import http from 'http'
import {StringDecoder} from 'string_decoder'
import {HttpError} from './http-error'


export interface HttpRequest extends http.IncomingMessage {
    method: string
    url: string
}


export interface HttpResponse extends http.ServerResponse {}


export interface HttpContextOptions {
    maxRequestBody: number
}


export class HttpContext<Params=object> {
    private _url?: URL
    private requestBodyConsumed = false

    constructor(
        public readonly request: HttpRequest,
        public readonly response: HttpResponse,
        public params: Params,
        private options: HttpContextOptions
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
        contentType = contentType || this.response.getHeader('content-type')?.toString()
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

    getContentLength(): number | undefined {
        let val = this.request.headers['content-length']
        if (val == null) return
        let len = parseInt(val, 10)
        if (Number.isSafeInteger(len) && len >= 0) return len
        throw new HttpError(400, 'invalid content-length header')
    }

    async getText(): Promise<string> {
        let body = ''
        let decoder = new StringDecoder('utf-8') // FIXME: handle charset
        await this.consume(buf => {
            body += decoder.write(buf)
        })
        body += decoder.end()
        return body
    }

    private consume(cb: (data: Buffer) => void): Promise<void> {
        return new Promise((resolve, reject) => {
            assert(!this.requestBodyConsumed)
            this.requestBodyConsumed = true

            let len = this.getContentLength()
            let limit = this.options.maxRequestBody
            if (len != null && len > limit) return reject(new HttpError(413))

            let received = 0

            let onData = (data: Buffer): void => {
                received += data.length
                if (len != null && received > len) {
                    this.request.off('data', onData)
                    reject(new HttpError(400, 'request body exceeded content-length'))
                } else if (received > limit) {
                    this.request.off('data', onData)
                    reject(new HttpError(413))
                } else {
                    cb(data)
                }
            }

            this.request.on('data', onData)

            this.request.on('end', () => {
                if (len == null || len == received) {
                    resolve()
                } else {
                    reject(new HttpError(400, 'request body did not match content-length'))
                }
            })

            this.request.on('error', reject)
        })
    }

    async getJson<T=unknown>(): Promise<T> {
        let text = await this.getText()
        try {
            return JSON.parse(text)
        } catch(err: any) {
            throw new HttpError(400, 'expected JSON body')
        }
    }
}
