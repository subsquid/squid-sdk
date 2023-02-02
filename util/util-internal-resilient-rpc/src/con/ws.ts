import {RpcClient as WebsocketRpcClient} from '@subsquid/rpc-client'
import {CommonConnectionOptions, ConnectionBase} from './base'


export class WsRpcConnection extends ConnectionBase {
    private client: WebsocketRpcClient

    constructor(options: CommonConnectionOptions) {
        super(options)
        this.client = new WebsocketRpcClient(this.url)
    }

    protected call(method: string, params?: unknown[]): Promise<any> {
        return this.client.call(method, params)
    }

    protected isRetryableError(err: unknown): boolean {
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
