import {BlockRef, BlockStream, DataSource, StreamRequest} from '@subsquid/util-internal-data-service'
import {Client, getServer} from '@subsquid/util-internal-worker-thread'


export function startServer(source: DataSource<any>): void {
    getServer()
        .def('getFinalizedHead', () => source.getFinalizedHead())
        .def('getFinalizedStream', (req: StreamRequest) => source.getFinalizedStream(req))
        .def('getStream', (req: StreamRequest) => source.getStream(req))
        .start()
}


export class RemoteDataSource<B> implements DataSource<B> {
    constructor(private worker: Client) {}

    close(): void {
        this.worker.close()
    }

    getFinalizedHead(): Promise<BlockRef> {
        return this.worker.call('getFinalizedHead', [])
    }

    getFinalizedStream(req: StreamRequest): BlockStream<B> {
        return this.stream('getFinalizedStream', req)
    }

    getStream(req: StreamRequest): BlockStream<B> {
        return this.stream('getStream', req)
    }

    private async *stream(method: string, req: StreamRequest): BlockStream<B> {
        let stream: BlockStream<B> = await this.worker.call(method, [req])
        yield* stream
    }
}
