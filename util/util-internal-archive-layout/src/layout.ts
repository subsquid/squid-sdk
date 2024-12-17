import {assertNotNull, concurrentWriter, last} from '@subsquid/util-internal'
import {Fs} from '@subsquid/util-internal-fs'
import {assertRange, printRange, Range, rangeEnd} from '@subsquid/util-internal-range'
import assert from 'assert'
import {StringDecoder} from 'node:string_decoder'
import * as readline from 'readline'
import {pipeline} from 'stream/promises'
import * as zlib from 'zlib'
import {createGunzip} from 'zlib'
import {DataChunk, getChunkPath, getDataChunkErrorMessage, tryParseChunkDir, tryParseTop} from './chunk'
import {ArchiveLayoutError, TopDirError} from './errors'
import {formatBlockNumber, getShortHash} from './util'


export interface RawBlock {
    hash: string
    height: number
}


export interface ArchiveLayoutOptions {
    topDirSize?: number
}


export class ArchiveLayout {
    private topDirSize: number

    constructor(
        public readonly fs: Fs,
        options?: ArchiveLayoutOptions
    ) {
        this.topDirSize = options?.topDirSize || 500
    }

    getChunkFs(chunk: DataChunk): Fs {
        return this.fs.cd(getChunkPath(chunk))
    }

    async getTops(): Promise<number[]> {
        let items = await this.fs.ls()
        let tops: number[] = []
        for (let item of items) {
            let top = tryParseTop(item)
            if (top == null) continue
            if (formatBlockNumber(top) == item) {
                tops.push(top)
            } else {
                throw new TopDirError(this.fs.abs(), item)
            }
        }
        return tops.sort((a, b) => a - b)
    }

    async *getDataChunks(range?: Range): AsyncIterable<DataChunk> {
        let {from, to} = getRange(range)
        let tops = await this.getTops()
        for (let i = 0; i < tops.length; i++) {
            let top = tops[i]
            if (top > to) return
            if (tops.length > i + 1 && tops[i+1] < from) continue
            for (let chunk of await this.readChunks(top, tops[i+1])) {
                if (to < chunk.from) return
                if (from > chunk.to) continue
                yield chunk
            }
        }
    }

    private async readChunks(top: number, nextTop?: number): Promise<DataChunk[]> {
        let chunks: DataChunk[] = []
        let items = await this.fs.ls(formatBlockNumber(top))
        for (let item of items) {
            let dir = tryParseChunkDir(item)
            if (dir == null) continue
            let chunk = {top, ...dir}
            this.checkChunk(chunk, item)
            if (nextTop != null && nextTop <= chunk.to) {
                throw new ArchiveLayoutError(
                    this.fs.abs(),
                    `chunk ${getChunkPath(chunk)} overlaps with the range of top dir ${formatBlockNumber(nextTop)}`
                )
            }
            chunks.push(chunk)
        }
        chunks.sort((a, b) => a.from - b.from)
        for (let i = 1; i < chunks.length; i++) {
            if (chunks[i].from <= chunks[i-1].to) {
                throw new ArchiveLayoutError(
                    this.fs.abs(),
                    `overlapping data chunks: ${getChunkPath(chunks[i-1])} and ${getChunkPath(chunks[i])}`
                )
            }
        }
        return chunks
    }

    private checkChunk(chunk: DataChunk, item: string): void {
        let path = `${formatBlockNumber(chunk.top)}/${item}`
        if (getChunkPath(chunk) !== path) {
            throw new ArchiveLayoutError(
                this.fs.abs(),
                `item ${path} resembles data chunk, but has non-canonical name`
            )
        }
        let err = getDataChunkErrorMessage(chunk)
        if (err) {
            throw new ArchiveLayoutError(
                this.fs.abs(),
                `invalid data chunk ${path}: ${err}`
            )
        }
    }

