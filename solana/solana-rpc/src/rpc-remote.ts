import {redactRpcUrl, RpcClientOptions, RpcMetrics, RpcMetricsCollector, RpcMetricsSource} from '@subsquid/rpc-client'
import {GetBlock} from '@subsquid/solana-rpc-data'
import {Client, createWorker} from '@subsquid/util-internal-worker-thread'
import assert from 'node:assert'
import {Commitment, GetBlockOptions, LatestBlockhash, RpcApi} from './rpc'


export type RemoteRpcOptions = Pick<
    RpcClientOptions,
    'url' |
    'capacity' |
    'requestTimeout' |
    'retryAttempts' |
    'retrySchedule' |
    'headers'
> & {
    /**
     * Remove vote transactions from all relevant responses
     */
    noVotes?: boolean
}


export class RemoteRpc implements RpcApi, RpcMetricsSource {
    private worker: Client

    constructor(options: RemoteRpcOptions) {
        this.worker = createWorker({
            script: require.resolve('./rpc-worker'),
            args: options,
            name: 'rpc-worker'
        })
    }

    getLatestBlockhash(commitment: Commitment, minContextSlot?: number): Promise<LatestBlockhash> {
        return this.worker.call('getLatestBlockhash', [commitment, minContextSlot])
    }

    getBlocks(commitment: Commitment, startSlot: number, endSlot: number): Promise<number[]> {
        return this.worker.call('getBlocks', [commitment, startSlot, endSlot])
    }

    getBlock(slot: number, options?: GetBlockOptions): Promise<GetBlock | 'skipped' | null | undefined> {
        return this.worker.call('getBlock', [slot, options])
    }

    getBlockBatch(slots: number[], options?: GetBlockOptions): Promise<(GetBlock | 'skipped' | null | undefined)[]> {
        return this.worker.call('getBlockBatch', [slots, options])
    }

    /** Metrics of the RPC client inside the worker thread. */
    getRpcMetrics(): Promise<RpcMetrics> {
        return this.worker.call('getRpcMetrics', [])
    }

    close(): void {
        this.worker.close()
    }
}


export class RemoteRpcPool implements RpcApi, RpcMetricsSource {
    private workers: RemoteRpc[] = []
    private turn = 0
    private metrics = new RpcMetricsCollector()
    private url: string

    constructor(workers: number, workerOptions: RemoteRpcOptions) {
        assert(workers > 0)
        // the label the workers' clients use: normalized, with credentials removed
        this.url = redactRpcUrl(workerOptions.url)
        for (let i = 0; i < workers; i++) {
            let worker = new RemoteRpc(workerOptions)
            this.workers.push(worker)
            this.metrics.add(worker)
        }
    }

    /**
     * Metrics of all the pool's RPC clients combined. They live in worker threads, so this is what
     * a metrics exporter has to read: a client created next to the pool sees none of its requests.
     */
    async getRpcMetrics(): Promise<RpcMetrics> {
        // All workers share one endpoint, so the collector yields at most one entry.
        let [merged] = await this.metrics.collect()
        return (
            merged ?? {
                url: this.url,
                requestsServed: 0,
                connectionErrors: 0,
                notificationsReceived: 0,
                avg_response_time: 0,
                avgResponseTime: 0,
                retriedErrors: {},
            }
        )
    }

    getLatestBlockhash(commitment: Commitment, minContextSlot?: number): Promise<LatestBlockhash> {
        return this.next().getLatestBlockhash(commitment, minContextSlot)
    }

    getBlocks(commitment: Commitment, startSlot: number, endSlot: number): Promise<number[]> {
        return this.next().getBlocks(commitment, startSlot, endSlot)
    }

    getBlock(slot: number, options?: GetBlockOptions): Promise<GetBlock | 'skipped' | null | undefined> {
        return this.next().getBlock(slot, options)
    }

    getBlockBatch(slots: number[], options?: GetBlockOptions): Promise<(GetBlock | 'skipped' | null | undefined)[]> {
        return this.next().getBlockBatch(slots, options)
    }

    private next(): RemoteRpc {
        return this.workers[(this.turn += 1) % this.workers.length]
    }

    close() {
        for (let worker of this.workers) {
            worker.close()
        }
    }
}
