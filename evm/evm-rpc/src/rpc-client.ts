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
            if (this.isUpstreamUnavailableError(err)) {
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

    isRpcInternalError(err: RpcError): boolean {
        return (
            err.code === -32000 || // generic "catch-all" code
            err.code === -32603 || // internal error
            /internal( server)? error/i.test(err.message)
        )
    }

    isUpstreamUnavailableError(err: RpcError): boolean {
        // Load-balancing / aggregating providers (e.g. uniblock) report a transient
        // "service unavailable" error when all of their upstream providers momentarily
        // fail to fulfill a request. This is an availability problem (the HTTP 503
        // analog), not a permanent one, so it must be retried rather than crash the
        // ingestion process.
        return (
            err.code === -32503 || // JSON-RPC "service unavailable" code used by aggregating providers
            /prevented the request from being fulfilled/i.test(err.message)
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
