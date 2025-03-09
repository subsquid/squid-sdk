import {Block, BlockRef, BlockStream, DataSource, StreamRequest} from '@subsquid/util-internal-data-service'
import {Client, createWorker} from '@subsquid/util-internal-worker-thread'
import {DataSourceOptions} from './setup'


export class WorkerClient implements DataSource<Block> {
    private worker: Client

    constructor(private options: DataSourceOptions) {
        this.worker = createWorker({
            script: require.resolve('./worker'),
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
