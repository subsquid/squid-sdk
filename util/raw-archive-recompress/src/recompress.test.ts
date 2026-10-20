import {ArchiveLayout, Compression, getBlocksFileName} from '@subsquid/util-internal-archive-layout'
import {LocalFs} from '@subsquid/util-internal-fs'
import {createHash} from 'crypto'
import {once} from 'events'
import {mkdtemp, readdir, readFile, rename, rm, writeFile} from 'fs/promises'
import {tmpdir} from 'os'
import path from 'path'
import {setTimeout as sleep} from 'timers/promises'
import {createGzip, gunzipSync, zstdCompressSync} from 'zlib'
import {afterEach, beforeEach, describe, expect, it} from 'vitest'
import {BlockRefScanner, convert, forEachDescending, getStatus} from './recompress'


function makeBlock(n: number) {
    return {
        hash: '0x' + createHash('sha256').update(String(n)).digest('hex'),
        number: n,
        parentNumber: n - 1,
        payload: Array.from({length: 16}, (_, i) => createHash('sha256').update(`${n}-${i}`).digest('hex')).join('')
    }
}


async function writeBlocks(root: string, to: number, compression: Compression): Promise<void> {
    await new ArchiveLayout(new LocalFs(root)).appendRawBlocks({
        blocks: async function* (nextBlock) {
            for (let n = nextBlock; n <= to; n++) {
                yield [makeBlock(n)]
            }
        },
        range: {from: 0, to},
        chunkSize: 32 * 1024,
        compression
    })
}


async function readBlocks(root: string) {
    let blocks: any[] = []
    for await (let batch of new ArchiveLayout(new LocalFs(root)).getRawBlocks()) {
        blocks.push(...batch)
    }
    return blocks
}


async function listChunkDirs(root: string): Promise<string[]> {
    let dirs: string[] = []
    for (let top of (await readdir(root)).filter(item => /^\d+$/.test(item)).sort()) {
        for (let chunk of (await readdir(path.join(root, top))).sort()) {
            dirs.push(path.join(root, top, chunk))
        }
    }
    return dirs
}


async function countFiles(root: string, compression: Compression): Promise<number> {
    let count = 0
    for (let dir of await listChunkDirs(root)) {
        if ((await readdir(dir)).includes(getBlocksFileName(compression))) {
            count += 1
        }
    }
    return count
}


