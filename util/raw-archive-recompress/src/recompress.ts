import {Logger} from '@subsquid/logger'
import {last} from '@subsquid/util-internal'
import {
    ArchiveLayout,
    checkShorHashMatch,
    Compression,
    createCompressor,
    createDecompressor,
    DataChunk,
    getBlockNumber,
    getBlocksFileName,
    getChunkPath,
    RawBlock
} from '@subsquid/util-internal-archive-layout'
import {createHash} from 'crypto'
import {Readable, Transform, TransformCallback, Writable} from 'stream'
import {pipeline} from 'stream/promises'
import {setTimeout as sleep} from 'timers/promises'


const GZIP_FILE = getBlocksFileName('gzip')
const ZSTD_FILE = getBlocksFileName('zstd')

// Every zlib output chunk crosses the main thread. With the 16 KiB default it,
// not the thread pool, capped parallel conversion at about two dozen workers.
const ZLIB_CHUNK_SIZE = 1024 * 1024


/**
 * Chunks below the highest unfinished one that workers may already have converted.
 *
 * A restart rescans this many chunks above the boundary it finds,
 * so it must not depend on `concurrency`, which can differ between runs.
 */
export const RESUME_WINDOW = 1024


export interface ChunkRange {
    /**
     * Skip chunks that start below this block
     */
    from?: number
    /**
     * Skip chunks that start at or above this block
     */
    to?: number
}


export interface ArchiveStatus {
    chunks: number
    newest?: Compression
    /**
     * First chunk of the trailing run of zstd chunks.
     * Known only when the newest chunk is zstd.
     */
    firstZstdChunk?: DataChunk
    /**
     * Number of chunks below `firstZstdChunk`
     */
    gzipChunks?: number
}


export interface ConvertOptions extends ChunkRange {
    level?: number
    bytesPerSecond?: number
    concurrency?: number
    /**
     * Defaults to `RESUME_WINDOW`; smaller values let tests reach past the rescan
     */
    resumeWindow?: number
    log?: Logger
}


export interface ConvertResult {
    chunks: number
    gzipBytes: number
    zstdBytes: number
}


/**
 * Status of the chunks in `range`.
 *
 * Parallel conversions of disjoint ranges leave zstd runs between gzip runs,
 * so only the status of a range that one conversion owns is meaningful.
 */
export async function getStatus(layout: ArchiveLayout, range: ChunkRange = {}): Promise<ArchiveStatus> {
    let chunks = selectRange(await listChunks(layout), range)
    let boundary = await findZstdBoundary(layout, chunks)
    if (boundary == null) {
        return {
            chunks: chunks.length,
            newest: chunks.length ? 'gzip' : undefined
        }
    }
    return {
        chunks: chunks.length,
        newest: 'zstd',
        firstZstdChunk: chunks[boundary],
        gzipChunks: boundary
    }
}


/**
 * Converts gzip chunks of `options` range, newest first.
 *
 * Going downwards keeps the range a run of gzip chunks followed by a run of zstd chunks,
 * except for at most `RESUME_WINDOW` chunks below the highest unfinished one.
 * A restart finds the boundary and rescans that window above it, skipping zstd chunks.
 */
export async function convert(layout: ArchiveLayout, options: ConvertOptions = {}): Promise<ConvertResult> {
    let all = await listChunks(layout)
    if (all.length == 0 || await getChunkCompression(layout, last(all)) != 'zstd') {
        throw new Error('the newest data chunk is not zstd, switch the writer to zstd first')
    }

    let chunks = selectRange(all, options)
    let window = options.resumeWindow ?? RESUME_WINDOW
    let boundary = await findZstdBoundary(layout, chunks) ?? chunks.length
    let start = Math.min(boundary + window, chunks.length) - 1

    let result: ConvertResult = {chunks: 0, gzipBytes: 0, zstdBytes: 0}
    let limiter = new ByteRateLimiter(options.bytesPerSecond)

    await forEachDescending(start, options.concurrency ?? 1, window, async i => {
        let chunk = chunks[i]
        let sizes = await convertChunk(layout, chunk, options.level)
        if (sizes == null) return

        result.chunks += 1
        result.gzipBytes += sizes.gzipBytes
        result.zstdBytes += sizes.zstdBytes
        options.log?.info(`${getChunkPath(chunk)}: ${sizes.gzipBytes} -> ${sizes.zstdBytes} bytes`)

        await limiter.consume(sizes.gzipBytes + sizes.zstdBytes)
    })

    return result
}


/**
 * Converts one chunk. Returns `undefined` when the chunk is already zstd.
 */
export async function convertChunk(
    layout: ArchiveLayout,
    chunk: DataChunk,
    level?: number
): Promise<{gzipBytes: number, zstdBytes: number} | undefined> {
    let fs = layout.getChunkFs(chunk)

    let files = await fs.ls()
    if (files.includes(ZSTD_FILE)) {
        // a crash between writing .zst and deleting .gz leaves both
        if (files.includes(GZIP_FILE)) {
            await fs.delete(GZIP_FILE)
        }
        return
    }
    if (!files.includes(GZIP_FILE)) {
        throw new Error(`${getChunkPath(chunk)}: no blocks file`)
    }

    let gzip = Buffer.from(await fs.readFile(GZIP_FILE))

    let source = new PayloadDigest()
    let zstdParts: Buffer[] = []
    await pipeline(
        Readable.from([gzip]),
        createDecompressor('gzip', ZLIB_CHUNK_SIZE),
        source,
        createCompressor('zstd', level, ZLIB_CHUNK_SIZE),
        new Writable({
            write(data: Buffer, _, cb) {
                zstdParts.push(data)
                cb()
            }
        })
    )
    let zstd = Buffer.concat(zstdParts)

    let roundTrip = new PayloadDigest()
    await pipeline(
        Readable.from([zstd]),
        createDecompressor('zstd', ZLIB_CHUNK_SIZE),
        roundTrip,
        new Writable({
            write(_data, _, cb) {
                cb()
            }
        })
    )

    if (roundTrip.digest() !== source.digest()) {
        throw new Error(`${getChunkPath(chunk)}: zstd payload differs from gzip payload`)
    }
    checkLastBlock(chunk, source.lastLine())

    // .zst goes in before .gz goes away, so a reader always finds one of them
    await fs.write(ZSTD_FILE, zstd)
    await fs.delete(GZIP_FILE)

    return {gzipBytes: gzip.length, zstdBytes: zstd.length}
}


