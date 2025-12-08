import {HttpBody, HttpClient, HttpClientOptions, HttpError, HttpResponse, RequestOptions} from '@subsquid/http-client'
import {addErrorContext, last, unexpectedCase, wait, withErrorContext} from '@subsquid/util-internal'
import {cast} from '@subsquid/util-internal-validation'
import {Semaphore, Timer} from './util'
import {getQuery, type AnyQuery, type GetQueryBlock} from './query'

export * from './query'

const USER_AGENT = `@subsquid/portal-client (https://sqd.ai)`

export interface PortalClientOptions {
    /**
     * The URL of the portal dataset.
     */
    url: string

    /**
     * Optional custom HTTP client to use.
     */
    http?: HttpClient | HttpClientOptions

    /**
     * Minimum number of bytes to return.
     * @deprecated not used
     */
    minBytes?: number

    /**
     * Maximum number of bytes to return.
     * @default 52_428_800 (50MB)
     */
    maxBytes?: number

    /**
     * Maximum time between stream data in milliseconds for return.
     * @default 500
     */
    maxIdleTime?: number

    /**
     * Maximum wait time in milliseconds for return.
     * @default 5_000
     */
    maxWaitTime?: number

    /**
     * Interval for polling the head in milliseconds.
     * @default 0
     */
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

    maxBytes?: number
    maxIdleTime?: number
    maxWaitTime?: number

    headPollInterval?: number
}

export interface PortalStreamBaseResponse {
    headNumber?: number
    finalizedHeadNumber?: number
    finalizedHeadHash?: string
}

export interface PortalStreamDataResponse extends PortalStreamBaseResponse {
    type: 'data'
    data: AsyncIterable<Uint8Array> | null
}

export interface PortalStreamNoDataResponse extends PortalStreamBaseResponse {
    type: 'no-data'
}

export interface PortalStreamForkResponse extends PortalStreamBaseResponse {
    type: 'fork'
    previousBlocks: BlockRef[]
}

export type PortalStreamResponse = PortalStreamDataResponse | PortalStreamNoDataResponse | PortalStreamForkResponse

export type PortalStreamData<B> = {
    blocks: B[]
    meta: {
        finalizedHeadNumber?: number
        finalizedHeadHash?: string
        headNumber?: number
        bytes: number
    }
}

export interface PortalStream<B> extends AsyncIterable<PortalStreamData<B>> {}

export type BlockRef = {
    hash: string
    number: number
}

export class PortalClient {
    private url: URL
    private client: HttpClient
    private headPollInterval: number
    private maxBytes: number
    private maxIdleTime: number
    private maxWaitTime: number