describe('raw-archive-recompress', () => {
    let root: string
    let layout: () => ArchiveLayout

    beforeEach(async () => {
        root = await mkdtemp(path.join(tmpdir(), 'raw-archive-recompress-'))
        layout = () => new ArchiveLayout(new LocalFs(root))
    })

    afterEach(async () => {
        await rm(root, {recursive: true, force: true})
    })

    it('reports an empty archive', async () => {
        expect(await getStatus(layout())).toEqual({chunks: 0, newest: undefined})
    })

    it('reports an all-gzip archive and refuses to convert it', async () => {
        await writeBlocks(root, 999, 'gzip')

        let status = await getStatus(layout())
        expect(status.newest).toBe('gzip')
        expect(status.firstZstdChunk).toBeUndefined()

        await expect(convert(layout())).rejects.toThrow(/not zstd/)
        expect(await countFiles(root, 'zstd')).toBe(0)
    })

    it('reports an all-zstd archive', async () => {
        await writeBlocks(root, 999, 'zstd')

        let status = await getStatus(layout())
        expect(status.newest).toBe('zstd')
        expect(status.gzipChunks).toBe(0)
        expect(status.firstZstdChunk?.from).toBe(0)
    })

    it('reports and converts a mixed archive', async () => {
        await writeBlocks(root, 999, 'gzip')
        let gzipChunks = await countFiles(root, 'gzip')
        await writeBlocks(root, 1999, 'zstd')

        let status = await getStatus(layout())
        expect(status.newest).toBe('zstd')
        expect(status.gzipChunks).toBe(gzipChunks)
        expect(status.firstZstdChunk?.from).toBe(1000)

        let result = await convert(layout())
        expect(result.chunks).toBe(gzipChunks)
        expect(result.zstdBytes).toBeLessThan(result.gzipBytes)
        expect(await countFiles(root, 'gzip')).toBe(0)
        expect((await getStatus(layout())).gzipChunks).toBe(0)
        expect(await readBlocks(root)).toEqual(Array.from({length: 2000}, (_, n) => makeBlock(n)))

        expect((await convert(layout())).chunks).toBe(0)
    })

    it('stops at --from and resumes from the new boundary', async () => {
        await writeBlocks(root, 999, 'gzip')
        await writeBlocks(root, 1999, 'zstd')
        let total = (await getStatus(layout())).gzipChunks!

        let partial = await convert(layout(), {from: 500})
        expect(partial.chunks).toBeGreaterThan(0)
        expect(partial.chunks).toBeLessThan(total)
        expect((await getStatus(layout())).gzipChunks).toBe(total - partial.chunks)

        let rest = await convert(layout())
        expect(rest.chunks).toBe(total - partial.chunks)
        expect(await countFiles(root, 'gzip')).toBe(0)
    })

    it('deletes a .gz left next to the .zst by an interrupted conversion', async () => {
        await writeBlocks(root, 999, 'gzip')
        await writeBlocks(root, 1999, 'zstd')

        let gzipChunks = (await getStatus(layout())).gzipChunks!
        let interrupted = (await listChunkDirs(root))[gzipChunks - 1]
        let gzip = await readFile(path.join(interrupted, getBlocksFileName('gzip')))
        await writeFile(path.join(interrupted, getBlocksFileName('zstd')), zstdCompressSync(gunzipSync(gzip)))

        let result = await convert(layout())
        expect(result.chunks).toBe(gzipChunks - 1)
        expect(await readdir(interrupted)).toEqual([getBlocksFileName('zstd')])
        expect(await countFiles(root, 'gzip')).toBe(0)
    })

    it('leaves a chunk untouched when its content does not match its name', async () => {
        await writeBlocks(root, 999, 'gzip')
        await writeBlocks(root, 1999, 'zstd')

        let gzipChunks = (await getStatus(layout())).gzipChunks!
        let victim = (await listChunkDirs(root))[gzipChunks - 1]
        let renamed = victim.replace(/-[0-9a-z]+$/, '-deadbeef')
        await rename(victim, renamed)

        await expect(convert(layout())).rejects.toThrow(/does not match/)
        expect(await readdir(renamed)).toEqual([getBlocksFileName('gzip')])
    })

    it('splits the archive between --to and --from without gaps or overlaps', async () => {
        await writeBlocks(root, 2999, 'gzip')
        let gzipChunks = await countFiles(root, 'gzip')
        await writeBlocks(root, 3499, 'zstd')

        // The lower range is the larger one and goes first: a boundary search over the whole archive
        // would now land in its zstd run and skip the gzip chunks of the upper range.
        let lower = await convert(layout(), {to: 2000, resumeWindow: 2})
        expect(lower.chunks).toBeGreaterThan(0)
        expect((await getStatus(layout(), {to: 2000})).gzipChunks).toBe(0)

        let upper = await convert(layout(), {from: 2000, resumeWindow: 2})
        expect(upper.chunks).toBeGreaterThan(0)
        expect(lower.chunks + upper.chunks).toBe(gzipChunks)
        expect(await countFiles(root, 'gzip')).toBe(0)
        expect((await convert(layout())).chunks).toBe(0)
        expect(await readBlocks(root)).toEqual(Array.from({length: 3500}, (_, n) => makeBlock(n)))
    })

    it('converts with several workers', async () => {
        await writeBlocks(root, 1999, 'gzip')
        let gzipChunks = await countFiles(root, 'gzip')
        await writeBlocks(root, 2999, 'zstd')

        let result = await convert(layout(), {concurrency: 8})
        expect(result.chunks).toBe(gzipChunks)
        expect(await countFiles(root, 'gzip')).toBe(0)
        expect(await readBlocks(root)).toEqual(Array.from({length: 3000}, (_, n) => makeBlock(n)))
    })

    it('resumes over zstd chunks left below gzip ones by interrupted workers', async () => {
        await writeBlocks(root, 999, 'gzip')
        let gzipChunks = await countFiles(root, 'gzip')
        await writeBlocks(root, 1999, 'zstd')

        let dirs = await listChunkDirs(root)
        let converted = [gzipChunks - 2, gzipChunks - 4, gzipChunks - 5]
        for (let i of converted) {
            let gzipFile = path.join(dirs[i], getBlocksFileName('gzip'))
            await writeFile(path.join(dirs[i], getBlocksFileName('zstd')), zstdCompressSync(gunzipSync(await readFile(gzipFile))))
            await rm(gzipFile)
        }

        // the boundary lands on one of the converted chunks; only the window above it reaches the gzip ones there
        let result = await convert(layout(), {concurrency: 2, resumeWindow: 5})
        expect(result.chunks).toBe(gzipChunks - converted.length)
        expect(await countFiles(root, 'gzip')).toBe(0)
        expect(await readBlocks(root)).toEqual(Array.from({length: 2000}, (_, n) => makeBlock(n)))
    })

    it('stops taking chunks after a worker fails', async () => {
        await writeBlocks(root, 1999, 'gzip')
        await writeBlocks(root, 2999, 'zstd')

        let gzipChunks = (await getStatus(layout())).gzipChunks!
        let victim = (await listChunkDirs(root))[gzipChunks - 1]
        await rename(victim, victim.replace(/-[0-9a-z]+$/, '-deadbeef'))

        await expect(convert(layout(), {concurrency: 4})).rejects.toThrow(/does not match/)
        expect(await countFiles(root, 'gzip')).toBeGreaterThan(gzipChunks / 2)
    })
})


