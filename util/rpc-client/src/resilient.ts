import assert from "assert"
import {RpcClient, RpcConnectionError, RpcError} from "./client"


export interface ResilientRpcClientOptions {
    readonly url: string
    readonly timeoutSeconds?: number
    readonly maxRetries?: number
    onRetry?(err: RpcConnectionError, errorsInRow: number, backoff: number): void
}


export class ResilientRpcClient {
    private errors = 0
    private backoff = [100, 500, 2000, 5000, 10000, 20000]
    private closed = false
    private client: Promise<RpcClient>

    constructor(private options: ResilientRpcClientOptions) {
        this.client = Promise.resolve(new RpcClient(options.url))
    }

    async call<T=any>(method: string, params?: unknown[]): Promise<T> {
        while (true) {
            let epoch = this.client
            let client = await epoch
            try {
                let result = await this.addTimeout(client.call(method, params))
                this.errors = 0
                return result
            } catch(e: unknown) {
                if (isRetryableError(e)) {
                    if (this.client === epoch) {
                        client.close(e)
                        this.reconnect(e)
                    }
                } else {
                    throw e
                }
            }
        }
    }

    private reconnect(err: Error): void {
        if (this.closed) throw err
        this.errors += 1
        if (this.errors > (this.options.maxRetries ?? Infinity)) {
            err = new RpcConnectionError(`Got ${this.errors} connection errors in a row. Last error: ${err.message}`)
            this.close(err)
            throw err
        }
        let backoff = this.backoff[Math.min(this.errors, this.backoff.length) - 1]
        if (isRateLimitError(err)) {
            backoff += backoff * 2 + 5000
        }
        this.client = new Promise(resolve => {
            setTimeout(() => {
                resolve(new RpcClient(this.options.url))
            }, backoff)
        })
        this.options.onRetry?.(err, this.errors, backoff)
    }

    private addTimeout(res: Promise<any>): Promise<any> {
        return new Promise((resolve, reject) => {
            let seconds = this.options.timeoutSeconds || 20
            assert(seconds > 0)

            let timer: any = setTimeout(() => {
                timer = undefined
                reject(new RpcConnectionError(`Request timed out in ${seconds / 1000} seconds`))
            }, seconds * 1000)

            res.finally(() => {
                if (timer != null) {
                    clearTimeout(timer)
                }
            }).then(resolve, reject)
        })
    }

    close(err?: Error): void {
        if (this.closed) return
        this.closed = true
        this.client.catch(() => {}).then(client => client?.close(err))
        this.client = Promise.reject(err || new Error('Closed'))
        this.client.catch(() => {})
    }
}


export function isRateLimitError(err: unknown): boolean {
    return err instanceof RpcError && /rate limit/i.test(err.message)
}


export function isRetryableError(err: unknown): err is Error {
    return err instanceof RpcConnectionError || isRateLimitError(err)
}
