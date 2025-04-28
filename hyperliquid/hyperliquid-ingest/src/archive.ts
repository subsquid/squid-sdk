import {Fs} from '@subsquid/util-internal-fs'
import {Range, assertRange, FiniteRange} from '@subsquid/util-internal-range'
import {assertValidity} from '@subsquid/util-internal-validation'
import * as msgpack from '@msgpack/msgpack'
import * as lz4 from 'lz4'
import assert from 'assert'
import {RawBlock} from './data'


interface RawChunk {
    top: number
    subfolder: number
    filename: string
}


export class HyperliquidArchive {
    constructor(private fs: Fs) { }

    async *getRawBlocks(range?: Range): AsyncIterable<RawBlock[]> {
        let {from, to} = getRange(range)
        for await (let rawChunk of this.getRawChunks({from, to})) {
            let batch = []
            let filePath = `${rawChunk.top}/${rawChunk.subfolder}/${rawChunk.filename}`
            for await (let block of this.readFile(filePath)) {
                if (block.header.height < from) continue
                if (block.header.height > to) break
                batch.push(block)
            }
            yield batch
        }
    }

    private async *getRawChunks(range: FiniteRange): AsyncIterable<RawChunk> {
        let items = await this.fs.ls()
        let tops = items.map(parseFolder)
        tops.sort((a, b) => a - b)

        let prevBlock: number | undefined
        for (let i = 0; i < tops.length; i++) {
            let top = tops[i]
            if (top > range.to) return
            if (tops.length > i + 1 && tops[i + 1] < range.from) continue

            let items = await this.fs.ls(`${top}`)
            let subfolders = items.map(parseFolder)
            subfolders.sort((a, b) => a - b)

            for (let j = 0; j < subfolders.length; j++) {
                let subfolder = subfolders[j]
                if (subfolder > range.to) return
                if (subfolders.length > j + 1 && subfolders[j + 1] < range.from) continue

                let files = await this.fs.ls(`${top}`, `${subfolder}`)
                files.sort((a, b) => parseFile(a) - parseFile(b))

                for (let filename of files) {
                    let block = parseFile(filename)
                    if (block < range.from) continue
                    if (block > range.to && prevBlock != null && prevBlock > range.to) return

                    yield { filename, subfolder, top }
                    prevBlock = block
                }
            }
        }
    }

    private async *readFile(path: string): AsyncIterable<RawBlock> {
        let content = await this.fs.readFile(path)
        let buf = Buffer.from(content)
        let data = lz4.decode(buf)
        let rawBlocks = msgpack.decode(data)

        assert(Array.isArray(rawBlocks))
        for (let i = 0; i < rawBlocks.length; i++) {
            let block: RawBlock = rawBlocks[i]
            assertValidity(RawBlock, block)
            yield block
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


function parseFolder(value: string) {
    let number = parseInt(value)
    assert(Number.isSafeInteger(number))
    return number
}


function parseFile(value: string) {
    let number = parseInt(value.split('.')[0])
    assert(Number.isSafeInteger(number))
    return number
}
