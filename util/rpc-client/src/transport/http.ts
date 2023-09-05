import {HttpAgent, HttpClient} from '@subsquid/http-client'
import {Logger} from '@subsquid/logger'
import {RpcProtocolError} from '../errors'
import {Connection, RpcRequest, RpcResponse} from '../interfaces'


export class HttpConnection implements Connection {
    private agent: HttpAgent
    private http: HttpClient

    constructor(private url: string, private log?: Logger) {
        this.agent = new HttpAgent({
            keepAlive: true
        })
        this.http = new HttpClient({
            agent: this.agent
        })
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
