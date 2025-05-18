import {Commitment, GetBlockOptions, LatestBlockhash, RpcApi} from '@subsquid/solana-rpc'
import {GetBlock} from '@subsquid/solana-rpc-data'
import {Client, createWorker} from '@subsquid/util-internal-worker-thread'
import assert from 'node:assert'


export class RemoteRpc implements RpcApi {
    private worker: Client

    constructor(url: string) {
        this.worker = createWorker({
            script: require.resolve('./rpc-worker'),
            args: url,
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

    close(): void {
        this.worker.close()
    }
}


export class RemoteRpcPool implements RpcApi {
    private workers: RemoteRpc[] = []
    private turn = 0

    constructor(workers: number, url: string) {
        assert(workers > 0)
        for (let i = 0; i < workers; i++) {
            this.workers.push(new RemoteRpc(url))
        }
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
