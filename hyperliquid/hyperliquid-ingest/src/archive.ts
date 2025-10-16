import type {Logger} from '@subsquid/logger'
import {Fs} from '@subsquid/util-internal-fs'
import {Range, assertRange, FiniteRange} from '@subsquid/util-internal-range'
import {assertValidity} from '@subsquid/util-internal-validation'
import * as lz4 from 'lz4'
import assert from 'assert'
import {Block, ReplicaBlock} from './data'


interface RawChunk {
    top: string
    subfolder: string
    filename: string
    block: number
}


export class HyperliquidArchive {
    constructor(private fs: Fs, private log: Logger) { }

    async *getRawBlocks(range?: Range): AsyncIterable<Block[]> {
        let {from, to} = getRange(range)
        let nextBlock = from
        for await (let rawChunk of this.getRawChunks({from, to})) {
            this.log.debug(`processing chunk starting at block ${rawChunk.block}`)
            let batch = []
            for await (let block of this.getRawChunkBlocks(rawChunk)) {
                if (block.height < from) continue
                if (block.height > to) break
                assert(block.height == nextBlock++)
                batch.push(block)
                if (batch.length == 5) {
                    yield batch
                    batch = []
                }
            }
            if (batch.length > 0) {
                yield batch
            }
        }
    }

    private async *getRawChunks(range: FiniteRange): AsyncIterable<RawChunk> {
        this.log.debug('listing root folder')
        let tops = await this.fs.ls()

        let prevChunk: RawChunk | undefined
        for (let i = 0; i < tops.length; i++) {
            let top = tops[i]

            this.log.debug(`listing ${top} folder`)
            let subfolders = await this.fs.ls(`${top}`)
            for (let j = 0; j < subfolders.length; j++) {
                let subfolder = subfolders[j]

                this.log.debug(`listing ${top}/${subfolder} folder`)
                let files = await this.fs.ls(`${top}`, `${subfolder}`)
                files.sort((a, b) => parseFile(a) - parseFile(b))
                for (let filename of files) {
                    let block = parseFile(filename)
                    if (block > range.to) return

                    let chunk = { filename, subfolder, top, block }

                    if (block < range.from) {
                        prevChunk = chunk
                        continue
                    } else {
                        if (prevChunk != null) {
                            let prevBlock = prevChunk.block
                            if (prevBlock < range.from && block > range.from) {
                                yield prevChunk
                            }
                        }
                        yield chunk
                    }

                    prevChunk = chunk
                }
            }
        }
    }

    private async *getRawChunkBlocks(rawChunk: RawChunk): AsyncIterable<Block> {
        let filePath = `${rawChunk.top}/${rawChunk.subfolder}/${rawChunk.filename}`
        let height = rawChunk.block
        for await (let item of this.readFile(filePath)) {
            yield {
                height: height++,
                block: item
            }
        }
    }

    private async *readFile(path: string): AsyncIterable<ReplicaBlock> {
        let content = await this.fs.readFile(path)
        let buf = Buffer.from(content)
        let data = lz4.decode(buf)
        for (let line of bufferLineIterator(data)) {
            let block = JSON.parse(line)
            assertValidity(ReplicaBlock, block)
            yield block
        }
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
