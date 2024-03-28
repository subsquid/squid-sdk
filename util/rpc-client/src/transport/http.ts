import {FetchRequest, FetchResponse, HttpAgent, HttpClient, HttpClientOptions} from '@subsquid/http-client'
import {Logger} from '@subsquid/logger'
import {fixUnsafeIntegers} from '@subsquid/util-internal-json-fix-unsafe-integers'
import {RpcProtocolError} from '../errors'
import {Connection, RpcRequest, RpcResponse} from '../interfaces'


class RpcHttpClient extends HttpClient {
    fixUnsafeIntegers = false

    protected async handleResponseBody(req: FetchRequest, res: FetchResponse): Promise<any> {
        if (!res.ok) return super.handleResponseBody(req, res)
        let json = await res.text()
        try {
            if (this.fixUnsafeIntegers) {
                json = fixUnsafeIntegers(json)
            }
            return JSON.parse(json)
        } catch(err: any) {
            throw new RpcProtocolError(1008, `server returned invalid JSON: ${err.message}`)
        }
    }
}


export interface HttpConnectionOptions {
    url: string
    fixUnsafeIntegers?: boolean
    log?: Logger
    headers?: HttpClientOptions['headers']
}


export class HttpConnection implements Connection {
    private url: string
    private log?: Logger
    private agent: HttpAgent
    private http: RpcHttpClient

    constructor(options: HttpConnectionOptions) {
        this.url = options.url
        this.log = options.log
        this.agent = new HttpAgent({
            keepAlive: true
        })
        this.http = new RpcHttpClient({
            agent: this.agent,
            headers: options.headers,
        })
        this.http.fixUnsafeIntegers = options.fixUnsafeIntegers || false
    }

    close(err?: Error): void {
        if (err) {
            this.log?.error(err)
        }
        this.agent.close()
    }

    connect(): Promise<void> {
        return Promise.resolve()
    }

    async call(req: RpcRequest, timeout?: number): Promise<RpcResponse> {
        let res: RpcResponse = await this.http.post(this.url, {
            json: req,
            httpTimeout: timeout,
            retryAttempts: 0
        })
        if (req.id !== res.id) {
            throw new RpcProtocolError(1008, `Got response for unknown request ${res.id}`)
        }
        return res
    }

    async batchCall(batch: RpcRequest[], timeout?: number): Promise<RpcResponse[]> {
        let res: RpcResponse[] = await this.http.post(this.url, {
            json: batch,
            httpTimeout: timeout,
            retryAttempts: 0
        })
        if (!Array.isArray(res)) {
            throw new RpcProtocolError(1008, `Response for a batch request should be an array`)
        }
        if (res.length != batch.length) {
            throw new RpcProtocolError(1008, `Invalid length of a batch response`)
        }
        let reordered = false
        for (let i = 0; i < batch.length; i++) {
            if (batch[i].id !== res[i].id) {
                reordered = true
                break
            }
        }
        if (reordered) {
            let m = new Map(res.map(r => [r.id, r]))
            res = new Array(batch.length)
            for (let i = 0; i < batch.length; i++) {
                let r = m.get(batch[i].id)
                if (r == null) {
                    throw new RpcProtocolError(
                        1008,
                        `Missing result from call ${JSON.stringify(batch[i])} in the batch response`
                    )
                }
                res[i] = r
            }
        }
        return res
    }
}
