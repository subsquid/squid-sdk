import type {Logger} from '@subsquid/logger'
import {Fs} from '@subsquid/util-internal-fs'
import {Range, assertRange, FiniteRange} from '@subsquid/util-internal-range'
import {assertValidity} from '@subsquid/util-internal-validation'
import {assertNotNull} from '@subsquid/util-internal'
import {Block, ReplicaBlock} from '@subsquid/hyperliquid-replica-cmds-data'
import * as lz4 from 'lz4'
import assert from 'assert'
import {Readable, pipeline} from 'stream'


interface RawChunk {
    top: string
    subfolder: string
    filename: string
    block: number
}


export type ReadStream = (path: string) => Promise<Readable>


export class HyperliquidArchive {
    private readStream: ReadStream

    /**
     * @param readStream reads a file under the archive root; defaults to `fs.readStream`
     */
    constructor(private fs: Fs, private log: Logger, readStream?: ReadStream) {
        this.readStream = readStream ?? (path => this.fs.readStream(path))
    }

    async *getRawBlocks(range?: Range): AsyncIterable<Block[]> {
        let {from, to} = getRange(range)

        let nextBlock = from
        let prevRound = null
        for await (let rawChunk of this.getRawChunks({from, to})) {
            this.log.debug(`processing chunk ${rawChunk.filename}`)
            let batch = []
            for await (let block of this.getRawChunkBlocks(rawChunk)) {
                if (block.height < from) continue
                if (block.height > to) break
                if (prevRound != null) {
                    assert.equal(block.block.abci_block.parent_round, prevRound)
                }
                assert.equal(block.height, nextBlock++)
                batch.push(block)
                if (block.height == to) {
                    yield batch
                    return
                } else if (batch.length == 5) {
                    yield batch
                    batch = []
                }
                prevRound = block.block.abci_block.round
            }

            if (batch.length > 0) {
                yield batch
            }
        }
    }

    private async *getRawChunks(range: FiniteRange): AsyncIterable<RawChunk> {
        this.log.debug('listing root folder')
        let tops = await this.fs.ls()

        // The archive holds hundreds of date folders and every request walks them from the start.
        // One listing at a time over a long round trip took minutes, long enough to time out the
        // first request of a cold start, so listings run concurrently and are consumed in order.
        let folders: {top: string, subfolder: string}[] = []
        for await (let subfolders of orderedMap(tops, LIST_CONCURRENCY, async top => {
            this.log.debug(`listing ${top} folder`)
            return await this.fs.ls(top)
        })) {
            folders.push(...subfolders.list.map(subfolder => ({top: subfolders.item, subfolder})))
        }

        let prevChunk: RawChunk | undefined
        for await (let listing of orderedMap(folders, LIST_CONCURRENCY, async ({top, subfolder}) => {
            this.log.debug(`listing ${top}/${subfolder} folder`)
            return await this.fs.ls(top, subfolder)
        })) {
            let {top, subfolder} = listing.item
            let files = listing.list
            files.sort((a, b) => parseFile(a) - parseFile(b))
            for (let filename of files) {
                let block = parseFile(filename) + 1 // first block in each file it is filename + 1
                let rawChunk = { filename, subfolder, top, block }
                if (block == range.from) {
                    yield rawChunk
                } else if (block > range.from) {
                    let lastChunk = assertNotNull(prevChunk, `block ${range.from} is not supported`)
                    if (lastChunk.block < range.from) {
                        yield lastChunk
                    }
                    if (block > range.to) return
                    yield rawChunk
                }

                prevChunk = rawChunk
            }
        }
    }

    private async *getRawChunkBlocks(rawChunk: RawChunk): AsyncIterable<Block> {
        let path = `${rawChunk.top}/${rawChunk.subfolder}/${rawChunk.filename}`
        let height = rawChunk.block
        for await (let line of this.readFile(path)) {
            let block = JSON.parse(line.toString('utf-8'))
            assertValidity(ReplicaBlock, block)
            yield {
                height: height++,
                block
            }
        }

        let count = height - rawChunk.block
        this.log.debug(`found ${count} blocks in ${rawChunk.filename}`)
    }

    private async *readFile(path: string): AsyncIterable<Buffer> {
        let decoder = lz4.createDecoderStream()
        let stream = await this.readStream(path)
        // pipeline() forwards a source error to the decoder, so it rejects the loop below
        // instead of surfacing as an unhandled 'error' event; the callback only absorbs it
        pipeline(stream, decoder, () => {})

        try {
            yield* splitLines(decoder)
        } finally {
            // the consumer may stop early (a finite range ends mid-file): release the download
            stream.destroy()
            decoder.destroy()
        }
    }
}


async function* splitLines(input: AsyncIterable<Buffer>): AsyncIterable<Buffer> {
    let chunks = []
    for await (let chunk of input) {
        let pos = 0
        for (let i = 0; i < chunk.length; i++) {
            if (chunk[i] === 10) { // '\n' byte
                chunks.push(chunk.subarray(pos, i))
                pos = i + 1
                yield Buffer.concat(chunks)
                chunks = []
            }
        }
        chunks.push(chunk.subarray(pos))
    }
}


const LIST_CONCURRENCY = 16


/**
 * Applies `fn` to `items` with up to `concurrency` calls in flight and yields the results in order.
 */
async function* orderedMap<T, R>(
    items: T[],
    concurrency: number,
    fn: (item: T) => Promise<R[]>
): AsyncIterable<{item: T, list: R[]}> {
    let inflight: Promise<R[]>[] = []
    let next = 0
    let fill = () => {
        while (next < items.length && inflight.length < concurrency) {
            let p = fn(items[next])
            // a consumer that stops early leaves some calls unawaited
            p.catch(() => {})
            inflight.push(p)
            next += 1
        }
    }
    fill()
    for (let i = 0; i < items.length; i++) {
        let list = await inflight.shift()!
        fill()
        yield {item: items[i], list}
    }
}


function getRange(range?: Range): FiniteRange {
    let from = 0
    let to = Infinity
    if (range) {
        assertRange(range)
        from = range.from
        to = range.to ?? Infinity
    }
    return {from, to}
}


function parseFile(value: string) {
    let number = parseInt(value.split('.')[0])
    assert(Number.isSafeInteger(number))
    return number
}
