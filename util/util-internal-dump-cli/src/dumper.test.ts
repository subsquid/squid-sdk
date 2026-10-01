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