    async append(
        range: Range,
        chunkCheck: (files: string[]) => boolean,
        writer: (
            getNextChunk: (firstBlock: HashAndHeight, lastBlock: HashAndHeight) => Fs,
            nextBlock: number,
            prevHash?: string
        ) => Promise<void>
    ): Promise<void> {
        let {top, chunks} = await this.getAppendState(range)
        let nextBlock: number
        let prevHash: string | undefined
        if (chunks.length) {
            let lastChunkDir = getChunkPath(last(chunks))
            if (!chunkCheck(await this.fs.ls(lastChunkDir))) {
                await this.fs.delete(lastChunkDir)
                chunks.pop()
            }
        }
        if (chunks.length) {
            nextBlock = last(chunks).to + 1
            prevHash = last(chunks).hash
        } else {
            nextBlock = top
        }

        if (nextBlock > rangeEnd(range)) return

        const getNextChunk = (first: HashAndHeight, last: HashAndHeight): Fs => {
            assert(nextBlock == first.height)
            assert(first.height <= last.height)
            if (chunks.length >= this.topDirSize) {
                top = nextBlock
                chunks = []
            }
            let newChunk = {
                top,
                from: first.height,
                to: last.height,
                hash: getShortHash(last.hash)
            }
            chunks.push(newChunk)
            nextBlock = newChunk.to + 1
            return this.fs.cd(getChunkPath(newChunk))
        }

        return writer(getNextChunk, nextBlock, prevHash)
    }

    private async getAppendState(range: Range): Promise<{top: number, chunks: DataChunk[]}> {
        let {from, to} = getRange(range)
        let tops = await this.getTops()
        for (let i = tops.length - 1; i >= 0; i--) {
            let top = tops[i]
            if (top > to) continue
            let chunks = await this.readChunks(top, tops[i+1])
            if (chunks.length == 0) {
                if (top <= from) {
                    return {top: from, chunks: []}
                } else {
                    return {top, chunks: []}
                }
            } else if (chunks[0].from < from) {
                if (last(chunks).to >= from) throw new Error(
                    `Contents of top dir ${formatBlockNumber(top)} overlap range ${printRange(range)}. ` +
                    `Perhaps some part of the range is controlled by another writer.`
                )
                return {top: from, chunks: []}
            } else if (last(chunks).to > to) {
                throw new Error(
                    `Contents of top dir ${formatBlockNumber(top)} overlap range ${printRange(range)}. ` +
                    `Perhaps some part of the range is controlled by another writer.`
                )
            } else {
                return {top, chunks}
            }
        }
        return {top: from, chunks: []}
    }

    appendRawBlocks(
        args: {
            blocks: (nextBlock: number, prevHash?: string) => AsyncIterable<HashAndHeight[]>
            range?: Range
            chunkSize?: number,
            writeBatchSize?: number,
            onSuccessWrite?: (args: {chunk: string, blockRange: {from: HashAndHeight, to: HashAndHeight}}) => void
        }
    ): Promise<void> {
        return this.append(
            args.range || {from: 0},
            () => true,
            async (getNextChunk, nextBlock, prevHash) => {
                let chunkSize = args.chunkSize || 40 * 1024 * 1024
                let firstBlock: HashAndHeight | undefined
                let lastBlock: HashAndHeight | undefined
                let out = new GzipBuffer()

                async function save(): Promise<void> {
                    let blockRange = {
                        from: assertNotNull(firstBlock),
                        to: assertNotNull(lastBlock)
                    }

                    let chunk = getNextChunk(blockRange.from, blockRange.to)

                    await chunk.transactDir('.', async fs => {
                        let content = await out.end()
                        return fs.write('blocks.jsonl.gz', content)
                    })

                    args.onSuccessWrite?.({
                        chunk: chunk.abs(),
                        blockRange
                    })

                    firstBlock = undefined
                    lastBlock = undefined
                    out = new GzipBuffer()
                }

                let buf: HashAndHeight[] = []

                for await (let batch of args.blocks(nextBlock, prevHash)) {
                    if (batch.length == 0) continue

                    buf.push(...batch)

                    for (let bb of pack(buf, args.writeBatchSize ?? 10)) {
                        if (firstBlock == null) {
                            firstBlock = peekHashAndHeight(bb[0])
                        }

                        lastBlock = peekHashAndHeight(last(bb))

                        for (let b of bb) {
                            out.write(JSON.stringify(b) + '\n')
                        }

                        await out.flush()
                        if (out.getSize() > chunkSize) {
                            await save()
                        }
                    }
                }

                if (firstBlock) {
                    await save()
                }
            }
        )
    }

