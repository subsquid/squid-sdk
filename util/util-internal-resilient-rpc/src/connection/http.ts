import {RpcError, RpcProtocolError} from '@subsquid/rpc-client'
import {RpcRequest, RpcResponse} from '@subsquid/rpc-client/lib/rpc'
import {
    HttpAgent,
    HttpClient,
    HttpError,
    HttpTimeoutError,
    isHttpConnectionError
} from '@subsquid/util-internal-http-client'
import {isRateLimitError} from '../util'
import {CommonConnectionOptions, ConnectionBase} from './base'


export class HttpRpcConnection extends ConnectionBase {
    private agent: HttpAgent
    private http: HttpClient

    constructor(options: CommonConnectionOptions) {
        super(options)
        this.agent = new HttpAgent({
            keepAlive: true
        })
        this.http = new HttpClient({
            baseUrl: this.url,
            agent: this.agent,
            httpTimeout: this.requestTimeout
        })
    }

    protected async call(id: number, method: string, params?: unknown[]): Promise<any> {
        let json: RpcRequest = {
            jsonrpc: '2.0',
            id,
            method,
            params
        }

        let res: RpcResponse = await this.http.post('/', {
            json,
            retryAttempts: 0
        })

        if (res.id != json.id) throw new RpcProtocolError(undefined, 'HTTP RPC response id does not match request id')
        if (res.error) throw new RpcError(res.error)
        return res.result
    }

    protected isRetryableError(err: unknown): boolean {
        if (isRateLimitError(err)) return true
        if (isHttpConnectionError(err)) return true
        if (err instanceof HttpTimeoutError) return true
        if (err instanceof HttpError) {
            switch(err.response.status) {
                case 429:
                case 502:
                case 503:
                case 504:
                    return true
                default:
                    return false
            }
        }
        return false
    }

    protected async reconnect(): Promise<void> {}

    protected cleanup(): void {
        this.agent.close()
    }
}
