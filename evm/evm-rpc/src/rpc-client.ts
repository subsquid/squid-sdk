import { RetryError, RpcClient, RpcError, RpcClientOptions } from '@subsquid/rpc-client'
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
            if (this.isRpcTransientError(err)) {
                return true
            }
            if (this.isRpcInternalError(err)) {
                return this.retryInternalServerErrors
            }
        }
        if (err instanceof HttpError && err.response.status === 500) {
            if (this.retryInternalServerErrors) {
                return true
            }
            // A batch answer carries one error per call, in any order:
            // retry only when none of them would fail again.
            let errors = getJsonRpcErrors(err.response.body)
            return errors.length > 0 && errors.every(e => isTransientError(e.code, e.message, e.data))
        }
        return false
    }

    getRetryKind(err: Error): string {
        if (err instanceof RpcError) {
            if (this.isRpcRateLimitError(err)) return 'rate_limit'
            if (this.isRpcTransientError(err)) return 'transient'
            let kind = super.getRetryKind(err)
            if (kind != 'other') return kind
            if (this.isRpcInternalError(err)) return 'internal'
        }
        if (err instanceof HttpError && err.response.status === 500) {
            return this.retryInternalServerErrors ? 'internal' : 'transient'
        }
        // Thrown here when the endpoint had no usable answer yet: a null or an
        // error text in place of a result, or a block height it does not serve yet.
        if (err instanceof RetryError) return 'no_result'
        return super.getRetryKind(err)
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
            /rate limit|too many requests|throughput limit|exceeded .*capacity/i.test(err.message) ||
            err.code === -32005 || // Blockchain RPC convention error code for rate-limit exceeded error
            err.code === -32429 || // HTTP 429 carried as a JSON-RPC error code
            err.code === 429 // RPC error with HTTP rate-limit error code
        )
    }

    /**
     * An error that goes away on retry: a proxy or an aggregator had no healthy
     * upstream for the call, or the backend that took it lags behind the head
     * the endpoint itself reported. Such errors come under generic codes
     * (-32603, -32000, 1, ...) shared with permanent ones.
     */
    isRpcTransientError(err: RpcError): boolean {
        return isTransientError(err.code, err.message, err.data)
    }
}


const TRANSIENT_ERRORS = [
    // proxy and aggregator summaries of failed upstream attempts
    /upstreams? (not synced|transport errors?|validation mismatch|timeouts?|missing data)/i,
    /does not have the requested block yet/i,
    /no available upstreams|prevented the request from being fulfilled/i,
    /timeout policy exceeded|context canceled/i,
    /cannot parse json-rpc response/i,
    // the block is not there yet on the backend that served the call
    /could not find results for height|block result not found for height/i,
    /block not found with number|finalized block not found/i,
    /(does not|doesn't) exist yet|must be less than or equal to the current blockchain height/i,
]


// A provider saying the failure is its own and passing. The same words come as
// advice on a rejected request ("please retry with a smaller block range"), so
// they count only when neither the code nor the message blames the request.
const SAYS_TEMPORARY = /temporar(y|ily)|please retry|at this time/i
const REQUEST_ADVICE = /smaller|block range|reduce|too (large|big|many)/i
const REQUEST_ERROR_CODES = new Set([-32700, -32600, -32601, -32602])


const METHOD_NOT_FOUND = /does not exist\/is not available/i


// Proxy summary words for a method the endpoint will never serve.
const METHOD_NOT_SERVED = /unsupported method|method ignored/i


// Causes a proxy nests under `data`, one per upstream attempt.
const PERMANENT_CAUSES = new Set([
    'ErrEndpointUnsupported',
    'ErrUpstreamMethodIgnored',
    'ErrEndpointUnauthorized',
    'ErrEndpointBillingIssue',
    'ErrEndpointClientSideException',
    'ErrEndpointExecutionException',
])


const TRANSIENT_CAUSES = new Set([
    'ErrUpstreamBlockUnavailable',
    'ErrEndpointMissingData',
    'ErrEndpointTransportFailure',
    'ErrEndpointRequestTimeout',
    'ErrEndpointCapacityExceeded',
    'ErrEndpointContentValidation',
    'ErrFailsafeTimeoutExceeded',
    'ErrNetworkInitializing',
])


interface ErrorCause {
    code?: string
    message?: string
    rpcCode?: number
}


function isTransientError(code: number | undefined, message: string, data: unknown): boolean {
    let causes = getErrorCauses(data)

    if (causes.length == 0) {
        let permanent = METHOD_NOT_FOUND.test(message) || METHOD_NOT_SERVED.test(message)
        return !permanent && isTransientMessage(message, code)
    }

    // A proxy normalizes the outer code and message, and they can mislead: a 503
    // from every upstream has been reported as -32601 "method does not exist".
    // The nested causes say what actually happened.
    let permanent = METHOD_NOT_SERVED.test(message) || causes.some(isPermanentCause)
    if (permanent) return false

    return isTransientMessage(message, code) || causes.some(isTransientCause)
}


function isPermanentCause(cause: ErrorCause): boolean {
    let permanentCode = cause.code != null && PERMANENT_CAUSES.has(cause.code)
    let notServed = cause.message != null && METHOD_NOT_SERVED.test(cause.message)
    return permanentCode || notServed
}


function isTransientCause(cause: ErrorCause): boolean {
    let transientCode = cause.code != null && TRANSIENT_CAUSES.has(cause.code)
    let transientMessage = cause.message != null && isTransientMessage(cause.message, cause.rpcCode)
    return transientCode || transientMessage
}


function isTransientMessage(message: string, code: number | undefined): boolean {
    if (TRANSIENT_ERRORS.some(re => re.test(message))) return true

    let blamesRequest = (code != null && REQUEST_ERROR_CODES.has(code)) || REQUEST_ADVICE.test(message)
    return !blamesRequest && SAYS_TEMPORARY.test(message)
}


function getErrorCauses(data: unknown, depth = 0): ErrorCause[] {
    if (data == null || typeof data != 'object' || depth > 16) return []
    if (Array.isArray(data)) return data.flatMap(item => getErrorCauses(item, depth + 1))

    let {code, message, cause, details} = data as Record<string, unknown>
    let nested = getErrorCauses(cause, depth + 1)
    // the upstream's own JSON-RPC code; the proxy's normalized one can mislead
    let originalCode = (details as {originalCode?: unknown} | undefined)?.originalCode

    let hasCode = typeof code == 'string'
    let hasMessage = typeof message == 'string'
    if (!hasCode && !hasMessage) return nested

    let self: ErrorCause = {
        code: hasCode ? code as string : undefined,
        message: hasMessage ? message as string : undefined,
        rpcCode: typeof originalCode == 'number' ? originalCode : undefined,
    }
    return [self, ...nested]
}


interface JsonRpcErrorInfo {
    code?: number
    message: string
    data?: unknown
}


function getJsonRpcErrors(body: unknown): JsonRpcErrorInfo[] {
    let responses = Array.isArray(body) ? body : [body]
    let errors: JsonRpcErrorInfo[] = []
    for (let res of responses) {
        let error = (res as {error?: JsonRpcErrorInfo} | null)?.error
        if (typeof error?.message == 'string') {
            errors.push(error)
        }
    }
    return errors
}
