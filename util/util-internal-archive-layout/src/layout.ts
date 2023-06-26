import {assertNotNull, last} from '@subsquid/util-internal'
import {Fs} from '@subsquid/util-internal-fs'
import {assertRange, printRange, Range} from '@subsquid/util-internal-range'
import assert from 'assert'
import * as zlib from 'zlib'
import {DataChunk, getChunkPath, getDataChunkErrorMessage, tryParseChunkDir, tryParseTop} from './chunk'
import {ArchiveLayoutError, TopDirError} from './errors'
import {formatBlockNumber, getShortHash} from './util'


export class ArchiveLayout {
    constructor(public readonly fs: Fs) {}

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

        const getNextChunk = (first: HashAndHeight, last: HashAndHeight): Fs => {
            assert(nextBlock == first.height)
            assert(first.height <= last.height)
            if (chunks.length >= 500) {
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
            chunkSize?: number
        }
    ): Promise<void> {
        return this.append(
            args.range || {from: 0},
            () => true,
            async (getNextChunk, nextBlock, prevHash) => {
                let chunkSize = args.chunkSize || 40 * 1024 * 1024
                let firstBlock: HashAndHeight | undefined
                let lastBlock: HashAndHeight | undefined
                let out = zlib.createGzip()

                async function save(): Promise<void> {
                    out.end()
                    await getNextChunk(
                        assertNotNull(firstBlock),
                        assertNotNull(lastBlock)
                    ).transactDir('.', fs => {
                        return fs.write('blocks.jsonl.gz', out)
                    })
                    firstBlock = undefined
                    lastBlock = undefined
                    out = zlib.createGzip()
                }

                for await (let bb of args.blocks(nextBlock, prevHash)) {
                    if (bb.length == 0) continue
                    if (firstBlock == null) {
                        firstBlock = peekHashAndHeight(bb[0])
                    }
                    lastBlock = peekHashAndHeight(last(bb))
                    for (let b of bb) {
                        out.write(JSON.stringify(b) + '\n')
                    }
                    if (out.readableLength > chunkSize) {
                        await save()
                    }
                }

                if (firstBlock) {
                    await save()
                }
            }
        )
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
