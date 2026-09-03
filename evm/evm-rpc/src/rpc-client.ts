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
            if (this.isErpcUpstreamsExhaustedError(err)) {
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

    /**
     * eRPC replies with HTTP 200 + a JSON-RPC error when its whole upstream set
     * is temporarily unavailable (all providers rate-limited / 5xx). It attaches
     * a stable `data.code` and can normalize the code to a misleading value
     * (e.g. -32601), so key off `data.code` and retry like a direct provider 5xx.
     */
    isErpcUpstreamsExhaustedError(err: RpcError): boolean {
        let code = (err.data as any)?.code
        return code === 'ErrUpstreamsExhausted' || code === 'ErrFailsafeRetryExceeded'
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
