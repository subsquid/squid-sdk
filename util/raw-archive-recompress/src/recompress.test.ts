import {ArchiveLayout, Compression, getBlocksFileName} from '@subsquid/util-internal-archive-layout'
import {LocalFs} from '@subsquid/util-internal-fs'
import {createHash} from 'crypto'
import {mkdtemp, readdir, readFile, rename, rm, writeFile} from 'fs/promises'
import {tmpdir} from 'os'
import path from 'path'
import {gunzipSync, zstdCompressSync} from 'zlib'
import {afterEach, beforeEach, describe, expect, it} from 'vitest'
import {convert, getStatus} from './recompress'


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
})