describe('BlockRefScanner', () => {
    function scan(...parts: string[]) {
        let scanner = new BlockRefScanner()
        for (let part of parts) {
            let buf = Buffer.from(part)
            scanner.write(buf, 0, buf.length)
        }
        return scanner.ref()
    }

    it('reads hash and number from the top level', () => {
        expect(scan('{"hash":"0xabc","number":42,"rest":[1,2]}')).toEqual({hash: '0xabc', number: 42})
    })

    it('reads a hex number', () => {
        expect(scan('{"hash":"0xabc","number":"0x2a"}')).toEqual({hash: '0xabc', number: 42})
    })

    it('falls back to height', () => {
        expect(scan('{"hash":"0xabc","height":7}')).toEqual({hash: '0xabc', number: 7})
    })

    it('ignores hash and number nested in other fields', () => {
        let line = '{"parent":{"hash":"0xdeep","number":1},"txs":[{"hash":"0xtx"}],"hash":"0xreal","number":9}'
        expect(scan(line)).toEqual({hash: '0xreal', number: 9})
    })

    it('is not confused by braces and quotes inside strings', () => {
        expect(scan('{"note":"{\\"hash\\":\\"0xfake\\"}","hash":"0xreal","number":3}'))
            .toEqual({hash: '0xreal', number: 3})
    })

    it('reads fields split across writes', () => {
        expect(scan('{"ha', 'sh":"0xab', 'c","numb', 'er":1', '23}')).toEqual({hash: '0xabc', number: 123})
    })

    it('reports a field it never saw', () => {
        expect(scan('{"number":5}')).toEqual({hash: undefined, number: 5})
    })

    it('stops reading once hash and number are known', () => {
        let scanner = new BlockRefScanner()
        let head = Buffer.from('{"hash":"0xabc","number":1,"fat":"')
        scanner.write(head, 0, head.length)
        expect(scanner.done).toBe(true)

        // whatever follows cannot change the answer, so the rest of a 562 MB block is skipped
        let tail = Buffer.from('","hash":"0xlater"}')
        scanner.write(tail, 0, tail.length)
        expect(scanner.ref()).toEqual({hash: '0xabc', number: 1})
    })
})


