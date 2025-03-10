import {RpcClient, RpcClientOptions} from '@subsquid/rpc-client'

export interface StarknetRpcClientOptions extends RpcClientOptions {
    /**
     * Retry on connection error.
     *
     * By default, retries indefinitely.
     */
    retryAttempts?: number
    /**
     * Unsafe integer check must be always enabled
     */
    fixUnsafeIntegers?: true
}


export class StarknetRpcClient extends RpcClient {
    constructor(options: StarknetRpcClientOptions) {
        super({
            retryAttempts: Number.MAX_SAFE_INTEGER,
            ...options,
            fixUnsafeIntegers: true
        })
    }
}