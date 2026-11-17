import {GetObjectCommand, HeadObjectCommand, S3Client} from '@aws-sdk/client-s3'
import {Readable} from 'stream'
import {describe, expect, it} from 'vitest'
import {ParallelDownloader} from './download'


interface Call {
    range: string
    signal: AbortSignal
}


/**
 * Serves `data` as one object. `respond` decides each ranged GET: return a Body,
 * or throw, or never resolve.
 */
function fakeClient(
    data: Buffer,
    respond: (start: number, end: number, call: Call) => Promise<Readable>
) {
    let calls: Call[] = []
    let client = {
        async send(cmd: any, opts?: {abortSignal?: AbortSignal}) {
            if (cmd instanceof HeadObjectCommand) return {ContentLength: data.length, ETag: '"e"'}
            if (!(cmd instanceof GetObjectCommand)) throw new Error('unexpected command')
            let range = cmd.input.Range!
            let [start, end] = range.slice('bytes='.length).split('-').map(Number)
            let call = {range, signal: opts!.abortSignal!}
            calls.push(call)
            return {Body: await respond(start, end, call)}
        }
    }
    return {client: client as unknown as S3Client, calls}
}


function hang(call: Call): Promise<Readable> {
    return new Promise((_, reject) => {
        call.signal.addEventListener('abort', () => reject(call.signal.reason), {once: true})
    })
}


function downloader(client: S3Client, opts: Partial<{concurrency: number, partAttempts: number, partTimeoutMs: number}> = {}) {
    return new ParallelDownloader({
        client,
        concurrency: opts.concurrency ?? 4,
        partSize: 10,
        partTimeoutMs: opts.partTimeoutMs ?? 5_000,
        partAttempts: opts.partAttempts ?? 3
    })
}


async function readAll(stream: Readable): Promise<Buffer> {
    let chunks = []
    for await (let chunk of stream) chunks.push(chunk)
    return Buffer.concat(chunks)
}


const DATA = Buffer.from(Array.from({length: 95}, (_, i) => i))


describe('ParallelDownloader', () => {
    it('returns the object in order when parts finish out of order', async () => {
        let {client} = fakeClient(DATA, async (start, end) => {
            await new Promise(r => setTimeout(r, 40 - start / 3))
            return Readable.from([DATA.subarray(start, end + 1)])
        })
        let out = await readAll(await downloader(client).readStream('b', 'k'))
        expect(out.equals(DATA)).toBe(true)
    })

    it('retries a part that fails, returns short, or stalls', async () => {
        let attempts = new Map<number, number>()
        let {client, calls} = fakeClient(DATA, async (start, end, call) => {
            let n = (attempts.get(start) ?? 0) + 1
            attempts.set(start, n)
            if (n == 1 && start == 10) throw new Error('503')
            if (n == 1 && start == 20) return Readable.from([DATA.subarray(start, end)])
            if (n == 1 && start == 30) return hang(call)
            return Readable.from([DATA.subarray(start, end + 1)])
        })
        let out = await readAll(await downloader(client, {partTimeoutMs: 100}).readStream('b', 'k'))
        expect(out.equals(DATA)).toBe(true)
        expect(calls.length).toBe(10 + 3)
    })

    it('fails the stream once a part runs out of attempts, and cancels the other parts', async () => {
        let {client, calls} = fakeClient(DATA, async (start, end, call) => {
            if (start == 0) throw new Error('always')
            return hang(call)
        })
        let stream = await downloader(client, {partAttempts: 2}).readStream('b', 'k')
        await expect(readAll(stream)).rejects.toThrow('always')
        let others = calls.filter(c => !c.range.startsWith('bytes=0-'))
        expect(others.length).toBeGreaterThan(0)
        expect(others.every(c => c.signal.aborted)).toBe(true)
    })

    it('cancels outstanding parts and retry waits when the reader stops early', async () => {
        let {client, calls} = fakeClient(DATA, async (start, end, call) => {
            if (start == 0) return Readable.from([DATA.subarray(start, end + 1)])
            if (start == 10) throw new Error('503') // its retry wait must be cut short too
            return hang(call)
        })
        let stream = await downloader(client).readStream('b', 'k')
        for await (let _ of stream) break // destroys the stream after the first part
        await new Promise(r => setTimeout(r, 50))
        let issued = calls.length
        let hanging = calls.filter(c => !/^bytes=(0|10)-/.test(c.range))
        expect(hanging.length).toBeGreaterThan(0)
        expect(hanging.every(c => c.signal.aborted)).toBe(true)
        await new Promise(r => setTimeout(r, 1500)) // past the first retry backoff
        expect(calls.length).toBe(issued)
    })
})
