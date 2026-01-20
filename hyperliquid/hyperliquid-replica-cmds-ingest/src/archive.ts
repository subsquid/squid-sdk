import type {Logger} from '@subsquid/logger'
import {Fs} from '@subsquid/util-internal-fs'
import {Range, assertRange, FiniteRange} from '@subsquid/util-internal-range'
import {assertValidity} from '@subsquid/util-internal-validation'
import {assertNotNull} from '@subsquid/util-internal'
import {Block, ReplicaBlock} from '@subsquid/hyperliquid-replica-cmds-data'
import * as lz4 from 'lz4'
import assert from 'assert'


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
        let prevRound = null
        for await (let rawChunk of this.getRawChunks({from, to})) {
            this.log.debug(`processing chunk ${rawChunk.filename}`)
            let batch = []
            for await (let block of this.getRawChunkBlocks(rawChunk)) {
                if (block.height < from) continue
                if (block.height > to) break
                if (prevRound != null) {
                    assert(block.block.abci_block.parent_round == prevRound)
                }
                assert(block.height == nextBlock++)
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
    }

    private async *readFile(path: string): AsyncIterable<Buffer> {
        let decoder = lz4.createDecoderStream()
        let stream = await this.fs.readStream(path)

        let chunks = []
        for await (let chunk of stream.pipe(decoder)) {
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
