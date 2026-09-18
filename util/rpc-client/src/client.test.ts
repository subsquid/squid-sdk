import {describe, expect, it} from 'vitest'
import {isRetryableError} from './client'
import {RetryError, RpcError} from './errors'

describe('isRetryableError', () => {
    it('retries the erpc "upstream not synced" JSON-RPC error', () => {
        // Real shape seen from erpc when its finalized head is ahead of the
        // upstream node's synced tip (code -32603, block available shortly).
        let err = new RpcError({
            code: -32603,
            message: 'gave up retrying on network-level after 1.079449613s: 1 upstream not synced'
        })
        expect(isRetryableError(err)).toBe(true)
    })

    it('retries the plural "upstreams not synced" wording', () => {
        let err = new RpcError({code: -32603, message: 'all upstream attempts failed (2 upstreams not synced)'})
        expect(isRetryableError(err)).toBe(true)
    })

    it('retries "does not have the requested block yet"', () => {
        let err = new RpcError({code: -32603, message: 'upstream does not have the requested block yet'})
        expect(isRetryableError(err)).toBe(true)
    })

    it('does not retry a genuine execution error', () => {
        let err = new RpcError({code: 3, message: 'execution reverted'})
        expect(isRetryableError(err)).toBe(false)
    })

    it('still retries RetryError and rate limits', () => {
        expect(isRetryableError(new RetryError())).toBe(true)
        expect(isRetryableError(new RpcError({code: -32005, message: 'rate limit exceeded'}))).toBe(true)
    })
})
