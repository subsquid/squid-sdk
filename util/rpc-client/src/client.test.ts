import {HttpError, HttpResponse} from '@subsquid/http-client'
import {describe, expect, it} from 'vitest'
import {RpcClient} from './client'

// A transient Cloudflare 5xx (521-524) must be treated as a retryable connection
// error, matching @subsquid/http-client's isRetryableError. Otherwise it is thrown
// as fatal and crashes the ingestion process instead of being backed off and retried.
function httpError(status: number): HttpError {
    return new HttpError(new HttpResponse(1, 'https://rpc.example/rpc', status, new Headers() as any, '', false))
}

describe('RpcClient.isConnectionError', () => {
    const client = new RpcClient({url: 'http://localhost:1/', log: null})

    it('treats Cloudflare 5xx (521-524) as retryable connection errors', () => {
        for (let status of [521, 522, 523, 524]) {
            expect(client.isConnectionError(httpError(status)), `status ${status}`).toBe(true)
        }
    })

    it('keeps existing retryable statuses', () => {
        for (let status of [408, 429, 502, 503, 504]) {
            expect(client.isConnectionError(httpError(status)), `status ${status}`).toBe(true)
        }
    })

    it('does not treat genuine client/server errors as connection errors', () => {
        for (let status of [400, 404, 500]) {
            expect(client.isConnectionError(httpError(status)), `status ${status}`).toBe(false)
        }
    })
})
