import {HttpClient} from '@subsquid/http-client'
import type {Logger} from '@subsquid/logger'
import {AsyncQueue, ensureError, last, wait, withErrorContext} from '@subsquid/util-internal'
import {splitLines} from '@subsquid/util-internal-archive-layout'
import {addTimeout, TimeoutError} from '@subsquid/util-timeout'
import assert from 'assert'
import {Readable} from 'stream'

export interface PortalQuery {
    fromBlock: number
    toBlock?: number
}

export interface Block {
    header: {
        number: number
        hash: string
    }
}

export interface Metadata {
    isRealTime: boolean
}

export interface PortalClientOptions {
    url: string
    http: HttpClient
    log?: Logger
    requestTimeout?: number
    retryAttempts?: number
    bufferThreshold?: number
    newBlockTimeout?: number
}

export class PortalClient {
    private url: URL
    private http: HttpClient
    private requestTimeout: number
    private bufferThreshold: number
    private newBlockTimeout: number
    private retryAttempts: number
    private log?: Logger

    constructor(options: PortalClientOptions) {
        this.url = new URL(options.url)
        this.log = options.log
        this.http = options.http
        this.requestTimeout = options.requestTimeout ?? 180_000
        this.bufferThreshold = options.bufferThreshold ?? 10 * 1024 * 1024
        this.newBlockTimeout = options.newBlockTimeout ?? 120_000
        this.retryAttempts = options.retryAttempts ?? Infinity
    }

    private getDatasetUrl(path: string): string {
        let u = new URL(this.url)
        if (this.url.pathname.endsWith('/')) {
            u.pathname += path
        } else {
            u.pathname += '/' + path
        }
        return u.toString()
    }

    async getMetadata(): Promise<Metadata> {
        let res: {real_time: boolean} = await this.http.get(this.getDatasetUrl('metadata'), {
            retryAttempts: this.retryAttempts,
            httpTimeout: this.requestTimeout,
        })
        return {
            isRealTime: !!res.real_time,
        }
    }

    async getFinalizedHeight(): Promise<number> {
        let res: string = await this.http.get(this.getDatasetUrl('finalized-stream/height'), {
            retryAttempts: this.retryAttempts,
            httpTimeout: this.requestTimeout,
        })
        let height = parseInt(res)
        assert(Number.isSafeInteger(height))
        return height
    }

    finalizedQuery<B extends Block = Block, Q extends PortalQuery = PortalQuery>(query: Q): Promise<B[]> {
        // FIXME: is it needed or it is better to always use stream?
        return this.http
            .request<Buffer>('POST', this.getDatasetUrl(`finalized-stream`), {
                json: query,
                retryAttempts: this.retryAttempts,
                httpTimeout: this.requestTimeout,
            })
            .catch(
                withErrorContext({
                    archiveQuery: query,
                })
            )
            .then((res) => {
                let blocks = res.body
                    .toString('utf8')
                    .trimEnd()
                    .split('\n')
                    .map((line) => JSON.parse(line))
                return blocks
            })
    }

    async *finalizedStream<B extends Block = Block, Q extends PortalQuery = PortalQuery>(
        query: Q,
        stopOnHead = false
    ): AsyncIterable<B[]> {
        let queue = new AsyncQueue<B[] | Error>(1)
        let bufferSize = 0
        let isReady = false
        let cache: B[] = []

        const getBuffer = () => {
            if (queue.isClosed()) return
            let peeked = queue.peek()
            // FIXME: is it a valid case?
            if (peeked instanceof Error) return

            // buffer has been consumed, we need to reset
            if (isReady && !peeked) {
                reset()
            }

            return peeked ?? cache
        }

        const reset = () => {
            bufferSize = 0
            isReady = false
            cache.length = 0
        }

        const setReady = () => {
            if (queue.isClosed()) return
            if (isReady) return
            queue.forcePut(cache)
            isReady = true
            cache = []
        }

        const waitForReset = async () => {
            if (queue.isClosed()) return
            await queue.wait()
            reset()
        }

        const ingest = async () => {
            let fromBlock = query.fromBlock
            let toBlock = query.toBlock ?? Infinity

            while (fromBlock <= toBlock) {
                let archiveQuery = {...query, fromBlock}

                let res = await this.http
                    .request<Readable>('POST', this.getDatasetUrl(`finalized-stream`), {
                        json: archiveQuery,
                        retryAttempts: this.retryAttempts,
                        httpTimeout: this.requestTimeout,
                        stream: true,
                    })
                    .catch(
                        withErrorContext({
                            archiveQuery,
                        })
                    )

                // no blocks left
                if (res.status == 204) {
                    if (stopOnHead) return

                    await wait(1000)
                    continue
                }

                try {
                    let stream = splitLines(res.body)

                    while (true) {
                        let lines = await addTimeout(stream.next(), this.newBlockTimeout)
                        if (lines.done) break

                        let buffer = getBuffer()
                        if (buffer == null) break

                        let blocks = lines.value.map((line) => {
                            bufferSize += line.length
                            return JSON.parse(line) as B
                        })

                        // FIXME: won't it overflow stack?
                        buffer.push(...blocks)

                        fromBlock = last(blocks).header.number + 1

                        if (bufferSize > this.bufferThreshold) {
                            setReady()
                            await waitForReset()
                        }
                    }

                    if (bufferSize > 0) {
                        setReady()
                    }
                } catch (err) {
                    if (err instanceof TimeoutError) {
                        this.log?.warn(
                            `resetting stream, because we haven't seen a new blocks for ${this.newBlockTimeout} ms`
                        )
                    } else {
                        throw err
                    }
                } finally {
                    // FIXME: is it needed?
                    res.body.destroy()
                }
            }
        }

        ingest().then(
            () => queue.close(),
            (err) => {
                if (queue.isClosed()) return
                queue.forcePut(ensureError(err))
                queue.close()
            }
        )

        for await (let valueOrError of queue.iterate()) {
            if (valueOrError instanceof Error) throw valueOrError
            yield valueOrError
        }
    }
}
