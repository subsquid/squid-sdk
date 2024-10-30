import {HttpClient, HttpTimeoutError} from '@subsquid/http-client'
import type {Logger} from '@subsquid/logger'
import {AsyncQueue, concurrentWriter, ensureError, wait, withErrorContext} from '@subsquid/util-internal'
import {splitLines} from '@subsquid/util-internal-archive-layout'
import assert from 'assert'
import {pipeline} from 'node:stream/promises'

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
                httpTimeout: 10_000,
            })
            let height = parseInt(res)
            assert(Number.isSafeInteger(height))
            return height
        })
    }

    query<B extends Block = Block, Q extends ArchiveQuery = ArchiveQuery>(query: Q): Promise<B[]> {
        return this.retry(async () => {
            return this.http
                .request<Buffer>('POST', this.getRouterUrl(`stream`), {
                    json: query,
                    retryAttempts: 0,
                    httpTimeout: this.queryTimeout,
                })
                .catch(
                    withErrorContext({
                        archiveQuery: query,
                    })
                )
                .then((res) => {
                    // TODO: move the conversion to the server
                    let blocks = res.body
                        .toString('utf8')
                        .trimEnd()
                        .split('\n')
                        .map((line) => JSON.parse(line))
                    return blocks
                })
        })
    }

    async *stream<B extends Block = Block, Q extends ArchiveQuery = ArchiveQuery>(query: Q): AsyncIterable<B[]> {
        let queue = new AsyncQueue<B[] | Error>(1)

        const ingest = async () => {
            let bufferSize = 0
            let fromBlock = query.fromBlock
            let toBlock = query.toBlock ?? Infinity

            while (fromBlock <= toBlock) {
                let stream = await this.http
                    .post<NodeJS.ReadableStream>(this.getRouterUrl(`stream`), {
                        json: {...query, fromBlock},
                        retryAttempts: 3,
                        httpTimeout: this.queryTimeout,
                        stream: true,
                    })
                    .catch(
                        withErrorContext({
                            archiveQuery: query,
                        })
                    )

                for await (let lines of splitLines(stream as AsyncIterable<Buffer>)) {
                    let batch = queue.peek()
                    if (batch instanceof Error) break

                    if (!batch) {
                        bufferSize = 0
                    }

                    if (lines.length === 0) continue

                    let blocks = lines.map((line) => {
                        bufferSize += line.length
                        return JSON.parse(line) as B
                    })

                    if (batch) {
                        // FIXME: won't it overflow stack?
                        batch.push(...blocks)
                        if (bufferSize > 10 * 1024 * 1024) {
                            await queue.wait()
                        }
                    } else {
                        await queue.put(blocks)
                    }

                    fromBlock = blocks[blocks.length - 1].header.number + 1
                }
            }
        }

        ingest().then(
            () => queue.close(),
            (err) => {
                if (!queue.isClosed()) {
                    queue.forcePut(ensureError(err))
                }
            }
        )

        for await (let valueOrError of queue.iterate()) {
            if (valueOrError instanceof Error) throw valueOrError
            yield valueOrError
        }
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
                        let warn = retries > 3 || (err instanceof HttpTimeoutError && err.ms > 10_000)
                        if (warn) {
                            this.log.warn(
                                {
                                    reason: err.message,
                                    ...err,
                                },
                                `archive request failed, will retry in ${Math.round(pause / 1000)} secs`
                            )
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
