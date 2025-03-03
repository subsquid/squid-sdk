import {AsyncQueue, ensureError, last} from '@subsquid/util-internal'
import {BlockBatch, BlockRef, DataSourceStream} from '@subsquid/util-internal-data-source'
import {Rpc} from '../rpc'
import {Block} from '../types'
import {getBlockRef} from '../util'
import {IngestBatch} from './ingest'


class Finalizer {
    private current?: BlockRef
    private queue: BlockRef[] = []
    private checks = new AsyncQueue<null>(1)

    constructor(
        private rpc: Rpc,
        private output: AsyncQueue<BlockBatch<Block> | Error>
    ) {}

    private async finalizationLoop(): Promise<void> {
        for await (let _ of this.checks.iterate()) {
            while (this.queue.length > 0 && !this.output.isClosed()) {
                await this.probe()
            }
        }
    }

    private async probe(): Promise<void> {
        let probes = this.queue.splice(0, 10)

        let infos = await this.rpc.getBlockBatch(probes.map(ref => ref.number), {
            commitment: 'finalized',
            rewards: false,
            transactionDetails: 'none'
        })

        let i
        for (i = infos.length - 1; i >= 0; i--) {
            let ref = probes[i]
            if (this.current && this.current.number >= ref.number) {
                break
            }

            let info = infos[i]
            if (info == null) continue

            if (info.blockhash === ref.hash) {
                this.queue.unshift(...probes.slice(i + 1))
                this.current = ref
                return this.output.put({
                    blocks: [],
                    finalizedHead: ref
                })
            } else {
                probes.splice(i, 1)
            }
        }

        this.queue.unshift(...probes.slice(i + 1))
    }

    private async transformLoop(stream: AsyncIterable<IngestBatch>): Promise<void> {
        for await (let ingestBatch of stream) {
            let batch = this.visit(ingestBatch)
            await this.output.put(batch)
        }
    }

    private visit(batch: IngestBatch): BlockBatch<Block> {
        if (batch.finalized) {
            this.queue.length = 0
            this.current = getBlockRef(last(batch.blocks))
            return {
                blocks: batch.blocks,
                finalizedHead: batch.finalized
            }
        } else {
            for (let block of batch.blocks) {
                if (this.queue.length > 50) {
                    this.queue[this.queue.length - 1] = getBlockRef(block)
                } else {
                    this.queue.push(getBlockRef(block))
                }
            }
            this.checks.forcePut(null)
            return {
                blocks: batch.blocks
            }
        }
    }

    run(stream: AsyncIterable<IngestBatch>): void {
        this.transformLoop(stream).then(
            () => this.output.close(),
            err => {
                this.output.put(ensureError(err)).catch(() => {})
            }
        )

        this.finalizationLoop().then(
            () => {
                this.output.put(
                    new Error('finalization loop unexpectedly terminated')
                ).catch(() => {})
            },
            err => {
                this.output.put(ensureError(err)).catch(() => {})
            }
        )
    }
}


export async function* finalize(rpc: Rpc, stream: AsyncIterable<IngestBatch>): DataSourceStream<Block> {
    let output = new AsyncQueue<BlockBatch<Block> | Error>(1)

    new Finalizer(rpc, output).run(stream)

    for await (let item of output.iterate()) {
        if (item instanceof Error) {
            throw item
        } else {
            yield item
        }
    }
}
