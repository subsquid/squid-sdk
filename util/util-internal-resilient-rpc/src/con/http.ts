import {RpcError, RpcProtocolError} from '@subsquid/rpc-client'
import {RpcRequest, RpcResponse} from '@subsquid/rpc-client/lib/rpc'
import {HttpClient} from '@subsquid/util-internal-http-client'
import {HttpAgent} from '@subsquid/util-internal-http-client/lib/agent'
import {CommonConnectionOptions, ConnectionBase} from './base'


export class HttpRpcConnection extends ConnectionBase {
    private idCounter = 0
    private agent: HttpAgent
    private http: HttpClient

    constructor(options: CommonConnectionOptions) {
        super(options)
        this.agent = new HttpAgent({
            keepAlive: true
        })
        this.http = new HttpClient({
            baseUrl: this.url,
            agent: this.agent
        })
    }

    protected async call(method: string, params?: unknown[]): Promise<any> {
        let json: RpcRequest = {
            jsonrpc: '2.0',
            id: this.idCounter += 1,
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
        return false
    }

    protected async reconnect(): Promise<void> {}

    protected cleanup(): void {
        this.agent.close()
    }
}
