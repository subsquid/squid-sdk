import {createLogger} from '@subsquid/logger'
import {wait} from '@subsquid/util-internal'
import assert from 'assert'
import fetch, {FetchError, RequestInit} from 'node-fetch'


const LOG = createLogger('sqd:evm-typegen:fetch')


export async function GET<T=any>(url: string): Promise<T> {
    let init: RequestInit = {
        method: 'GET',
        headers: {
            'accept': 'application/json',
            'accept-encoding': 'gzip, br'
        },
        timeout: 10_000
    }
    let backoff = [1000, 2000]
    let errors = 0
    while (true) {
        let result = await performFetch(url, init).catch(err => {
            assert(err instanceof Error)
            return err
        })
        if (errors < backoff.length && isRetryableError(result)) {
            let timeout = backoff[errors]
            LOG.warn(`${result.toString()}. Trying again in ${timeout/1000} seconds`)
            errors += 1
            await wait(timeout)
        } else if (result instanceof Error) {
            throw result
        } else {
            return result
        }
    }
}


async function performFetch(url: string, init: RequestInit): Promise<any> {
    let response = await fetch(url, init)
    if (response.ok) return response.json()
    let body = await response.text()
    throw new HttpError(response.status, body)
}


function isRetryableError(err: unknown): err is Error {
    if (err instanceof HttpError) {
        switch(err.status) {
            case 429:
            case 502:
            case 503:
            case 504:
                return true
            default:
                return false
        }
    }
    if (err instanceof FetchError) {
        switch(err.type) {
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
    constructor(
        public readonly status: number,
        public readonly body?: string
    ) {
        super(`Got http ${status}`)
    }
}
