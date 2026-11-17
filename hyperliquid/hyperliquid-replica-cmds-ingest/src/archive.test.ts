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


describe('HyperliquidArchive.getRawChunks', () => {
    // two sessions, several date folders each; file N holds blocks N+1..N+10
    const TREE: Record<string, Record<string, string[]>> = {
        's1': {'d1': ['0.lz4', '10.lz4'], 'd2': ['30.lz4', '20.lz4'], 'd3': ['40.lz4']},
        's2': {'d3': ['50.lz4'], 'd4': ['60.lz4', '70.lz4'], 'd5': ['80.lz4', '90.lz4']}
    }

    function fakeFs() {
        let active = 0
        let maxActive = 0
        let fs = {
            async ls(...path: string[]) {
                active += 1
                maxActive = Math.max(maxActive, active)
                // later folders answer sooner, so results arrive out of order
                await new Promise(r => setTimeout(r, 30 - path.join('').length * 3))
                active -= 1
                if (path.length == 0) return Object.keys(TREE)
                if (path.length == 1) return Object.keys(TREE[path[0]])
                return TREE[path[0]][path[1]]
            }
        }
        return {fs, stats: () => maxActive}
    }

    async function chunks(from: number, to: number) {
        let {fs, stats} = fakeFs()
        let a = new HyperliquidArchive(fs as any, createLogger('test'))
        let out = []
        for await (let c of (a as any).getRawChunks({from, to})) out.push(`${c.top}/${c.subfolder}/${c.filename}`)
        return {out, maxActive: stats()}
    }

    it('starts at the file holding the first block and keeps folder order', async () => {
        let {out, maxActive} = await chunks(35, 75)
        expect(out).toEqual(['s1/d2/30.lz4', 's1/d3/40.lz4', 's2/d3/50.lz4', 's2/d4/60.lz4', 's2/d4/70.lz4'])
        expect(maxActive).toBeGreaterThan(1)
    })

    it('starts at a file boundary', async () => {
        let {out} = await chunks(21, 30)
        expect(out).toEqual(['s1/d2/20.lz4'])
    })

    it('runs to the last file of an open range', async () => {
        let {out} = await chunks(85, Infinity)
        expect(out).toEqual(['s2/d5/80.lz4', 's2/d5/90.lz4'])
    })
})
