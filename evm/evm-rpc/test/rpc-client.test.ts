import { describe, it, expect } from 'vitest'
import { RpcError } from '@subsquid/rpc-client'
import { EvmRpcClient } from '../src/rpc-client'

function makeClient() {
    // HTTP connections are lazy, so no network I/O happens on construction.
    return new EvmRpcClient({ url: 'http://localhost:8082', log: null })
}

describe('EvmRpcClient.isConnectionError', () => {
    it('retries eRPC ErrFailsafeRetryExceeded / ErrUpstreamsExhausted (misnormalized to -32601)', () => {
        // Shape observed in production: eRPC normalized a transient upstream 503
        // into a fatal-looking "method not found" while all upstreams were
        // temporarily exhausted. It must be retried, not crash the dumper.
        let err = new RpcError({
            code: -32601,
            message: 'The method eth_getBlockByNumber does not exist/is not available',
            data: {
                code: 'ErrFailsafeRetryExceeded',
                cause: { code: 'ErrUpstreamsExhausted' },
            },
        })
        expect(makeClient().isConnectionError(err)).toBe(true)
    })

    it('retries a top-level ErrUpstreamsExhausted (code not otherwise retryable)', () => {
        // code -32099 is not matched by any other classifier, so retry here is
        // driven solely by the eRPC data.code — a clean regression discriminator.
        let err = new RpcError({
            code: -32099,
            message: 'all upstream attempts failed',
            data: { code: 'ErrUpstreamsExhausted' },
        })
        expect(makeClient().isConnectionError(err)).toBe(true)
    })

    it('still treats a genuine method-not-found (no eRPC data) as fatal', () => {
        let err = new RpcError({
            code: -32601,
            message: 'The method eth_getBlockByNumber does not exist/is not available',
        })
        expect(makeClient().isConnectionError(err)).toBe(false)
    })
})
