import { AsyncQueue, ensureError, last, wait } from '@subsquid/util-internal'
import { BlockBatch, BlockRef, BlockStream } from '@subsquid/util-internal-data-source'
import { Rpc } from '../rpc'
import { Block } from '../types'
import { getBlockRef } from '../util'
import { IngestBatch } from './ingest'

class Finalizer {
    private current?: BlockRef
    private queue: BlockRef[] = []
    private checks = new AsyncQueue<null>(1)
    private lastRequestTime = 0

    constructor(
        private rpc: Rpc,
        private output: AsyncQueue<BlockBatch<Block> | Error>,
    ) {}

    private async finalizationLoop(): Promise<void> {
        for await (const _ of this.checks.iterate()) {
            while (this.queue.length > 0 && !this.output.isClosed()) {
                await this.probeRateLimit()
                await this.probe()
            }
        }
    }

    private async probeRateLimit(): Promise<void> {
        const pause = 500 - Date.now() + this.lastRequestTime
        if (pause > 0) {
            await wait(pause)
        }
        this.lastRequestTime = Date.now()
    }

    private async probe(): Promise<void> {
        const probes = this.queue.splice(0, 5)

        const infos = await this.rpc.getFinalizedBlockBatch(probes.map((ref) => ref.number))
        let i
        for (i = infos.length - 1; i >= 0; i--) {
            const ref = probes[i]
            if (this.current && this.current.number >= ref.number) {
                break
            }

            const info = infos[i]
            if (info == null) continue

            if (info.hash === ref.hash) {
                this.unshift(probes.slice(i + 1))
                this.current = ref
                return this.output.put({
                    blocks: [],
                    finalizedHead: ref,
                })
            } else {
                probes.splice(i, 1)
            }
        }

        this.unshift(probes.slice(i + 1))
    }

    private unshift(probes: BlockRef[]): void {
        if (probes.length == 0) {
            this.lastRequestTime = 0
        } else {
            this.queue.unshift(...probes)
        }
    }

    private async transformLoop(stream: AsyncIterable<IngestBatch>): Promise<void> {
        for await (const ingestBatch of stream) {
            const batch = this.visit(ingestBatch)
            await this.output.put(batch)
        }
    }

    private visit(batch: IngestBatch): BlockBatch<Block> {
        if (batch.finalized) {
            this.queue.length = 0
            this.current = getBlockRef(last(batch.blocks))
            return {
                blocks: batch.blocks,
                finalizedHead: batch.finalized,
            }
        } else {
            for (const block of batch.blocks) {
                if (this.queue.length > 50) {
                    this.queue[this.queue.length - 1] = getBlockRef(block)
                } else {
                    this.queue.push(getBlockRef(block))
                }
            }
            this.checks.forcePut(null)
            return {
                blocks: batch.blocks,
            }
        }
    }

    run(stream: AsyncIterable<IngestBatch>): void {
        this.transformLoop(stream).then(
            () => this.output.close(),
            (err) => {
                this.output.put(ensureError(err)).catch(() => {})
            },
        )

        this.finalizationLoop().then(
            () => {
                this.output.put(new Error('finalization loop unexpectedly terminated')).catch(() => {})
            },
            (err) => {
                this.output.put(ensureError(err)).catch(() => {})
            },
        )
    }
}

export async function* finalize(
    rpc: Rpc,
    stream: AsyncIterable<IngestBatch>,
): BlockStream<Block> {
    const output = new AsyncQueue<BlockBatch<Block> | Error>(1)

    new Finalizer(rpc, output).run(stream)

    for await (const item of output.iterate()) {
        if (item instanceof Error) {
            throw item
        } else {
            yield item
        }
    }
}
