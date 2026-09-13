import {Logger} from '@subsquid/logger'
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


export interface ConvertOptions {
    /**
     * Stop before the first chunk that starts below this block
     */
    from?: number
    level?: number
    bytesPerSecond?: number
    log?: Logger
}


export interface ConvertResult {
    chunks: number
    gzipBytes: number
    zstdBytes: number
}


export async function getStatus(layout: ArchiveLayout): Promise<ArchiveStatus> {
    let chunks = await listChunks(layout)
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
 * Converts gzip chunks below the trailing run of zstd chunks, newest first.
 *
 * Going downwards keeps the archive a run of gzip chunks followed by a run of zstd chunks
 * at every moment, which is what `getStatus()` relies on and what makes a restart resume.
 */
export async function convert(layout: ArchiveLayout, options: ConvertOptions = {}): Promise<ConvertResult> {
    let chunks = await listChunks(layout)
    let boundary = await findZstdBoundary(layout, chunks)
    if (boundary == null) {
        throw new Error('the newest data chunk is not zstd, switch the writer to zstd first')
    }

    let result: ConvertResult = {chunks: 0, gzipBytes: 0, zstdBytes: 0}
    let limiter = new ByteRateLimiter(options.bytesPerSecond)

    // a crash between writing .zst and deleting .gz leaves both
    await deleteLeftoverGzip(layout, chunks[boundary])

    for (let i = boundary - 1; i >= 0; i--) {
        let chunk = chunks[i]
        if (options.from != null && chunk.from < options.from) break

        let sizes = await convertChunk(layout, chunk, options.level)
        result.chunks += 1
        result.gzipBytes += sizes.gzipBytes
        result.zstdBytes += sizes.zstdBytes
        options.log?.info(`${getChunkPath(chunk)}: ${sizes.gzipBytes} -> ${sizes.zstdBytes} bytes`)

        await limiter.consume(sizes.gzipBytes + sizes.zstdBytes)
    }

    return result
}


export async function convertChunk(
    layout: ArchiveLayout,
    chunk: DataChunk,
    level?: number
): Promise<{gzipBytes: number, zstdBytes: number}> {
    let fs = layout.getChunkFs(chunk)
    let gzip = Buffer.from(await fs.readFile(GZIP_FILE))

    let source = new PayloadDigest()
    let zstdParts: Buffer[] = []
    await pipeline(
        Readable.from([gzip]),
        createDecompressor('gzip'),
        source,
        createCompressor('zstd', level),
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
        createDecompressor('zstd'),
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
    if (await getChunkCompression(layout, chunks[chunks.length - 1]) != 'zstd') return

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


async function deleteLeftoverGzip(layout: ArchiveLayout, chunk: DataChunk): Promise<void> {
    let fs = layout.getChunkFs(chunk)
    let files = await fs.ls()
    if (files.includes(ZSTD_FILE) && files.includes(GZIP_FILE)) {
        await fs.delete(GZIP_FILE)
    }
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
