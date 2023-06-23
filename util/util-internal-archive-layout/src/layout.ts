import {last} from '@subsquid/util-internal'
import {Fs} from '@subsquid/util-internal-fs'
import {assertRange, Range} from '@subsquid/util-internal-range'
import assert from 'assert'
import {DataChunk, getChunkPath, getDataChunkErrorMessage, tryParseChunkDir, tryParseTop} from './chunk'
import {ArchiveLayoutError, TopDirError} from './errors'
import {formatBlockNumber} from './util'


export class ArchiveLayout {
    constructor(private fs: Fs) {}

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
        writer: ArchiveWriter
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
        let gen = writer(nextBlock, prevHash)
        let it = await gen.next()
        while (!it.done) {
            assert(nextBlock == it.value.from)
            assert(it.value.from <= it.value.to)
            if (chunks.length >= 500) {
                top = nextBlock
                chunks = []
            }
            let newChunk = {...it.value, top}
            chunks.push(newChunk)
            nextBlock = newChunk.to + 1
            it = await gen.next(this.fs.cd(getChunkPath(newChunk)))
        }
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
}


export interface ArchiveWriter {
    (nextBlock: number, prevHash?: string): AsyncGenerator<
        {from: number, to: number, hash: string},
        void,
        Fs
    >
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


function printRange(range?: Range): string {
    if (range?.to != null) {
        return `[${range.from}, ${range.to}]`
    } else {
        return `[${range?.from ?? 0})`
    }
}
