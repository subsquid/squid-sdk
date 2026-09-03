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
            if (this.isResponseTooLargeError(err)) {
                return true
            }
            if (this.isRpcInternalError(err)) {
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

    isResponseTooLargeError(err: RpcError): boolean {
        // Some providers (e.g. okx xlayer-mainnet, code -32020) intermittently reject a
        // request whose response exceeds an internal backend size cap. This is a transient
        // backend condition — the exact same block fetches fine moments later — so it must
        // be retried rather than crash the dumper into a restart loop. Treating it as
        // retryable also lets reduceBatchOnRetry split an oversized eth_getBlockReceipts
        // batch, the same way geth's "response too large" is already handled.
        return (
            err.code === -32020 || // okx "backend response too large"
            /response too large/i.test(err.message)
        )
    }

    isRpcInternalError(err: RpcError): boolean {
        return (
            err.code === -32000 || // generic "catch-all" code
            err.code === -32603 || // internal error
            /internal( server)? error/i.test(err.message)
        )
    }

    isRpcRateLimitError(err: RpcError): boolean {
        return (
            /rate limit|too many requests/i.test(err.message) ||
            err.code === -32005 || // Blockchain RPC convention error code for rate-limit exceeded error
            err.code === 429 // RPC error with HTTP rate-limit error code
        )
    }
}