describe('a block larger than the maximum string', () => {
    let root: string
    let layout: () => ArchiveLayout

    // Node cannot hold 0x1fffffe8 characters in one string, and one base-sepolia block
    // is 562 MB. Reading the last block by parsing its line left those chunks
    // unconvertible, so the payload here is built past that limit on purpose.
    const MAX_STRING_LENGTH = 0x1fffffe8
    const PAD = MAX_STRING_LENGTH + 16 * 1024 * 1024

    beforeEach(async () => {
        root = await mkdtemp(path.join(tmpdir(), 'raw-archive-recompress-'))
        layout = () => new ArchiveLayout(new LocalFs(root))
    })

    afterEach(async () => {
        await rm(root, {recursive: true, force: true})
    })

    /** One block whose padding runs past the string limit, gzipped without ever being a string. */
    async function fatBlock(number: number, hash: string): Promise<{gzip: Buffer; rawBytes: number}> {
        let gzip = createGzip()
        let parts: Buffer[] = []
        let rawBytes = 0
        gzip.on('data', (d: Buffer) => parts.push(d))
        let done = once(gzip, 'end')

        let write = async (part: Buffer) => {
            rawBytes += part.length
            if (!gzip.write(part)) await once(gzip, 'drain')
        }

        await write(Buffer.from(`{"hash":"${hash}","number":${number},"fat":"`))
        let pad = Buffer.alloc(1024 * 1024, 0x78)
        for (let written = 0; written < PAD; written += pad.length) {
            await write(pad)
        }
        rawBytes += 3
        gzip.end(Buffer.from('"}\n'))

        await done
        return {gzip: Buffer.concat(parts), rawBytes}
    }

    async function makeFatChunk(): Promise<string> {
        let dir = (await listChunkDirs(root))[0]
        let [, to, short] = path.basename(dir).split('-')
        // checkShorHashMatch accepts a full hash ending with the chunk's short one
        let hash = '0x' + 'a'.repeat(56) + short
        let {gzip, rawBytes} = await fatBlock(Number(to), hash)

        // guards the point of these tests: a shorter line would pass on the old code too
        expect(rawBytes).toBeGreaterThan(MAX_STRING_LENGTH)

        await writeFile(path.join(dir, getBlocksFileName('gzip')), gzip)
        return dir
    }

    it('converts it', async () => {
        await writeBlocks(root, 99, 'gzip')
        await writeBlocks(root, 199, 'zstd')
        let dir = await makeFatChunk()

        let gzipChunks = (await getStatus(layout())).gzipChunks!
        expect((await convert(layout())).chunks).toBe(gzipChunks)
        expect(await readdir(dir)).toEqual([getBlocksFileName('zstd')])
        expect(await countFiles(root, 'gzip')).toBe(0)
    }, 600_000)

    it('still refuses it when the last block does not match the chunk name', async () => {
        await writeBlocks(root, 99, 'gzip')
        await writeBlocks(root, 199, 'zstd')
        let dir = await makeFatChunk()
        let renamed = dir.replace(/-[0-9a-z]+$/, '-deadbeef')
        await rename(dir, renamed)

        await expect(convert(layout())).rejects.toThrow(/does not match/)
        expect(await readdir(renamed)).toEqual([getBlocksFileName('gzip')])
    }, 600_000)
})


describe('forEachDescending', () => {
    it('visits every index once, newest first per worker', async () => {
        let visited: number[] = []
        await forEachDescending(99, 7, 16, async i => {
            await sleep(i % 3)
            visited.push(i)
        })
        expect(visited.slice().sort((a, b) => a - b)).toEqual(Array.from({length: 100}, (_, i) => i))
    })

    it('never takes an index a window or more below the highest unfinished one', async () => {
        let unfinished = new Set<number>()
        let maxGap = 0
        await forEachDescending(63, 4, 5, async i => {
            unfinished.add(i)
            maxGap = Math.max(maxGap, Math.max(...unfinished) - i)
            // the newest index is slow, so the others would run far ahead without the window
            await sleep(i == 63 ? 50 : 1)
            unfinished.delete(i)
        })
        expect(maxGap).toBeLessThan(5)
    })

    it('does nothing for an empty range', async () => {
        let calls = 0
        await forEachDescending(-1, 4, 16, async () => {
            calls += 1
        })
        expect(calls).toBe(0)
    })
})
