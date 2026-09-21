import * as net from 'node:net'
import * as zlib from 'node:zlib'
import {describe, expect, it, vi} from 'vitest'
import {DataSource} from '@subsquid/util-internal-data-source'
import {runDataService} from './index'
import {Block} from './types'


const HEAD = 1000


function mkBlock(number: number): Block {
    return {
        number,
        hash: `h${number}`,
        parentNumber: number - 1,
        parentHash: `h${number - 1}`,
        timestamp: Date.now(),
        jsonLineZstd: zlib.zstdCompressSync(Buffer.from(`{"number":${number}}\n`))
    }
}


// Serves finalized batches of 1 block each with a small delay,
// so that a below query backfill stays in flight long enough
// for the test to cancel it mid-stream.
// `state.backfillClosed` stands for the release of backfill resources
// (worker threads in the real services).
function mkSource(state: {backfillClosed: boolean}): DataSource<Block> {
    return {
        async getHead() {
            return {number: HEAD, hash: `h${HEAD}`}
        },
        async getFinalizedHead() {
            return {number: HEAD, hash: `h${HEAD}`}
        },
        async *getFinalizedStream(req) {
            try {
                for (let number = req.from; number <= (req.to ?? req.from); number++) {
                    await new Promise(resolve => setTimeout(resolve, 10))
                    yield {blocks: [mkBlock(number)]}
                }
            } finally {
                if (req.from < HEAD) {
                    // not the service init stream, must be a below query
                    state.backfillClosed = true
                }
            }
        },
        async *getStream(req) {
            yield {blocks: [mkBlock(req.from)]}
            // keep the ingestion session open
            await new Promise(() => {})
        }
    }
}


describe('/stream', () => {
    it('promptly releases the backfill stream when the client disconnects without consuming the response', async () => {
        // Regression test: a client disconnect leaves ctx.response.writable equal to true,
        // while writes are silently discarded. The response loop used to notice the disconnect
        // only via the max duration limit, keeping the backfill (and its worker threads)
        // running at full speed for up to a minute after the client was gone
        let state = {backfillClosed: false}
        let service = await runDataService({source: mkSource(state), blockCacheSize: 100, port: 0})
        try {
            let socket = net.connect(service.port, '127.0.0.1')
            let body = JSON.stringify({fromBlock: 0})
            socket.write(
                `POST /stream HTTP/1.1\r\n` +
                `Host: test\r\n` +
                `Content-Type: application/json\r\n` +
                `Content-Length: ${body.length}\r\n` +
                `\r\n` +
                body
            )

            // let the below query start streaming, then cancel without reading the response
            await new Promise(resolve => setTimeout(resolve, 200))
            socket.destroy()

            await vi.waitFor(() => expect(state.backfillClosed).toBe(true), {timeout: 2000, interval: 25})
        } finally {
            await service.close()
        }
    })
})