/**
 * Runs `task` for `start, start - 1, ..., 0` on `concurrency` workers.
 *
 * An index is taken only while it is less than `window` below the highest unfinished one,
 * so a crash leaves finished tasks below an unfinished one only within that window.
 * After a failure no new task starts; the running ones finish before the error is thrown.
 */
export async function forEachDescending(
    start: number,
    concurrency: number,
    window: number,
    task: (index: number) => Promise<void>
): Promise<void> {
    let next = start
    let unfinished = new Set<number>()
    let waiters: (() => void)[] = []
    let failed = false

    function wakeUp(): void {
        let ws = waiters
        waiters = []
        for (let resolve of ws) {
            resolve()
        }
    }

    async function worker(): Promise<void> {
        while (!failed && next >= 0) {
            let highest = unfinished.size > 0 ? Math.max(...unfinished) : next
            if (highest - next >= window) {
                await new Promise<void>(resolve => waiters.push(resolve))
                continue
            }

            let index = next
            next -= 1
            unfinished.add(index)
            try {
                await task(index)
            } catch (err) {
                failed = true
                throw err
            } finally {
                unfinished.delete(index)
                wakeUp()
            }
        }
    }

    let workers = Array.from({length: Math.max(1, concurrency)}, () => worker())
    let results = await Promise.allSettled(workers)
    for (let r of results) {
        if (r.status == 'rejected') throw r.reason
    }
}


function selectRange(chunks: DataChunk[], range: ChunkRange): DataChunk[] {
    return chunks.filter(chunk => {
        let aboveFrom = range.from == null || chunk.from >= range.from
        let belowTo = range.to == null || chunk.from < range.to
        return aboveFrom && belowTo
    })
}


async function listChunks(layout: ArchiveLayout): Promise<DataChunk[]> {
    let chunks: DataChunk[] = []
    for await (let chunk of layout.getDataChunks()) {
        chunks.push(chunk)
    }
    return chunks
}


/**
 * Index of the first chunk of the trailing zstd run, undefined if the newest chunk is not zstd.
 */
async function findZstdBoundary(layout: ArchiveLayout, chunks: DataChunk[]): Promise<number | undefined> {
    if (chunks.length == 0) return
    if (await getChunkCompression(layout, last(chunks)) != 'zstd') return

    let lo = 0
    let hi = chunks.length - 1
    while (lo < hi) {
        let mid = Math.floor((lo + hi) / 2)
        if (await getChunkCompression(layout, chunks[mid]) == 'zstd') {
            hi = mid
        } else {
            lo = mid + 1
        }
    }
    return hi
}


export async function getChunkCompression(layout: ArchiveLayout, chunk: DataChunk): Promise<Compression> {
    let files = await layout.getChunkFs(chunk).ls()
    if (files.includes(ZSTD_FILE)) return 'zstd'
    if (files.includes(GZIP_FILE)) return 'gzip'
    throw new Error(`${getChunkPath(chunk)}: no blocks file`)
}


function checkLastBlock(chunk: DataChunk, line: Buffer | undefined): void {
    if (line == null) {
        throw new Error(`${getChunkPath(chunk)}: no blocks`)
    }

    let block: RawBlock = JSON.parse(line.toString('utf-8'))
    let number = getBlockNumber(block)
    let matches = number === chunk.to && checkShorHashMatch(block.hash, chunk.hash)

    if (!matches) {
        throw new Error(
            `${getChunkPath(chunk)}: last block ${number}#${block.hash} does not match the chunk name`
        )
    }
}


class PayloadDigest extends Transform {
    private hash = createHash('sha256')
    private tail: Buffer[] = []
    private last?: Buffer[]

    _transform(data: Buffer, _: BufferEncoding, cb: TransformCallback): void {
        this.hash.update(data)

        let start = 0
        let pos: number
        while ((pos = data.indexOf(10, start)) >= 0) {
            this.tail.push(data.subarray(start, pos))
            this.last = this.tail
            this.tail = []
            start = pos + 1
        }
        if (start < data.length) {
            this.tail.push(data.subarray(start))
        }

        cb(null, data)
    }

    _flush(cb: TransformCallback): void {
        if (this.tail.length > 0) {
            this.last = this.tail
            this.tail = []
        }
        cb()
    }

    digest(): string {
        return this.hash.copy().digest('hex')
    }

    lastLine(): Buffer | undefined {
        return this.last && Buffer.concat(this.last)
    }
}


class ByteRateLimiter {
    private startedAt = Date.now()
    private bytes = 0

    constructor(private bytesPerSecond?: number) {}

    async consume(bytes: number): Promise<void> {
        if (!this.bytesPerSecond) return
        this.bytes += bytes

        let dueAt = this.startedAt + this.bytes / this.bytesPerSecond * 1000
        let delay = dueAt - Date.now()
        if (delay > 0) {
            await sleep(delay)
        }
    }
}
