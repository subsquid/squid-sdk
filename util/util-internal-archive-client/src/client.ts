import {HttpClient, HttpError, HttpResponse, HttpTimeoutError} from '@subsquid/http-client'
import type {Logger} from '@subsquid/logger'
import {wait, withErrorContext} from '@subsquid/util-internal'
import assert from 'assert'


export interface ArchiveQuery {
    fromBlock: number
    toBlock?: number
}


export interface Block {
    header: {
        number: number
        hash: string
    }
}


export interface ArchiveClientOptions {
    http: HttpClient
    url: string
    queryTimeout?: number
    apiKey?: string
    log?: Logger
}


export class ArchiveCredentialsError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly docs: string
    ) {
        super(message)
    }

    get name(): string {
        return 'ArchiveCredentialsError'
    }
}


export class ArchiveClient {
    private url: URL
    private http: HttpClient
    private queryTimeout: number
    private apiKey?: string
    private retrySchedule = [5000, 10000, 20000, 30000, 60000]
    private log?: Logger

    constructor(options: ArchiveClientOptions) {
        this.url = new URL(options.url)
        this.http = options.http
        this.queryTimeout = options.queryTimeout ?? 180_000
        this.apiKey = options.apiKey || process.env.SQD_API_KEY
        this.log = options.log
    }

    private getRouterUrl(path: string): string {
        let u = new URL(this.url)
        if (this.url.pathname.endsWith('/')) {
            u.pathname += path
        } else {
            u.pathname += '/' + path
        }
        return u.toString()
    }

    getHeight(): Promise<number> {
        return this.retry(async () => {
            let res = await this.routerGet<string>('height')
            let height = Number.parseInt(res)
            assert(Number.isSafeInteger(height))
            return height
        })
    }

    query<B extends Block = Block, Q extends ArchiveQuery = ArchiveQuery>(query: Q): Promise<B[]> {
        return this.retry(async () => {
            let worker = await this.routerGet<string>(`${query.fromBlock}/worker`)
            return this.http.post(worker, {
                json: query,
                retryAttempts: 0,
                httpTimeout: this.queryTimeout
            }).catch(withErrorContext({
                archiveQuery: query
            }))
        })
    }

    private async routerGet<T>(path: string): Promise<T> {
        this.warnAboutMissingApiKey()

        try {
            let res = await this.http.request<T>('GET', this.getRouterUrl(path), {
                headers: this.getRouterHeaders(),
                retryAttempts: 0,
                httpTimeout: 10_000
            })
            this.handleRouterResponse(res)
            return res.body
        } catch(err: any) {
            if (err instanceof HttpError) {
                this.handleRouterResponse(err.response)
                throw this.getCredentialsError(err) || err
            }
            throw err
        }
    }

    private getRouterHeaders(): Record<string, string> | undefined {
        if (this.apiKey == null) return undefined
        return {
            Authorization: `Bearer ${this.apiKey}`,
            Token: this.apiKey
        }
    }

    private warnAboutMissingApiKey(): void {
        if (this.apiKey != null || missingApiKeyWarningEmitted) return
        missingApiKeyWarningEmitted = true
        process.stderr.write('v2 Archive will require API keys after 19 May 2026 — get yours at portal.sqd.dev\n')
    }

    private handleRouterResponse(res: HttpResponse): void {
        let sunset = res.headers.get('x-sqd-sunset')
        if (sunset == null) return

        let date = parseHttpDate(sunset)
        if (!Number.isFinite(date.getTime())) return

        this.log?.warn({
            sunsetDate: date.toUTCString(),
            docs: 'docs/v2-keys.md'
        }, 'Subsquid Archive endpoint sunset warning')
    }

    private getCredentialsError(err: HttpError): ArchiveCredentialsError | undefined {
        let res = err.response
        if (res.status != 403) return undefined

        let body = res.body
        if (!isCredentialsErrorBody(body)) return undefined

        return new ArchiveCredentialsError(body.message, body.error, body.docs)
    }

    private async retry<T>(request: () => Promise<T>): Promise<T> {
        let retries = 0
        while (true) {
            try {
                return await request()
            } catch(err: any) {
                if (this.http.isRetryableError(err)) {
                    let pause = this.retrySchedule[Math.min(retries, this.retrySchedule.length - 1)]
                    if (this.log?.isWarn()) {
                        let warn = retries > 3 || err instanceof HttpTimeoutError && err.ms > 10_000
                        if (warn) {
                            this.log.warn({
                                reason: err.message,
                                ...err
                            }, `archive request failed, will retry in ${Math.round(pause / 1000)} secs`)
                        }
                    }
                    retries += 1
                    await wait(pause)
                } else {
                    throw err
                }
            }
        }
    }
}


let missingApiKeyWarningEmitted = false


interface CredentialsErrorBody {
    error: string
    message: string
    docs: string
}


function isCredentialsErrorBody(body: any): body is CredentialsErrorBody {
    return typeof body == 'object'
        && body != null
        && typeof body.error == 'string'
        && typeof body.message == 'string'
        && typeof body.docs == 'string'
}


function parseHttpDate(value: string): Date {
    let match = HTTP_DATE_REGEX.exec(value)
    return new Date(match?.[0] ?? Number.NaN)
}


const HTTP_DATE_REGEX = /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT\b/
