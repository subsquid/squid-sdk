import type {Logger} from '@subsquid/logger'
import {Fs} from '@subsquid/util-internal-fs'
import {Range, assertRange, FiniteRange} from '@subsquid/util-internal-range'
import {assertValidity} from '@subsquid/util-internal-validation'
import {assertNotNull} from '@subsquid/util-internal'
import * as lz4 from 'lz4'
import assert from 'assert'
import {Block} from './data'


interface RawChunk {
    date: string
    filename: string
}


function getChunkPath(chunk: RawChunk) {
    return chunk.date + '/' + chunk.filename
}


export class HyperliquidArchive {
    private fs: Fs
    private lastProcessedChunk?: {
        chunk: RawChunk
        firstBlock: number
        lastBlock: number
    }

    constructor(fs: Fs, private log: Logger) {
        this.fs = fs.cd('hourly')
    }

    async *getRawBlocks(range?: Range): AsyncIterable<Block[]> {
        let {from, to} = getRange(range)

        let chunk = await this.getRawChunkForBlock(from)
        if (chunk == null) return

        let nextBlock = from
        for await (let rawChunk of this.getRawChunks(chunk)) {
            let batch = []
            let firstBlock = undefined
            let lastBlock = undefined
            for await (let block of this.readRawChunk(rawChunk)) {
                if (firstBlock == null) {
                    firstBlock = block.block_number
                }
                lastBlock = block.block_number

                if (block.block_number < from) continue
                assert.equal(block.block_number, nextBlock++)
                batch.push(block)
                if (block.block_number == to) {
                    yield batch
                    return
                } else if (batch.length == 5) {
                    yield batch
                    batch = []
                }
            }
            this.log.debug(`updating last processed chunk ${getChunkPath(rawChunk)}`)
            this.lastProcessedChunk = {
                chunk: rawChunk,
                firstBlock: assertNotNull(firstBlock),
                lastBlock: assertNotNull(lastBlock)
            }

            if (batch.length > 0) {
                yield batch
            }
        }
    }

    private async *getRawChunks(from: RawChunk): AsyncIterable<RawChunk> {
        this.log.debug('listing root folder')
        let dates = await this.fs.ls()
        let hour = parseFile(from.filename)
        for (let date of dates) {
            if (date < from.date) continue
            this.log.debug(`listing ${date} folder`)
            let files = await this.fs.ls(date)
            files.sort((a, b) => parseFile(a) - parseFile(b))
            for (let filename of files) {
                if (parseFile(filename) < hour) continue
                yield { date, filename }
            }
        }
    }

    // lightweight attempt to simulate all chunks in the bucket
    private async getAllRawChunks(): Promise<RawChunk[]> {
        let rawChunks = []
        let dates = await this.fs.ls()

        let firstDate = dates[0]
        let lastDate = dates[dates.length - 1]

        let firstDateFiles = await this.fs.ls(firstDate)
        rawChunks.push(...firstDateFiles.map(filename => ({date: firstDate, filename})))

        for (let date of dates.slice(1, dates.length - 1)) {
            for (let i = 0; i < 24; i++) {
                rawChunks.push({date, filename: i + '.lz4'})
            }
        }

        let lastDateFiles = await this.fs.ls(lastDate)
        rawChunks.push(...lastDateFiles.map(filename => ({date: lastDate, filename})))

        return rawChunks
    }

    private async *readRawChunk(rawChunk: RawChunk): AsyncIterable<Block> {
        let filePath = getChunkPath(rawChunk)
        this.log.debug(`reading ${filePath}`)
        let content = await this.fs.readFile(filePath)
        let buf = Buffer.from(content)
        let data = lz4.decode(buf)

        for (let line of bufferLineIterator(data)) {
            let block = JSON.parse(line)
            assertValidity(Block, block)
            yield block
        }
    }

    private async getRawChunkForBlock(targetBlock: number): Promise<RawChunk | undefined> {
        this.log.debug(`searching chunk for a block ${targetBlock}`)
        if (this.lastProcessedChunk != null) {
            let lastChunk = this.lastProcessedChunk.chunk
            if (this.lastProcessedChunk.firstBlock <= targetBlock && targetBlock <= this.lastProcessedChunk.lastBlock) {
                this.log.debug(`returning last processed chunk ${getChunkPath(lastChunk)}`)
                return lastChunk
            } else if (this.lastProcessedChunk.lastBlock + 1 == targetBlock) {
                for await (let rawChunk of this.getRawChunks(lastChunk)) {
                    if (rawChunk.date != lastChunk.date && rawChunk.filename != lastChunk.filename) {
                        this.log.debug(`returning new chunk ${getChunkPath(rawChunk)}`)
                        return rawChunk
                    }
                }
                this.log.debug('no chunk to return')
                return
            }
        }

        let rawChunks = await this.getAllRawChunks()

        let left = 0
        let right = rawChunks.length - 1

        while (left <= right) {
            let mid = Math.floor((left + right) / 2)
            let chunk = rawChunks[mid]
            let firstBlock = undefined
            let lastBlock = undefined

            this.log.debug(`checking ${getChunkPath(chunk)}`)
            for await (let block of this.readRawChunk(chunk)) {
                if (firstBlock == null) {
                    firstBlock = block.block_number
                }
                lastBlock = block.block_number
            }

            if (firstBlock! <= targetBlock && targetBlock <= lastBlock!) {
                this.log.debug('stop searching')
                return chunk
            } else if (lastBlock! < targetBlock) {
                left = mid + 1
            } else {
                right = mid - 1
            }
        }

        this.log.debug('no chunk after search')
        return
    }
}


function* bufferLineIterator(buffer: Buffer) {
    let start = 0
    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] === 10) { // '\n' byte
            yield buffer.subarray(start, i).toString('utf-8')
            start = i + 1
        }
    }

    if (start < buffer.length) {
        yield buffer.subarray(start).toString('utf-8')
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
