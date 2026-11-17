import {createLogger} from '@subsquid/logger'
import * as lz4 from 'lz4'
import {PassThrough, Readable} from 'stream'
import {describe, expect, it} from 'vitest'
import {HyperliquidArchive} from './archive'


const LINES = Array.from({length: 2000}, (_, i) => `{"line":${i}}`)
const FILE: Buffer = lz4.encode(Buffer.from(LINES.join('\n') + '\n'))


function archive(readStream: (path: string) => Promise<Readable>) {
    return new HyperliquidArchive({} as any, createLogger('test'), readStream)
}


function readFile(a: HyperliquidArchive): AsyncIterable<Buffer> {
    return (a as any).readFile('top/sub/1.lz4')
}


describe('HyperliquidArchive.readFile', () => {
    it('splits the decoded file into lines', async () => {
        let out = []
        for await (let line of readFile(archive(async () => Readable.from([FILE])))) out.push(line.toString())
        expect(out).toEqual(LINES)
    })

    it('rejects the iteration when the source stream fails', async () => {
        let source = new PassThrough()
        source.write(FILE.subarray(0, 100))
        setTimeout(() => source.destroy(new Error('range failed after retries')), 20)
        let read = async () => {
            for await (let _ of readFile(archive(async () => source))) {}
        }
        await expect(read()).rejects.toThrow('range failed after retries')
    })

    it('destroys the source when the reader stops early', async () => {
        let source = new PassThrough()
        source.write(FILE)
        for await (let _ of readFile(archive(async () => source))) break
        expect(source.destroyed).toBe(true)
    })
})
