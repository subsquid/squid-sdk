import {HttpClient} from '@subsquid/http-client'
import type {Logger} from '@subsquid/logger'
import {AsyncQueue, last, wait, withErrorContext} from '@subsquid/util-internal'
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
    newBlockThreshold?: number
    durationThreshold?: number
    newBlockTimeout?: number
    headPollInterval?: number
}

export class PortalClient {
    private url: URL
    private http: HttpClient
    private requestTimeout: number
    private headPollInterval: number
    private bufferThreshold: number
    private newBlockThreshold: number
    private durationThreshold: number
    private newBlockTimeout: number
    private retryAttempts: number
    private log?: Logger

    constructor(options: PortalClientOptions) {
        this.url = new URL(options.url)
        this.log = options.log
        this.http = options.http
        this.requestTimeout = options.requestTimeout ?? 180_000
        this.headPollInterval = options.headPollInterval ?? 5_000
        this.bufferThreshold = options.bufferThreshold ?? 10 * 1024 * 1024
        this.newBlockThreshold = options.newBlockThreshold ?? 500
        this.durationThreshold = options.durationThreshold ?? 5_000
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

    finalizedStream<B extends Block = Block, Q extends PortalQuery = PortalQuery>(
        query: Q,
        stopOnHead = false
    ): ReadableStream<B[]> {
        let headPollInterval = this.headPollInterval
        let newBlockThreshold = this.newBlockThreshold
        let durationThreshold = this.durationThreshold
        let bufferThreshold = this.bufferThreshold
        let newBlockTimeout = this.newBlockTimeout

        let buffer = new BlocksBuffer<B>(bufferThreshold)
        let abortStream = new AbortController()

        const ingest = async () => {
            let startBlock = query.fromBlock
            let endBlock = query.toBlock ?? Infinity

            let heartbeat: HeartBeat | undefined
            let timeout: ReturnType<typeof setTimeout> | undefined
            let reader: ReadableStreamDefaultReader<string[]> | undefined

            function abort() {
                return reader?.cancel()
            }

            while (startBlock <= endBlock && !abortStream.signal.aborted) {
                try {
                    let archiveQuery = {...query, fromBlock: startBlock}
                    let res = await this.http
                        .request<Readable>('POST', this.getDatasetUrl('finalized-stream'), {
                            json: archiveQuery,
                            httpTimeout: this.requestTimeout,
                            retryAttempts: this.retryAttempts,
                            stream: true,
                            abort: abortStream.signal,
                        })
                        .catch(
                            withErrorContext({
                                query: archiveQuery,
                            })
                        )

                    if (res.status == 204) {
                        if (stopOnHead) break
                        await wait(headPollInterval, abortStream.signal)
                        continue
                    }

                    abortStream.signal.addEventListener('abort', abort, {once: true})

                    let heartbeatInterval = Math.ceil(newBlockThreshold / 4)
                    heartbeat = new HeartBeat((diff) => {
                        if (diff > newBlockThreshold) {
                            buffer.ready()
                        }
                    }, heartbeatInterval)

                    timeout = setTimeout(() => buffer.ready(), durationThreshold)

                    let stream = addStreamTimeout(Readable.toWeb(res.body) as ReadableStream<Buffer>, newBlockTimeout)
                    let reader = splitLines(stream)
                    while (true) {
                        let lines = await reader.next()
                        if (lines.done) break

                        heartbeat.pulse()

                        let size = 0
                        let blocks = lines.value.map((line) => {
                            let block = JSON.parse(line) as B
                            size += line.length
                            return block
                        })

                        await buffer.put(blocks, size)

                        let lastBlock = last(blocks).header.number
                        startBlock = lastBlock + 1
                    }
                } catch (err) {
                    if (abortStream.signal.aborted) {
                        // FIXME: should we do anything here?
                    } else if (err instanceof TimeoutError) {
                        this.log?.warn(`resetting stream due to inactivity for ${this.newBlockTimeout} ms`)
                    } else {
                        throw err
                    }
                } finally {
                    await reader?.cancel().catch(() => {})
                    heartbeat?.stop()
                    buffer.ready()
                    clearTimeout(timeout)
                    abortStream.signal.removeEventListener('abort', abort)
                }
            }
        }

        return new ReadableStream({
            start: async (controller) => {
                ingest()
                    .then(() => {
                        buffer.close()
                    })
                    .catch((error) => {
                        if (buffer.isClosed()) return
                        controller.error(error)
                        buffer.close()
                    })
            },
            pull: async (controller) => {
                let value = await buffer.take()
                if (value) {
                    controller.enqueue(value)
                } else {
                    controller.close()
                }
            },
            cancel: () => {
                abortStream.abort()
            },
        })
    }
}

class BlocksBuffer<B extends Block> {
    private blocks: B[] = []
    private queue = new AsyncQueue<B[]>(1)
    private size = 0

    constructor(private bufferSizeThreshold: number) {}

    async put(blocks: B[], size: number) {
        this.blocks.push(...blocks)
        this.size += size

        if (this.size > this.bufferSizeThreshold) {
            this.ready()
            await this.queue.wait()
        }
    }

    async take() {
        let value = await this.queue.take()
        this.blocks = []
        this.size = 0
        return value
    }

    ready() {
        if (this.blocks.length == 0) return
        this.queue.forcePut(this.blocks)
    }

    close() {
        return this.queue.close()
    }

    isClosed() {
        return this.queue.isClosed()
    }
}

class HeartBeat {
    private interval: ReturnType<typeof setInterval> | undefined
    private timestamp: number

    constructor(fn: (diff: number) => void, ms?: number) {
        this.timestamp = Date.now()
        this.interval = setInterval(() => fn(Date.now() - this.timestamp), ms)
    }

    pulse() {
        this.timestamp = Date.now()
    }

    stop() {
        clearInterval(this.interval)
    }
}

function addStreamTimeout<T>(
    stream: ReadableStream<T>,
    ms: number,
    onTimeout?: () => Error | undefined | void
): ReadableStream<T> {
    const reader = stream.getReader()

    return new ReadableStream({
        pull: async (c) => {
            try {
                let data = await addTimeout(reader.read(), ms, onTimeout)
                if (data.done) {
                    c.close()
                } else {
                    c.enqueue(data.value)
                }
            } catch (e) {
                c.error(e)
                await reader.cancel()
            }
        },
        cancel: async (reason) => {
            await reader.cancel(reason)
        },
    })
}
