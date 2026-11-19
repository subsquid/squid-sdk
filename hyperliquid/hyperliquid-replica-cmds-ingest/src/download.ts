import {GetObjectCommand, HeadObjectCommand, RequestPayer, S3Client} from '@aws-sdk/client-s3'
import type {Logger} from '@subsquid/logger'
import {Readable} from 'stream'


export interface ParallelDownloadOptions {
    client: S3Client
    requestPayer?: RequestPayer
    /**
     * Number of byte ranges fetched at once
     */
    concurrency: number
    /**
     * Size of one byte range
     */
    partSize: number
    /**
     * A part that delivers nothing for this long is aborted and retried
     */
    partTimeoutMs: number
    /**
     * Attempts per part before the whole download fails
     */
    partAttempts: number
    log?: Logger
}


/**
 * Reads an S3 object as several concurrent ranged GETs and returns its bytes in order.
 *
 * A single GET over a long-RTT path is capped by one TCP window; N ranges in flight
 * give up to N times that. At most `concurrency` parts are held in memory.
 */
export class ParallelDownloader {
    constructor(private options: ParallelDownloadOptions) {}

    async readStream(bucket: string, key: string): Promise<Readable> {
        let head = await this.options.client.send(new HeadObjectCommand({
            Bucket: bucket,
            Key: key,
            RequestPayer: this.options.requestPayer
        }))
        let size = head.ContentLength
        if (size == null) throw new Error(`no ContentLength for s3://${bucket}/${key}`)
        // stops outstanding requests, bodies and retry waits once the reader is gone or a part failed
        let cancel = new AbortController()
        let parts = this.parts(bucket, key, size, head.ETag, cancel)[Symbol.asyncIterator]()
        let reading = false
        // Not Readable.from(): its destroy() waits for the part being awaited to settle, which for a
        // stalled part is minutes away. Here destroy() aborts the outstanding requests at once.
        return new Readable({
            async read() {
                if (reading) return
                reading = true
                try {
                    let {value, done} = await parts.next()
                    this.push(done ? null : value)
                } catch (err: any) {
                    this.destroy(err)
                } finally {
                    reading = false
                }
            },
            destroy(err, callback) {
                cancel.abort(err ?? new Error('download closed'))
                parts.return?.().catch(() => {})
                callback(err)
            }
        })
    }

    private async *parts(
        bucket: string,
        key: string,
        size: number,
        etag: string | undefined,
        cancel: AbortController
    ): AsyncIterable<Buffer> {
        let {concurrency, partSize} = this.options
        let count = Math.ceil(size / partSize)
        let inflight: Promise<Buffer>[] = []
        let next = 0

        let schedule = () => {
            while (next < count && inflight.length < concurrency) {
                let start = next * partSize
                let end = Math.min(size, start + partSize) - 1
                let p = this.fetchPart(bucket, key, start, end, etag, cancel.signal)
                // avoid an unhandled rejection while the part waits in the queue
                p.catch(() => {})
                inflight.push(p)
                next += 1
            }
        }

        try {
            schedule()
            while (inflight.length > 0) {
                let part = await inflight.shift()!
                schedule()
                yield part
            }
        } finally {
            // a failed part: stop the others without waiting for the stream to close
            cancel.abort(new Error('download closed'))
        }
    }

    private async fetchPart(
        bucket: string,
        key: string,
        start: number,
        end: number,
        etag: string | undefined,
        signal: AbortSignal
    ): Promise<Buffer> {
        let {partAttempts} = this.options
        for (let attempt = 1; ; attempt++) {
            try {
                return await this.fetchPartOnce(bucket, key, start, end, etag, signal)
            } catch (err: any) {
                if (signal.aborted || attempt >= partAttempts) throw err
                this.options.log?.warn(
                    `range ${start}-${end} of s3://${bucket}/${key} failed (attempt ${attempt}): ${err?.message ?? err}`
                )
                await sleep(1000 * attempt, signal)
            }
        }
    }

    private async fetchPartOnce(
        bucket: string,
        key: string,
        start: number,
        end: number,
        etag: string | undefined,
        signal: AbortSignal
    ): Promise<Buffer> {
        signal.throwIfAborted()
        let abort = new AbortController()
        let body: Readable | undefined
        let timer: NodeJS.Timeout | undefined
        let stop = (err: unknown) => {
            abort.abort(err)
            // the signal covers the request; a body already streaming is torn down here
            body?.destroy(err instanceof Error ? err : new Error(String(err)))
        }
        let arm = () => {
            clearTimeout(timer)
            timer = setTimeout(() => stop(new Error(`no data for ${this.options.partTimeoutMs} ms`)), this.options.partTimeoutMs)
        }
        let onCancel = () => stop(signal.reason)
        signal.addEventListener('abort', onCancel, {once: true})
        arm()
        try {
            let res = await this.options.client.send(new GetObjectCommand({
                Bucket: bucket,
                Key: key,
                Range: `bytes=${start}-${end}`,
                // the object must not change between parts
                IfMatch: etag,
                RequestPayer: this.options.requestPayer
            }), {abortSignal: abort.signal})
            if (!(res.Body instanceof Readable)) throw new Error('unexpected response body type')
            body = res.Body
            let chunks: Buffer[] = []
            let length = 0
            for await (let chunk of body) {
                arm()
                chunks.push(chunk)
                length += chunk.length
            }
            let expected = end - start + 1
            if (length != expected) throw new Error(`got ${length} bytes, expected ${expected}`)
            return Buffer.concat(chunks, length)
        } finally {
            clearTimeout(timer)
            signal.removeEventListener('abort', onCancel)
            body?.destroy()
        }
    }
}


function sleep(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        if (signal.aborted) return reject(signal.reason)
        let onAbort = () => {
            clearTimeout(timer)
            reject(signal.reason)
        }
        let timer = setTimeout(() => {
            signal.removeEventListener('abort', onAbort)
            resolve()
        }, ms)
        signal.addEventListener('abort', onAbort, {once: true})
    })
}
