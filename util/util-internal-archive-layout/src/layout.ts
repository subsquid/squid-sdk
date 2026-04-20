import {assertNotNull, concurrentWriter, last} from '@subsquid/util-internal'
import {Fs} from '@subsquid/util-internal-fs'
import {assertRange, printRange, Range, rangeEnd} from '@subsquid/util-internal-range'
import assert from 'assert'
import {pipeline} from 'stream/promises'
import {createGunzip} from 'zlib'
import {BlockRef, formatBlockNumber, getBlockNumber, getShortHash, peekBlockRef, RawBlock} from './block'
import {DataChunk, getChunkPath, getDataChunkErrorMessage, tryParseChunkDir, tryParseTop} from './chunk'
import {ArchiveLayoutError, TopDirError} from './errors'
import {getRange, GzipBuffer, splitLines} from './util'


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
            getNextChunk: (firstBlock: BlockRef, lastBlock: BlockRef) => Fs,
            nextBlock: number,
            prevShortHash?: string
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

        const getNextChunk = (first: BlockRef, last: BlockRef): Fs => {
            let from
            if (first.parentNumber == null) {
                from = first.number
            } else if (first.number == 0 && first.parentNumber == 0) {
                from = first.number
            } else {
                from = first.parentNumber + 1
            }
            let to = last.number
            assert(nextBlock === from)
            assert(from <= to)
            if (chunks.length >= this.topDirSize) {
                top = nextBlock
                chunks = []
            }
            let newChunk: DataChunk = {
                top,
                from,
                to,
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
            blocks: (nextBlock: number, prevShortHash?: string) => AsyncIterable<RawBlock[]>
            range?: Range
            chunkSize?: number
            onSuccessWrite?: (args: {chunk: string, blockRange: {from: BlockRef, to: BlockRef}}) => void
        }
    ): Promise<void> {
        return this.append(
            args.range || {from: 0},
            () => true,
            async (getNextChunk, nextBlock, prevHash) => {
                let chunkSize = args.chunkSize || 40 * 1024 * 1024
                let firstBlock: BlockRef | undefined
                let lastBlock: BlockRef | undefined
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

                for await (let batch of args.blocks(nextBlock, prevHash)) {
                    if (batch.length == 0) continue

                    if (firstBlock == null) {
                        firstBlock = peekBlockRef(batch[0])
                    }

                    lastBlock = peekBlockRef(last(batch))

                    for (let b of batch) {
                        out.write(JSON.stringify(b) + '\n')
                    }

                    await out.drain()

                    if (out.getSize() > chunkSize) {
                        await save()
                    }
                }

                if (firstBlock) {
                    await save()
                }
            }
        )
    }

    getRawBlocks<B extends RawBlock>(args?: {
        from?: number
        to?: number
        /**
         * Maximum number of chunks to fetch
         */
        chunksLimit?: number
    }): AsyncIterable<B[]>
    {
        return concurrentWriter(1, async write => {
            let r = args ? {
                from: args.from ?? 0,
                to: args.to
            } : {
                from: 0
            }
            assertRange(r)
            let blocks: B[] = []
            let bytesBuffered = 0
            let numChunks = 0
            let maxNumChunks = args?.chunksLimit ?? Number.MAX_SAFE_INTEGER
            for await (let chunk of this.getDataChunks(r)) {
                await pipeline(
                    await this.getChunkFs(chunk).readStream('blocks.jsonl.gz'),
                    createGunzip(),
                    async dataChunks => {
                        for await (let lines of splitLines(dataChunks)) {
                            for (let line of lines) {
                                let block: B = JSON.parse(line)
                                let number = getBlockNumber(block)
                                if (r.from <= number && number <= rangeEnd(r)) {
                                    blocks.push(block)
                                    bytesBuffered += line.length
                                }
                            }
                            if (blocks.length > 10 || bytesBuffered > 1024 * 1024) {
                                await write(blocks)
                                blocks = []
                                bytesBuffered = 0
                            }
                        }
                    }
                )
                numChunks += 1
                if (maxNumChunks <= numChunks) {
                    break
                }
            }
            if (blocks.length) {
                await write(blocks)
            }
        })
    }

    readRawChunk<B>(chunk: DataChunk): AsyncIterable<B[]> {
        return concurrentWriter(1, async write => {
            let blocks: B[] = []
            let bytesBuffered = 0
            await pipeline(
                await this.getChunkFs(chunk).readStream('blocks.jsonl.gz'),
                createGunzip(),
                async dataChunks => {
                    for await (let lines of splitLines(dataChunks)) {
                        for (let line of lines) {
                            let block: B = JSON.parse(line)
                            blocks.push(block)
                            bytesBuffered += line.length
                        }
                        if (blocks.length > 10 || bytesBuffered > 1024 * 1024) {
                            await write(blocks)
                            blocks = []
                            bytesBuffered = 0
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