    constructor(options: PortalClientOptions) {
        this.url = new URL(options.url)
        this.client = options.http instanceof HttpClient ? options.http : new HttpClient(options.http)
        this.headPollInterval = options.headPollInterval ?? 0
        this.maxBytes = options.maxBytes ?? 50 * 1024 * 1024
        this.maxIdleTime = options.maxIdleTime ?? 500
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

    async getHead(options?: PortalRequestOptions, finalized?: boolean): Promise<BlockRef | undefined> {
        const res = await this.request('GET', this.getDatasetUrl(!finalized ? 'head' : 'finalized-head'), options)
        return res.body ?? undefined
    }

    getFinalizedHead(options?: PortalRequestOptions): Promise<BlockRef | undefined> {
        return this.getHead(options, true)
    }

    /**
     * Waits until the finalized head reaches or exceeds the specified block number.
     * @param blockNumber - The block number to wait for finalization
     * @param options - Request options including abort signal and poll interval
     * @returns The finalized head once it reaches the target block number
     */
    async waitForFinalization(
        blockNumber: number,
        options?: PortalRequestOptions & {pollInterval?: number}
    ): Promise<BlockRef> {
        let {pollInterval = this.headPollInterval || 1000, ...requestOptions} = options ?? {}

        while (true) {
            options?.abort?.throwIfAborted()

            let head = await this.getFinalizedHead(requestOptions)
            if (head && head.number >= blockNumber) {
                return head
            }

            await wait(pollInterval, options?.abort)
        }
    }

    getStream<Q extends AnyQuery>(
        query: Q,
        options?: PortalStreamOptions,
        finalized?: boolean
    ): PortalStream<GetQueryBlock<Q>> {
        return createPortalStream(query, this.getStreamOptions(options), async (q, o) =>
            this.getStreamRequest(!finalized ? 'stream' : 'finalized-stream', q, o)
        )
    }

    getFinalizedStream<Q extends AnyQuery>(query: Q, options?: PortalStreamOptions): PortalStream<GetQueryBlock<Q>> {
        return this.getStream(query, options, true)
    }

    private getStreamOptions(options?: PortalStreamOptions) {
        let {
            headPollInterval = this.headPollInterval,
            maxBytes = this.maxBytes,
            maxIdleTime = this.maxIdleTime,
            maxWaitTime = this.maxWaitTime,
            request = {},
        } = options ?? {}

        return {
            headPollInterval,
            maxBytes,
            maxIdleTime,
            maxWaitTime,
            request,
        }
    }

    private async getStreamRequest(
        path: string,
        query: AnyQuery,
        options?: PortalRequestOptions
    ): Promise<PortalStreamResponse> {
        try {
            let res = await this.request<AsyncIterable<Uint8Array> | undefined>('POST', this.getDatasetUrl(path), {
                ...options,
                json: query,
                stream: true,
            }).catch(
                withErrorContext({
                    query: query,
                })
            )

            let headers = getPortalStreamHeaders(res.headers)

            switch (res.status) {
                case 200:
                    return {
                        ...headers,
                        type: 'data',
                        data: res.body ?? null,
                    }
                case 204:
                    return {
                        ...headers,
                        type: 'no-data',
                    }
                default:
                    throw unexpectedCase(res.status)
            }
        } catch (e: any) {
            if (isForkHttpError(e)) {
                return {
                    type: 'fork',
                    previousBlocks: e.response.body.previousBlocks,
                }
            }

            throw addErrorContext(e, {
                query,
            })
        }
    }

    private request<T = any>(method: string, url: string, options: RequestOptions & HttpBody = {}) {
        return this.client.request<T>(method, url, {
            ...options,
            headers: {
                'User-Agent': USER_AGENT,
                ...options?.headers,
            },
        })
    }
}

function isForkHttpError(err: unknown): err is HttpError<{previousBlocks: BlockRef[]}> {
    if (!(err instanceof HttpError)) return false
    if (err.response.status !== 409) return false
    if (!Array.isArray(err.response.body.previousBlocks)) return false
    return true
}

function createPortalStream<Q extends AnyQuery>(
    query: Q,
    options: Required<PortalStreamOptions>,
    requestStream: (query: Q, options?: PortalRequestOptions) => Promise<PortalStreamResponse>
): PortalStream<GetQueryBlock<Q>> {
    let {headPollInterval, request, ...bufferOptions} = options

    let buffer = new PortalStreamBuffer<GetQueryBlock<Q>>(bufferOptions)

    let [normalizedQuery, schema] = getQuery(query)
    let {fromBlock = 0, toBlock, parentBlockHash} = normalizedQuery

    const ingest = async () => {
        while (!buffer.signal.aborted) {
            if (toBlock != null && fromBlock > toBlock) break

            let res = await requestStream(
                {
                    ...normalizedQuery,
                    fromBlock,
                    parentBlockHash,
                },
                {
                    ...request,
                    abort: buffer.signal,
                }
            )

            if (res.type === 'fork') {
                throw new ForkException(fromBlock, parentBlockHash!, res.previousBlocks)
            }

            buffer.updateHead(res)

            if (res.type === 'no-data') {
                buffer.flush()
                if (headPollInterval > 0) {
                    await wait(headPollInterval, buffer.signal)
                }
                continue
            }

            if (!res.data) break

            try {
                for await (let data of splitLines(res.data)) {
                    buffer.signal.throwIfAborted()

                    let blocks: GetQueryBlock<Q>[] = []
                    let bytes = 0

                    for (let line of data) {
                        let block = cast(schema, JSON.parse(line)) as GetQueryBlock<Q>
                        blocks.push(block)
                        bytes += line.length

                        fromBlock = block.header.number + 1
                        parentBlockHash = block.header.hash
                    }

                    await buffer.put(blocks, bytes)
                }

                buffer.flush()
            } catch (err) {
                if (buffer.signal.aborted) return
                if (!isStreamAbortedError(err)) {
                    throw err
                }
            }
        }

        buffer.flush()
    }

    ingest().then(
        () => buffer.close(),
        (err) => buffer.fail(err)
    )

    return buffer
}

class PortalStreamBuffer<B> {
    private blocks: B[] = []
    private bytes = 0

    private headNumber?: number
    private finalizedHeadNumber?: number
    private finalizedHeadHash?: string
    private headUpdated = false

    private state: 'open' | 'failed' | 'closed' = 'open'
    private error: unknown

    private waitTimeouted = false
    private putMutex = new Semaphore(false)
    private takeMutex = new Semaphore(true)

    private maxBytes: number
    private idleTimer: Timer
    private waitTimer: Timer
    private abortController = new AbortController()

    get signal() {
        return this.abortController.signal
    }

    constructor(options: {maxWaitTime: number; maxBytes: number; maxIdleTime: number}) {
        this.maxBytes = options.maxBytes
        this.idleTimer = new Timer(options.maxIdleTime, () => this.flush())
        this.waitTimer = new Timer(options.maxWaitTime, () => (this.waitTimeouted = true))
    }

    async take(): Promise<PortalStreamData<B> | undefined> {
        if (this.isTerminated()) {
            return this.collect()
        }

        this.waitTimer.start()
        await this.putMutex.wait()
        this.waitTimer.stop()

        let result = this.collect()

        this.putMutex.unready()
        this.takeMutex.ready()
        this.waitTimeouted = false

        return result
    }

