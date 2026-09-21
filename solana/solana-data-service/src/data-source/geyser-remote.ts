import {IngestBatch} from '@subsquid/solana-rpc/lib/data-source/ingest'
import {Client, createWorker} from '@subsquid/util-internal-worker-thread'
import type {GeyserOptions} from './geyser-setup'


export class RemoteGeyser {
    private worker: Client

    constructor(options: GeyserOptions) {
        this.worker = createWorker({
            script: require.resolve('./geyser-worker'),
            args: options,
            name: 'geyser-worker'
        })
    }

    async *getStream(): AsyncIterable<IngestBatch> {
        let stream = await this.worker.call('getStream', [])
        yield* stream
    }

    close(): void {
        this.worker.close()
    }
}
