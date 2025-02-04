import {HttpClient} from '@subsquid/http-client'
import {
    createFuture,
    Future,
    Simplify,
    Throttler,
    unexpectedCase,
    wait,
    withErrorContext,
} from '@subsquid/util-internal'

export interface PortalClientOptions {
    url: string
    http?: HttpClient

    minBytes?: number
    maxBytes?: number
    maxIdleTime?: number
    maxWaitTime?: number

    headPollInterval?: number
}

export interface PortalRequestOptions {
    headers?: HeadersInit
    retryAttempts?: number
    retrySchedule?: number[]
    httpTimeout?: number
    bodyTimeout?: number
    abort?: AbortSignal
}

export interface PortalStreamOptions {
    request?: Omit<PortalRequestOptions, 'abort'>

    minBytes?: number
    maxBytes?: number
    maxIdleTime?: number
    maxWaitTime?: number

    headPollInterval?: number

    stopOnHead?: boolean
}

export type PortalStreamData<B> = {
    finalizedHead?: HashAndNumber
    blocks: B[]
}

export type PortalQuery = {
    type: string & {}
    fromBlock?: number
    toBlock?: number
}

export type HashAndNumber = {
    hash: string
    number: number
}

export type PortalResponse = {
    header: HashAndNumber
}

export class PortalClient {
    private url: URL
    private client: HttpClient
    private headPollInterval: number
    private minBytes: number
    private maxBytes: number
    private maxIdleTime: number
    private maxWaitTime: number

    constructor(options: PortalClientOptions) {
        this.url = new URL(options.url)
        this.client = options.http || new HttpClient()
        this.headPollInterval = options.headPollInterval ?? 5_000
        this.minBytes = options.minBytes ?? 40 * 1024 * 1024
        this.maxBytes = options.maxBytes ?? this.minBytes
        this.maxIdleTime = options.maxIdleTime ?? 300
        this.maxWaitTime = options.maxWaitTime ?? 5_000
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

    async getFinalizedHeight(options?: PortalRequestOptions): Promise<number> {
        let res: string = await this.client.get(this.getDatasetUrl('finalized-stream/height'), options)
        let height = parseInt(res)
        return height
    }

    getFinalizedQuery<Q extends PortalQuery = PortalQuery, R extends PortalResponse = PortalResponse>(
        query: Q,
        options?: PortalRequestOptions
    ): Promise<R[]> {
        // FIXME: is it needed or it is better to always use stream?
        return this.client
            .request<Buffer>('POST', this.getDatasetUrl(`finalized-stream`), {
                ...options,
                json: query,
            })
            .catch(
                withErrorContext({
                    archiveQuery: query,
                })
            )
            .then((res) => {
                let blocks = new TextDecoder('utf-8')
                    .decode(res.body)
                    .trimEnd()
                    .split('\n')
                    .map((line) => JSON.parse(line))
                return blocks
            })
    }

    getFinalizedStream<Q extends PortalQuery = PortalQuery, R extends PortalResponse = PortalResponse>(
        query: Q,
        options?: PortalStreamOptions
    ): ReadableStream<PortalStreamData<R>> {
        let {
            headPollInterval = this.headPollInterval,
            minBytes = this.minBytes,
            maxBytes = this.maxBytes,
            maxIdleTime = this.maxIdleTime,
            maxWaitTime = this.maxWaitTime,
            request = {},
            stopOnHead = false,
        } = options ?? {}

        let top = new Throttler(() => this.getFinalizedHeight(request), 20_000)
        return createReadablePortalStream(
            query,
            {
                headPollInterval,
                minBytes,
                maxBytes,
                maxIdleTime,
                maxWaitTime,
                request,
                stopOnHead,
            },
            async (q, o) => {
                // NOTE: we emulate the same behavior as will be implemented for hot blocks stream,
                // but unfortunately we don't have any information about finalized block hash at the moment
                let finalizedHead = {
                    number: await top.get(),
                    hash: '',
                }

                let res = await this.client
                    .request<ReadableStream<Buffer>>('POST', this.getDatasetUrl('finalized-stream'), {
                        ...o,
                        json: q,
                        stream: true,
                    })
                    .catch(
                        withErrorContext({
                            query: q,
                        })
                    )

                switch (res.status) {
                    case 200:
                        return {
                            finalizedHead,
                            stream: res.body
                                .pipeThrough(new TextDecoderStream('utf8'))
                                .pipeThrough(new LineSplitStream('\n')),
                        }
                    case 204:
                        return undefined
                    default:
                        throw unexpectedCase(res.status)
                }
            }
        )
    }
}

function createReadablePortalStream<Q extends PortalQuery = PortalQuery, B extends PortalResponse = PortalResponse>(
    query: Q,
    options: Required<PortalStreamOptions>,
    requestStream: (
        query: Q,
        options?: PortalRequestOptions
    ) => Promise<{finalizedHead: HashAndNumber; stream: ReadableStream<string[]>} | undefined>
): ReadableStream<PortalStreamData<B>> {
    let {headPollInterval, stopOnHead, request, ...bufferOptions} = options

    let abortStream = new AbortController()

    let finalizedHead: HashAndNumber | undefined
    let buffer = new PortalStreamBuffer<B>(bufferOptions)

    async function ingest() {
        let abortSignal = abortStream.signal
        let {fromBlock = 0, toBlock = Infinity} = query

        try {
            while (true) {
                if (abortSignal.aborted) break
                if (fromBlock > toBlock) break

                let reader: ReadableStreamDefaultReader<string[]> | undefined

                try {
                    let res = await requestStream(
                        {
                            ...query,
                            fromBlock,
                        },
                        {
                            ...request,
                            abort: abortSignal,
                        }
                    )

                    if (res == null) {
                        if (stopOnHead) break
                        await wait(headPollInterval, abortSignal)
                    } else {
                        finalizedHead = res.finalizedHead
                        reader = res.stream.getReader()

                        while (true) {
                            let data = await withAbort(reader.read(), abortSignal)
                            if (data.done) break
                            if (data.value.length == 0) continue

                            let blocks: B[] = []
                            let bytes = 0

                            for (let line of data.value) {
                                let block = JSON.parse(line) as B

                                blocks.push(block)
                                bytes += line.length

                                fromBlock = block.header.number + 1
                            }

                            await withAbort(buffer.put(blocks, bytes), abortSignal)
                        }
                    }

                    buffer.ready()
                } finally {
                    reader?.cancel().catch(() => {})
                }
            }
        } catch (err) {
            if (abortSignal.aborted) {
                // ignore
            } else {
                throw err
            }
        }
    }

    return new ReadableStream({
        start() {
            ingest().then(
                () => buffer.close(),
                (err) => buffer.fail(err)
            )
        },
        async pull(controller) {
            try {
                let result = await buffer.take()
                if (result.done) {
                    controller.close()
                } else {
                    controller.enqueue({
                        finalizedHead,
                        blocks: result.value || [],
                    })
                }
            } catch (err) {
                controller.error(err)
            }
        },
        cancel(reason) {
            abortStream.abort(reason)
        },
    })
}

class PortalStreamBuffer<B> {
    private buffer: {blocks: B[]; bytes: number} | undefined
    private state: 'open' | 'failed' | 'closed' = 'open'
    private error: unknown

