import {HttpClient, HttpTimeoutError} from '@subsquid/http-client'
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
    log?: Logger
}


export class ArchiveClient {
    private url: URL
    private http: HttpClient
    private queryTimeout: number
    private retrySchedule = [5000, 10000, 20000, 30000, 60000]
    private log?: Logger

    constructor(options: ArchiveClientOptions) {
        this.url = new URL(options.url)
        this.http = options.http
        this.queryTimeout = options.queryTimeout ?? 180_000
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
            let res: string = await this.http.get(this.getRouterUrl('height'), {
                retryAttempts: 0,
                httpTimeout: 10_000
            })
            let height = parseInt(res)
            assert(Number.isSafeInteger(height))
            return height
        })
    }

    query<B extends Block = Block, Q extends ArchiveQuery = ArchiveQuery>(query: Q): Promise<B[]> {
        return this.retry(async () => {
            let worker: string = await this.http.get(this.getRouterUrl(`${query.fromBlock}/worker`), {
                retryAttempts: 0,
                httpTimeout: 10_000
            })
            return this.http.post(worker, {
                json: query,
                retryAttempts: 0,
                httpTimeout: this.queryTimeout
            }).catch(withErrorContext({
                archiveQuery: query
            }))
        })
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