    updateHead(head: {headNumber?: number; finalizedHeadNumber?: number; finalizedHeadHash?: string}) {
        this.headNumber = head.headNumber
        this.finalizedHeadNumber = head.finalizedHeadNumber
        this.finalizedHeadHash = head.finalizedHeadHash
        this.headUpdated = true
    }

    async put(blocks: B[], bytes: number) {
        if (this.isTerminated()) {
            throw new Error('Buffer is closed')
        }

        this.idleTimer.stop()

        this.blocks.push(...blocks)
        this.bytes += bytes

        if (this.waitTimeouted || this.bytes >= this.maxBytes) {
            this.flush()
        }

        if (this.bytes >= this.maxBytes) {
            this.takeMutex.unready()
            await this.takeMutex.wait()
        }

        this.idleTimer.start()
    }

    flush() {
        if (!this.hasData()) return
        this.stopTimers()
        this.putMutex.ready()
    }

    close() {
        if (this.isTerminated()) return
        this.state = 'closed'
        this.stopTimers()
        this.putMutex.ready()
        this.takeMutex.reject(new Error('Buffer closed'))
        this.abortController.abort()
    }

    fail(err: any) {
        if (this.isTerminated()) return
        this.state = 'failed'
        this.error = err
        this.stopTimers()
        this.putMutex.ready()
        this.takeMutex.reject(new Error('Buffer closed'))
        this.abortController.abort()
    }

    [Symbol.asyncIterator](): AsyncIterator<PortalStreamData<B>> {
        return {
            next: async () => {
                let value = await this.take()
                if (value == null) {
                    return {done: true, value: undefined}
                }
                return {done: false, value}
            },
            return: async () => {
                this.close()
                return {done: true, value: undefined}
            },
            throw: async (error?: unknown) => {
                this.fail(error)
                throw error
            },
        }
    }

    private hasData(): boolean {
        return this.blocks.length > 0 || this.headUpdated
    }

    private isTerminated(): boolean {
        return this.state !== 'open'
    }

    private isFailed(): boolean {
        return this.state === 'failed'
    }

    private collect(): PortalStreamData<B> | undefined {
        if (!this.hasData()) {
            if (this.isFailed()) throw this.error
            return undefined
        }

        let result: PortalStreamData<B> = {
            blocks: this.blocks,
            meta: {
                bytes: this.bytes,
                headNumber: this.headNumber,
                finalizedHeadNumber: this.finalizedHeadNumber,
                finalizedHeadHash: this.finalizedHeadHash,
            },
        }

        this.blocks = []
        this.bytes = 0
        this.headUpdated = false

        return result
    }

    private stopTimers() {
        this.idleTimer.stop()
        this.waitTimer.stop()
    }
}

async function* splitLines(chunks: AsyncIterable<Uint8Array>) {
    let splitter = new LineSplitter()
    for await (let chunk of chunks) {
        let lines = splitter.push(chunk)
        if (lines) yield lines
    }
    let lastLine = splitter.end()
    if (lastLine) yield [lastLine]
}

class LineSplitter {
    private decoder = new TextDecoder('utf8')
    private line = ''

    push(data: Uint8Array): string[] | undefined {
        let s = this.decoder.decode(data)
        if (!s) return
        let lines = s.split('\n')
        if (lines.length == 1) {
            this.line += lines[0]
        } else {
            let result: string[] = []
            lines[0] = this.line + lines[0]
            this.line = last(lines)
            for (let i = 0; i < lines.length - 1; i++) {
                let line = lines[i]
                if (line) {
                    result.push(line)
                }
            }
            if (result.length > 0) return result
        }
    }

    end(): string | undefined {
        if (this.line) return this.line
    }
}

export class ForkException extends Error {
    constructor(public blockNumber: number, public parentBlockHash: string, public previousBlocks: BlockRef[]) {
        let base = last(previousBlocks)
        super(
            `expected block ${blockNumber} to have parent ${base.number}#${parentBlockHash}, ` +
                `but got ${base.number}#${base.hash} as a parent instead`
        )
    }

    get name(): string {
        return 'ForkException'
    }

    get isSubsquidForkException(): true {
        return true
    }
}

export function isForkException(err: unknown): err is ForkException {
    if (err instanceof ForkException) return true
    if (err instanceof Error && err.name === 'ForkError') return true
    return false
}

function getPortalStreamHeaders(headers: HttpResponse['headers']) {
    let finalizedHeadHash = headers.get('x-sqd-finalized-head-hash')
    let finalizedHeadNumber = headers.get('x-sqd-finalized-head-number')
    let headNumber = headers.get('x-sqd-head-number')

    return {
        headNumber: headNumber ? parseInt(headNumber) : undefined,
        finalizedHeadNumber: finalizedHeadNumber ? parseInt(finalizedHeadNumber) : undefined,
        finalizedHeadHash: finalizedHeadHash ?? undefined,
    }
}

function isStreamAbortedError(err: unknown) {
    if (!(err instanceof Error)) return false
    if (!('code' in err)) return false
    switch (err.code) {
        case 'ABORT_ERR':
        case 'ERR_STREAM_PREMATURE_CLOSE':
        case 'ECONNRESET':
            return true
        default:
            return false
    }
}