    private readyFuture: Future<void> = createFuture()
    private takeFuture: Future<void> = createFuture()
    private putFuture: Future<void> = createFuture()

    private lastChunkTimestamp = Date.now()
    private idleInterval: ReturnType<typeof setInterval> | undefined

    private minBytes: number
    private maxBytes: number
    private maxIdleTime: number
    private maxWaitTime: number

    constructor(options: {maxWaitTime: number; maxBytes: number; maxIdleTime: number; minBytes: number}) {
        this.maxWaitTime = options.maxWaitTime
        this.minBytes = options.minBytes
        this.maxBytes = Math.max(options.maxBytes, options.minBytes)
        this.maxIdleTime = options.maxIdleTime
    }

    async take() {
        let waitTimeout = setTimeout(() => {
            this.readyFuture.resolve()
        }, this.maxWaitTime)
        this.readyFuture.promise().finally(() => clearTimeout(waitTimeout))

        await Promise.all([this.readyFuture.promise(), this.putFuture.promise()])

        if (this.state === 'failed') {
            throw this.error
        }

        let value = this.buffer?.blocks
        this.buffer = undefined

        this.takeFuture.resolve()

        if (this.state === 'closed') {
            return {value, done: value == null}
        } else {
            if (value == null) {
                throw new Error('buffer is empty')
            }

            this.takeFuture = createFuture()
            this.putFuture = createFuture()
            this.readyFuture = createFuture()

            return {value, done: false}
        }
    }

    async put(blocks: B[], bytes: number) {
        this.lastChunkTimestamp = Date.now()
        if (this.idleInterval == null) {
            this.idleInterval = setInterval(() => {
                if (Date.now() - this.lastChunkTimestamp >= this.maxIdleTime) {
                    this.readyFuture.resolve()
                }
            }, Math.ceil(this.maxIdleTime / 3))
            this.readyFuture.promise().finally(() => clearInterval(this.idleInterval))
            this.takeFuture.promise().finally(() => (this.idleInterval = undefined))
        }

        if (this.buffer == null) {
            this.buffer = {
                blocks: [],
                bytes: 0,
            }
        }

        this.buffer.bytes += bytes
        this.buffer.blocks.push(...blocks)

        if (this.buffer.bytes >= this.minBytes) {
            this.readyFuture.resolve()
        }

        this.putFuture.resolve()

        if (this.buffer.bytes >= this.maxBytes) {
            await this.takeFuture.promise()
        }
    }

    ready() {
        if (this.buffer == null) return
        this.readyFuture.resolve()
    }

    close() {
        if (this.state !== 'open') return
        this.state = 'closed'
        this.readyFuture.resolve()
        this.putFuture.resolve()
        this.takeFuture.resolve()
    }

    fail(err: unknown) {
        if (this.state !== 'open') return
        this.state = 'failed'
        this.error = err
        this.readyFuture.resolve()
        this.putFuture.resolve()
        this.takeFuture.resolve()
    }
}

function withAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        if (signal.aborted) {
            reject(signal.reason || new Error('Aborted'))
        }

        const abort = () => {
            reject(signal.reason || new Error('Aborted'))
        }

        signal.addEventListener('abort', abort)

        promise.then(resolve, reject).finally(() => {
            signal.removeEventListener('abort', abort)
        })
    })
}

class LineSplitStream implements ReadableWritablePair<string[], string> {
    private line = ''
    private transform: TransformStream<string, string[]>

    get readable() {
        return this.transform.readable
    }
    get writable() {
        return this.transform.writable
    }

    constructor(separator: string) {
        this.transform = new TransformStream({
            transform: (chunk, controller) => {
                let lines = chunk.split(separator)
                if (lines.length === 1) {
                    this.line += lines[0]
                } else {
                    let result: string[] = []
                    lines[0] = this.line + lines[0]
                    this.line = lines.pop() || ''
                    result.push(...lines)
                    controller.enqueue(result)
                }
            },
            flush: (controller) => {
                if (this.line) {
                    controller.enqueue([this.line])
                    this.line = ''
                }
                // NOTE: not needed according to the spec, but done the same way in nodejs sources
                controller.terminate()
            },
        })
    }
}
