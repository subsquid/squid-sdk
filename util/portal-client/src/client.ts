import {HttpClient} from '@subsquid/http-client'
import type {Logger} from '@subsquid/logger'
import {AsyncQueue, ensureError, last, wait, withErrorContext} from '@subsquid/util-internal'
import {splitLines} from '@subsquid/util-internal-archive-layout'
import assert from 'assert'


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


export interface PortalClientOptions {
    url: string
    http?: HttpClient
    log?: Logger
    queryTimeout?: number
    bufferThreshold?: number
}


export class PortalClient {
    private url: URL
    private http: HttpClient
    private queryTimeout: number
    private bufferThreshold: number

    constructor(options: PortalClientOptions) {
        this.url = new URL(options.url)
        this.http = options.http || new HttpClient({log: options.log})
        this.queryTimeout = options.queryTimeout ?? 180_000
        this.bufferThreshold = options.bufferThreshold ?? 10 * 1024 * 1024
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

    async getHeight(): Promise<number> {
        let res: string = await this.http.get(this.getRouterUrl('height'), {
            retryAttempts: 3,
            httpTimeout: 10_000,
        })
        let height = parseInt(res)
        assert(Number.isSafeInteger(height))
        return height
    }

    query<B extends Block = Block, Q extends PortalQuery = PortalQuery>(query: Q): Promise<B[]> {
        return this.http
            .request<Buffer>('POST', this.getRouterUrl(`stream`), {
                json: query,
                retryAttempts: 3,
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
    }

    async *stream<B extends Block = Block, Q extends PortalQuery = PortalQuery>(query: Q): AsyncIterable<B[]> {
        let queue = new AsyncQueue<B[] | Error>(1)

        const ingest = async () => {
            let bufferSize = 0
            let fromBlock = query.fromBlock
            let toBlock = query.toBlock ?? Infinity

            while (fromBlock <= toBlock) {
                let res = await this.http
                    .request<NodeJS.ReadableStream>('POST', this.getRouterUrl(`stream`), {
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

                for await (let lines of splitLines(res.body as AsyncIterable<Buffer>)) {
                    let batch = queue.peek()
                    if (batch instanceof Error) return

                    if (!batch) {
                        bufferSize = 0
                    }

                    let blocks = lines.map((line) => {
                        bufferSize += line.length
                        return JSON.parse(line) as B
                    })

                    if (batch) {
                        // FIXME: won't it overflow stack?
                        batch.push(...blocks)
                        if (bufferSize > this.bufferThreshold) {
                            await queue.wait()
                        }
                    } else {
                        await queue.put(blocks)
                    }

                    fromBlock = last(blocks).header.number + 1
                }

                // no blocks left
                if (res.status == 204) {
                    await wait(1000)
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
}

export function portal(url: string | PortalClientOptions) {
    let options = typeof url == 'string' ? {url} : url
    return new PortalClient(options)
}