    getRawBlocks<B extends HashAndHeight>(range?: Range): AsyncIterable<B[]> {
        return concurrentWriter(1, async write => {
            let r = range || {from: 0}
            assertRange(r)
            let blocks: B[] = []
            for await (let chunk of this.getDataChunks(r)) {
                let fs = this.getChunkFs(chunk)
                await pipeline(
                    await fs.readStream('blocks.jsonl.gz'),
                    createGunzip(),
                    async dataChunks => {
                        for await (let lines of splitLines(dataChunks)) {
                            for (let line of lines) {
                                let block: B = JSON.parse(line)
                                if (r.from <= block.height && block.height <= rangeEnd(r)) {
                                    blocks.push(block)
                                    if (blocks.length > 10) {
                                        await write(blocks)
                                        blocks = []
                                    }
                                }
                            }
                        }
                    }
                )
            }
            if (blocks.length) {
                await write(blocks)
            }
        })
    }

    readRawChunk<B>(chunk: DataChunk): AsyncIterable<B[]> {
        return concurrentWriter(1, async write => {
            let blocks: B[] = []
            let fs = this.getChunkFs(chunk)
            await pipeline(
                await fs.readStream('blocks.jsonl.gz'),
                createGunzip(),
                async dataChunks => {
                    for await (let lines of splitLines(dataChunks)) {
                        for (let line of lines) {
                            let block: B = JSON.parse(line)
                            blocks.push(block)
                            if (blocks.length > 10) {
                                await write(blocks)
                                blocks = []
                            }
                        }
                    }
                }
            )
            if (blocks.length) {
                await write(blocks)
            }
        })
    }
}

export async function* splitLines(chunks: AsyncIterable<Buffer>) {
    let splitter = new LineSplitter()
    for await (let chunk of chunks) {
        let lines = splitter.push(chunk)
        if (lines) yield lines
    }
    let lastLine = splitter.end()
    if (lastLine) yield [lastLine]
}


class LineSplitter {
    private decoder = new StringDecoder('utf-8')
    private line = ''

    push(data: Buffer): string[] | undefined {
        let s = this.decoder.write(data)
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


class GzipBuffer {
    private stream = zlib.createGzip()
    private buf: Buffer[] = []
    private size = 0

    constructor() {
        this.stream.on('data', chunk => {
            this.buf.push(chunk)
            this.size += chunk.length
        })
    }

    write(content: string): void {
        this.stream.write(content)
    }

    flush(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.stream.on('error', reject)
            this.stream.flush(() => {
                this.stream.off('error', reject)
                resolve()
            })
        })
    }

    getSize(): number {
        return this.size
    }

    end(): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            this.stream.on('error', reject)
            this.stream.on('end', () => {
                resolve(Buffer.concat(this.buf))
            })
            this.stream.end()
        })
    }
}


interface HashAndHeight {
    hash: string
    height: number
}


function getRange(range?: Range): {from: number, to: number} {
    let from = 0
    let to = Infinity
    if (range) {
        assertRange(range)
        from = range.from
        to = range.to ?? Infinity
    }
    return {from, to}
}


function peekHashAndHeight(block: HashAndHeight): HashAndHeight {
    let {hash, height} = block
    return {hash, height}
}


function* pack<T>(items: T[], size: number): Iterable<T[]> {
    assert(size > 0)

    let offset = 0
    let end = size

    while (end <= items.length) {
        yield items.slice(offset, end)
        offset = end
        end = offset + size
    }

    items.splice(0, offset)
}
