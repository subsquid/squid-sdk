import assert from "assert"
import fetch, {FetchError, RequestInit} from "node-fetch"


export interface GraphqlRequestRetryConfig {
    log?: (err: Error, numberOfFailures: number, backoffMS: number) => void
    maxCount?: number
}


export interface GraphqlRequest {
    headers?: Partial<Record<string, string>>
    url: string
    query: string
    method?: 'GET' | 'POST'
    retry?: boolean | GraphqlRequestRetryConfig
    timeout?: number
}


export async function graphqlRequest<T>(req: GraphqlRequest): Promise<T> {
    let url = req.url
    let method = req.method || 'POST'
    let headers: Record<string, string> = {
        'accept': 'application/json',
        'accept-encoding': 'gzip, br',
        ...req.headers
    }
    let body: string | undefined

    if (method == 'GET') {
        url = addUrlParameter(url, 'query', req.query)
    } else {
        headers['content-type'] = 'application/json; charset=UTF-8'
        body = JSON.stringify({query: req.query})
    }

    let options = {method, headers, body, timeout: req.timeout}

    if (!req.retry) return performFetch(url, options)

    let retry = typeof req.retry == 'boolean' ? {} : req.retry
    let retryMaxCount = retry.maxCount || Infinity
    let backoff = [100, 500, 2000, 5000, 10_000, 20_000]
    let errors = 0
    while (true) {
        let result = await performFetch(url, options).catch(err => {
            assert(err instanceof Error)
            return err
        })
        if (errors < retryMaxCount && isRetryableError(result)) {
            let timeout = backoff[Math.min(errors, backoff.length - 1)]
            errors += 1
            retry.log?.(result, errors, timeout)
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

    if (!response.ok) {
        let body = await response.text()
        throw new GqlHttpError(response.status, body)
    }

    let result = await response.json()
    if (result.errors?.length) {
        throw new GqlResponseError(result.errors)
    }

    assert(result.data != null)

    return result.data
}


function isRetryableError(err: unknown): err is Error {
    if (err instanceof GqlHttpError) {
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


export class GqlHttpError extends Error {
    constructor(
        public readonly status: number,
        public readonly body?: string
    ) {
        super(`Got http ${status}`)
    }
}


export interface GraphqlError {
    message: string
    path?: (string | number)[]
}


export class GqlResponseError extends Error {
    constructor(public readonly errors: GraphqlError[]) {
        super(`GraphQL error: ${errors[0].message}`)
    }
}


function addUrlParameter(url: string, name: string, val: string): string {
    if (url.includes('?')) {
        url += '&'
    } else {
        url += '?'
    }
    return url + name + '=' +encodeURIComponent(val)
}


function wait(ms: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}
