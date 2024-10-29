import { HttpClient, HttpTimeoutError } from '@subsquid/http-client'
import type { Logger } from '@subsquid/logger'
import { concurrentWriter, wait, withErrorContext } from '@subsquid/util-internal'
import { splitLines } from '@subsquid/util-internal-archive-layout'
import assert from 'assert'
import { pipeline } from 'node:stream/promises'

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
            })).then(body => {
                // TODO: move the conversion to the server
                let blocks = (body as string).trimEnd().split('\n').map(line => JSON.parse(line))
                return blocks
            })

        })
    }

    stream<B extends Block = Block, Q extends ArchiveQuery = ArchiveQuery>(query: Q): Promise<AsyncIterable<B[]>> {
        return this.retry(async () => {
            return this.http.request('POST', this.getRouterUrl(`stream`), {
                json: query,
                retryAttempts: 0,
                httpTimeout: this.queryTimeout,
                stream: true,
            }).catch(withErrorContext({
                archiveQuery: query
            })).then(res => {
                // Stream of JSON lines. For some reason it's already ungziped
                let stream = res.body as NodeJS.ReadableStream
                return concurrentWriter(1, async write => {
                    let blocks: B[] = []
                    let buffer_size = 0
                    await pipeline(
                        stream,
                        async function* (chunks) {
                            for await (let chunk of chunks) {
                                yield chunk as Buffer
                            }
                        },
                        // zlib.createGunzip(),
                        async dataChunks => {
                            for await (let lines of splitLines(dataChunks)) {
                                for (let line of lines) {
                                    buffer_size += line.length
                                    let block: B = JSON.parse(line)
                                    blocks.push(block)
                                    if (buffer_size > 10 * 1024 * 1024) {
                                        await write(blocks)
                                        blocks = []
                                        buffer_size = 0
                                    }
                                }
                            }
                        }
                    )
                    if (blocks.length) {
                        await write(blocks)
                    }
                })
            })
        })
    }

    private async retry<T>(request: () => Promise<T>): Promise<T> {
        let retries = 0
        while (true) {
            try {
                return await request()
            } catch (err: any) {
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
