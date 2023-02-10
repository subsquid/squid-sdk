import {wait} from '@subsquid/util-internal'
import assert from 'assert'
import fetch, {FetchError, RequestInit} from 'node-fetch'

export async function performFetch(url: string, init: RequestInit): Promise<any> {
    let response = await fetch(url, init)
    if (response.ok) return response.json()
    let body = await response.text()
    throw new HttpError(response.status, body)
}

export function isRetryableError(err: unknown): err is Error {
    if (err instanceof HttpError) {
        switch (err.status) {
            case 429:
            case 502:
            case 503:
                return true
            default:
                return false
        }
    }
    if (err instanceof FetchError) {
        switch (err.type) {
            case 'body-timeout':
            case 'request-timeout':
                return true
            case 'system':
                return err.message.startsWith('request to')
            default:
                return false
        }
    }
    return false
}

export class HttpError extends Error {
    constructor(public readonly status: number, public readonly body?: string) {
        super(`Got http ${status}`)
    }
}
