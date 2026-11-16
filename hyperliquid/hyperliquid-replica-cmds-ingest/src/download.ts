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
        return Readable.from(this.parts(bucket, key, size, head.ETag), {objectMode: false})
    }

    private async *parts(bucket: string, key: string, size: number, etag?: string): AsyncIterable<Buffer> {
        let {concurrency, partSize} = this.options
        let count = Math.ceil(size / partSize)
        let inflight: Promise<Buffer>[] = []
        let next = 0

        let schedule = () => {
            while (next < count && inflight.length < concurrency) {
                let start = next * partSize
                let end = Math.min(size, start + partSize) - 1
                let p = this.fetchPart(bucket, key, start, end, etag)
                // avoid an unhandled rejection while the part waits in the queue
                p.catch(() => {})
                inflight.push(p)
                next += 1
            }
        }

        schedule()
        while (inflight.length > 0) {
            let part = await inflight.shift()!
            schedule()
            yield part
        }
    }

    private async fetchPart(bucket: string, key: string, start: number, end: number, etag?: string): Promise<Buffer> {
        let {partAttempts} = this.options
        for (let attempt = 1; ; attempt++) {
            try {
                return await this.fetchPartOnce(bucket, key, start, end, etag)
            } catch (err: any) {
                if (attempt >= partAttempts) throw err
                this.options.log?.warn(
                    `range ${start}-${end} of s3://${bucket}/${key} failed (attempt ${attempt}): ${err?.message ?? err}`
                )
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
            }
        }
    }

    private async fetchPartOnce(bucket: string, key: string, start: number, end: number, etag?: string): Promise<Buffer> {
        let abort = new AbortController()
        let body: Readable | undefined
        let timer: NodeJS.Timeout | undefined
        let arm = () => {
            clearTimeout(timer)
            timer = setTimeout(() => {
                let err = new Error(`no data for ${this.options.partTimeoutMs} ms`)
                abort.abort(err)
                // the signal covers the request; a body already streaming is torn down here
                body?.destroy(err)
            }, this.options.partTimeoutMs)
        }
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
            body?.destroy()
        }
    }
}
