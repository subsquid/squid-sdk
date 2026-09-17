import {Fs, LocalFs} from '@subsquid/util-internal-fs'
import {createHash} from 'crypto'
import {mkdtemp, readdir, readFile, rm, stat, unlink, writeFile} from 'fs/promises'
import {tmpdir} from 'os'
import path from 'path'
import type {Readable} from 'stream'
import {gunzipSync, zstdCompressSync} from 'zlib'
import {afterEach, beforeEach, describe, expect, it} from 'vitest'
import {Compression, getBlocksFileName} from './compression'
import {ArchiveLayout} from './layout'


interface TestBlock {
    hash: string
    number: number
    parentNumber: number
    payload: string
}


function makeBlock(n: number): TestBlock {
    return {
        hash: '0x' + n.toString(16).padStart(64, '0'),
        number: n,
        parentNumber: n - 1,
        payload: randomHex(`${n}`, 16)
    }
}


// incompressible enough that a few hundred blocks span several chunks
function randomHex(seed: string, hashes: number): string {
    let parts = []
    for (let i = 0; i < hashes; i++) {
        parts.push(createHash('sha256').update(`${seed}-${i}`).digest('hex'))
    }
    return parts.join('')
}


function makeBlocks(from: number, to: number): TestBlock[] {
    let blocks = []
    for (let n = from; n <= to; n++) {
        blocks.push(makeBlock(n))
    }
    return blocks
}


async function writeBlocks(
    layout: ArchiveLayout,
    to: number,
    compression: Compression,
    chunkSize = 64 * 1024
): Promise<void> {
    await layout.appendRawBlocks({
        blocks: async function* (nextBlock) {
            for (let n = nextBlock; n <= to; n++) {
                yield [makeBlock(n)]
            }
        },
        range: {from: 0, to},
        chunkSize,
        compression
    })
}


async function readBlocks(layout: ArchiveLayout, range?: {from: number, to?: number}): Promise<TestBlock[]> {
    let blocks: TestBlock[] = []
    for await (let batch of layout.getRawBlocks<any>(range)) {
        blocks.push(...batch)
    }
    return blocks
}


async function listBlockFiles(root: string): Promise<string[]> {
    let files: string[] = []
    for (let top of (await readdir(root)).filter(item => /^\d+$/.test(item)).sort()) {
        for (let chunk of (await readdir(path.join(root, top))).sort()) {
            for (let file of await readdir(path.join(root, top, chunk))) {
                files.push(path.join(root, top, chunk, file))
            }
        }
    }
    return files
}


class HookedFs implements Fs {
    constructor(
        private inner: Fs,
        private onReadStream: (abs: string) => Promise<void>
    ) {}

    cd(...path: string[]): Fs {
        return new HookedFs(this.inner.cd(...path), this.onReadStream)
    }

    abs(...path: string[]): string {
        return this.inner.abs(...path)
    }

    ls(...path: string[]): Promise<string[]> {
        return this.inner.ls(...path)
    }

    transactDir(path: string, cb: (fs: Fs) => Promise<void>): Promise<void> {
        return this.inner.transactDir(path, cb)
    }

    write(path: string, content: Readable | Uint8Array | string): Promise<void> {
        return this.inner.write(path, content)
    }

    delete(path: string): Promise<void> {
        return this.inner.delete(path)
    }

    async readStream(path: string): Promise<Readable> {
        await this.onReadStream(this.inner.abs(path))
        return this.inner.readStream(path)
    }

    readFile(path: string): Promise<Uint8Array>
    readFile(path: string, encoding: BufferEncoding): Promise<string>
    readFile(path: string, encoding?: BufferEncoding): Promise<any> {
        return this.inner.readFile(path, encoding as BufferEncoding)
    }
}


describe('ArchiveLayout compression', () => {
    let root: string

    beforeEach(async () => {
        root = await mkdtemp(path.join(tmpdir(), 'archive-layout-'))
    })

    afterEach(async () => {
        await rm(root, {recursive: true, force: true})
    })

    it('resumes and reads across gzip/zstd switches', async () => {
        let layout = new ArchiveLayout(new LocalFs(root))

        await writeBlocks(layout, 299, 'gzip')
        await writeBlocks(layout, 599, 'zstd')
        await writeBlocks(layout, 899, 'gzip')

        let files = await listBlockFiles(root)
        expect(files.some(f => f.endsWith(getBlocksFileName('gzip')))).toBe(true)
        expect(files.some(f => f.endsWith(getBlocksFileName('zstd')))).toBe(true)

        expect(await readBlocks(new ArchiveLayout(new LocalFs(root)))).toEqual(makeBlocks(0, 899))
        expect(await readBlocks(new ArchiveLayout(new LocalFs(root)), {from: 250, to: 650})).toEqual(makeBlocks(250, 650))
    })

    it('cuts zstd chunks by compressed size', async () => {
        let chunkSize = 64 * 1024
        let layout = new ArchiveLayout(new LocalFs(root))

        await writeBlocks(layout, 1999, 'zstd', chunkSize)

        let files = await listBlockFiles(root)
        expect(files.length).toBeGreaterThan(3)
        for (let file of files) {
            expect(file.endsWith(getBlocksFileName('zstd'))).toBe(true)
            expect((await stat(file)).size).toBeLessThan(chunkSize * 2)
        }
        expect(await readBlocks(layout)).toEqual(makeBlocks(0, 1999))
    })

    it('reads a chunk whose .gz was replaced by .zst between two reads', async () => {
        let writer = new ArchiveLayout(new LocalFs(root))
        await writeBlocks(writer, 299, 'zstd')
        await writeBlocks(writer, 599, 'gzip')

        let replaced = 0
        let fs = new HookedFs(new LocalFs(root), async abs => {
            if (!abs.endsWith(getBlocksFileName('gzip'))) return
            let gzip = await readFile(abs)
            await writeFile(abs.replace(/\.gz$/, '.zst'), zstdCompressSync(gunzipSync(gzip)))
            await unlink(abs)
            replaced += 1
        })

        expect(await readBlocks(new ArchiveLayout(fs))).toEqual(makeBlocks(0, 599))
        expect(replaced).toBeGreaterThan(0)
    })

    it('fails on a truncated zstd chunk', async () => {
        let layout = new ArchiveLayout(new LocalFs(root))
        await writeBlocks(layout, 599, 'zstd')

        let file = (await listBlockFiles(root))[1]
        let content = await readFile(file)
        await writeFile(file, content.subarray(0, content.length - 16))

        await expect(readBlocks(new ArchiveLayout(new LocalFs(root)))).rejects.toThrow()
    })

    it('fails on a chunk without blocks file', async () => {
        let layout = new ArchiveLayout(new LocalFs(root))
        await writeBlocks(layout, 599, 'zstd')

        await unlink((await listBlockFiles(root))[1])

        await expect(readBlocks(new ArchiveLayout(new LocalFs(root)))).rejects.toThrow(/neither/)
    })
})
