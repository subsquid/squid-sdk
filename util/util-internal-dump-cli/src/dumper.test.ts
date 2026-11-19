import type {Range} from '@subsquid/util-internal-range'
import {describe, expect, it} from 'vitest'
import {Dumper, type DumperOptions} from './dumper'

interface TestBlock {
    hash: string
    number: number
}

class TestDumper extends Dumper<TestBlock> {
    constructor(private getHead: () => Promise<number>) {
        super()
    }

    protected options(): DumperOptions {
        return {
            endpoint: 'http://127.0.0.1:1',
            chunkSize: 1,
            topDirSize: 1,
            compression: 'gzip',
            metrics: 0,
        }
    }

    protected async *getBlocks(range: Range): AsyncIterable<TestBlock[]> {
        yield [{hash: '0x00', number: range.from}]
    }

    protected getLastFinalizedBlockNumber(): Promise<number> {
        return this.getHead()
    }

    protected getParentBlockHash(): string {
        return '0x00'
    }

    protected getBlockTimestamp(): number {
        return 0
    }

    async ingestFirstBatch(): Promise<void> {
        let batches: AsyncIterable<TestBlock[]> = (this as any).ingest()
        for await (let _ of batches) {
            break
        }
    }

    async scrape(): Promise<string> {
        let server = await this.prometheus().serve()
        try {
            let res = await fetch(`http://127.0.0.1:${server.port}/metrics`)
            return await res.text()
        } finally {
            await server.close()
        }
    }
}

describe('sqd_dump_chain_height', () => {
    it('does not hold the scrape while the head request is pending', async () => {
        let dumper = new TestDumper(() => new Promise(() => {}))

        let metrics = await dumper.scrape()

        expect(metrics).toMatch(/^sqd_dump_chain_height 0$/m)
    })

    it('reports the head polled by ingestion without requesting it again', async () => {
        let headRequests = 0
        let dumper = new TestDumper(async () => {
            headRequests += 1
            return 100
        })

        await dumper.ingestFirstBatch()
        let metrics = await dumper.scrape()

        expect(metrics).toMatch(/^sqd_dump_chain_height 100$/m)
        expect(headRequests).toBe(1)
    })
})

describe('getArchivedBlock', () => {
    class ArchiveDumper extends TestDumper {
        constructor(private dest?: string) {
            super(async () => 0)
        }

        protected options(): DumperOptions {
            return {...super.options(), dest: this.dest, topDirSize: 1000}
        }

        read(number: number): Promise<TestBlock | undefined> {
            return this.getArchivedBlock(number)
        }
    }

    async function makeArchive(): Promise<string> {
        let fs = await import('node:fs/promises')
        let os = await import('node:os')
        let path = await import('node:path')
        let zlib = await import('node:zlib')
        let dir = await fs.mkdtemp(path.join(os.tmpdir(), 'dump-cli-'))
        let chunk = path.join(dir, '0000000000', '0000000000-0000000002-0000beef')
        await fs.mkdir(chunk, {recursive: true})
        let lines = [0, 1, 2].map((n) => JSON.stringify({hash: `0x${n}000beef`, number: n, mark: `block ${n}`}))
        await fs.writeFile(path.join(chunk, 'blocks.jsonl.gz'), zlib.gzipSync(lines.join('\n') + '\n'))
        return dir
    }

    it('reads a block from the raw chunk that holds it', async () => {
        let dumper = new ArchiveDumper(await makeArchive())
        expect(await dumper.read(1)).toMatchObject({number: 1, mark: 'block 1'})
        expect(await dumper.read(2)).toMatchObject({number: 2, mark: 'block 2'})
    })

    it('gives undefined for a block the archive does not hold, or without a destination', async () => {
        expect(await new ArchiveDumper(await makeArchive()).read(5)).toBeUndefined()
        expect(await new ArchiveDumper().read(1)).toBeUndefined()
    })
})
