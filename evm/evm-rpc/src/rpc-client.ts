import { RpcClient, RpcError, RpcClientOptions } from '@subsquid/rpc-client'
import { HttpError } from '@subsquid/http-client'

export interface EvmRpcClientOptions extends RpcClientOptions {
    /**
     * Whether internal server errors should be treated as retryable.
     * 
     * This includes:
     * - HTTP 500 (internal server error)
     * - RPC -32000 (catch-all)
     * - RPC -32603 (internal error)
     */
    retryInternalServerErrors?: boolean
}

export class EvmRpcClient extends RpcClient {
    private retryInternalServerErrors: boolean

    constructor(options: EvmRpcClientOptions) {
        super(options)
        this.retryInternalServerErrors = options.retryInternalServerErrors ?? false
    }

    isConnectionError(err: Error): boolean {
        if (super.isConnectionError(err)) {
            return true
        }
        if (err instanceof RpcError) {
            if (this.isRpcRateLimitError(err)) {
                return true
            }
            switch(err.code) {
                case -32000: // generic "catch-all" code
                case -32603: // internal error
                    return this.retryInternalServerErrors
            }
        }
        if (err instanceof HttpError) {
            if (err.response.status === 500 && this.retryInternalServerErrors) {
                return true
            }
        }
        return false
    }

    isRpcRateLimitError(err: RpcError): boolean {
        return (
            /rate limit|too many requests/i.test(err.message) ||
            err.code === -32005 || // Blockchain RPC convention error code for rate-limit exceeded error
            err.code === 429 // RPC error with HTTP rate-limit error code
        )
    }
}
