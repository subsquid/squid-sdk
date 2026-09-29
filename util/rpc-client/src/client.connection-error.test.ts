import {HttpError, HttpResponse} from '@subsquid/http-client'
import {describe, expect, it} from 'vitest'
import {RpcClient} from './client'

function httpError(status: number): HttpError {
    return new HttpError(new HttpResponse(1, 'http://localhost', status, new Headers() as any, '', false))
}

describe('RpcClient.isConnectionError', () => {
    let client = new RpcClient({url: 'http://localhost:1', log: null})

    it.each([408, 429, 502, 503, 504, 520, 521, 522, 523, 524])('retries HTTP %i', (status) => {
        expect(client.isConnectionError(httpError(status))).toBe(true)
    })

    it.each([400, 401, 403, 404, 500])('does not retry HTTP %i', (status) => {
        expect(client.isConnectionError(httpError(status))).toBe(false)
    })
})
