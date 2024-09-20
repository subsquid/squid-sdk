import {RpcClient, RpcClientOptions} from '@subsquid/rpc-client'


export interface SolanaRpcClientOptions extends RpcClientOptions {
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


export class SolanaRpcClient extends RpcClient {
    constructor(options: SolanaRpcClientOptions) {
        super({
            retryAttempts: Number.MAX_SAFE_INTEGER,
            ...options,
            fixUnsafeIntegers: true
        })
    }
}
