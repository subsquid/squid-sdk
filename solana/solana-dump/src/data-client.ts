import {Block} from '@subsquid/solana-rpc'
import {BlockRef, BlockStream, StreamRequest} from '@subsquid/util-internal-data-source'
import {Client, createWorker} from '@subsquid/util-internal-worker-thread'
import {Options} from './dumper'


export class DataWorker {
    private worker: Client

    constructor(options: Options) {
        this.worker = createWorker({
            script: require.resolve('./data-worker'),
            args: options,
            name: 'data-worker'
        })
    }

    close(): void {
        this.worker.close()
    }

    getFinalizedHead(): Promise<BlockRef> {
        return this.worker.call('getFinalizedHead', [])
    }

    getFinalizedStream(req: StreamRequest): BlockStream<Block> {
        return this.stream('getFinalizedStream', req)
    }

    getStream(req: StreamRequest): BlockStream<Block> {
        return this.stream('getStream', req)
    }

    private async *stream(method: string, req: StreamRequest): BlockStream<Block> {
        let stream: BlockStream<Block> = await this.worker.call(method, [req])
        yield* stream
    }
}
