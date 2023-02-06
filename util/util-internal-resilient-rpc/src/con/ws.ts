import {RpcClient as WebsocketRpcClient, RpcConnectionError, RpcError} from '@subsquid/rpc-client'
import {addTimeout, TimeoutError} from '@subsquid/util-timeout'
import {isRateLimitError} from '../util'
import {CommonConnectionOptions, ConnectionBase} from './base'


export class WsRpcConnection extends ConnectionBase {
    private client: WebsocketRpcClient

    constructor(options: CommonConnectionOptions) {
        super(options)
        this.client = new WebsocketRpcClient(this.url)
    }

    protected call(id: number, method: string, params?: unknown[]): Promise<any> {
        return addTimeout(this.client._callWithId(id, method, params), this.requestTimeout)
    }

    protected isRetryableError(err: unknown): boolean {
        if (err instanceof RpcConnectionError) return true
        if (err instanceof TimeoutError) return true
        if (isRateLimitError(err)) return true
        return false
    }

    protected async reconnect(): Promise<void> {
        this.client.close()
        this.client = new WebsocketRpcClient(this.url)
        await this.client.connect()
    }

    protected cleanup(): void {
        this.client.close()
    }
}
