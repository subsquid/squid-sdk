import {RpcClient, RpcConnectionError} from "./client"


export class ResilientRpcClient {
    private errors = 0
    private delays = [0, 0, 500, 2000] // 1 based array of delays
    private closed = false
    private client: Promise<RpcClient>

    constructor(private url: string) {
        this.client = Promise.resolve(new RpcClient(url))
    }

    async call<T=any>(method: string, params?: unknown[]): Promise<T> {
        let epoch = this.client
        let client = await this.client
        try {
            let result = await client.call(method, params)
            this.errors = 0
            return result
        } catch(e: unknown) {
            if (e instanceof RpcConnectionError) {
                if (epoch === this.client) {
                    this.reconnect()
                }
                return this.call(method, params)
            } else {
                throw e
            }
        }
    }

    private reconnect(): void {
        if (this.closed) return
        this.errors += 1
        let delay = this.delays[this.errors]
        if (delay == null) {
            this.client = Promise.reject(new RpcConnectionError(`Got ${this.errors} connection errors in a row`))
        } else {
            this.client = new Promise(resolve => {
                setTimeout(() => {
                    resolve(new RpcClient(this.url))
                }, delay)
            })
        }
    }

    close(err?: Error): void {
        if (this.closed) return
        this.closed = true
        this.client.then(client => client.close(err))
        this.client = Promise.reject(err || new Error('Closed'))
        this.client.catch(err => {
            // handle error, so that node doesn't warn you that something is unhandled
        })
    }
}
