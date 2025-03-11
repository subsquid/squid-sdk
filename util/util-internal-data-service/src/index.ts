import {BlockBatch, BlockStream, DataSource, StreamRequest} from '@subsquid/util-internal-data-source'
import {ListeningServer} from '@subsquid/util-internal-http-server'
import {DataService} from './data-service'
import {createHttpApp} from './http-app'
import {Block, BlockHeader, BlockRef} from './types'
import {PrometheusServer} from './prometheus'


export {
    Block,
    BlockBatch,
    BlockHeader,
    BlockRef,
    BlockStream,
    DataSource,
    StreamRequest
}


export interface DataServiceOptions {
    source: DataSource<Block>
    blockCacheSize?: number
    port?: number
    metrics?: number
}


export async function runDataService(args: DataServiceOptions): Promise<ListeningServer> {
    let service = new DataService(args.source, args.blockCacheSize ?? 1000)
    let app = createHttpApp(service)

    await service.init()
    let server = await app.listen(args.port ?? 3000)

    if (args.metrics) {
        let prometheus = new PrometheusServer(args.metrics)
        service.eventEmitter().on('batch', (data: {first: number, last: number, size: number}) => {
            prometheus.setFirstBlock(data.first)
            prometheus.setLastBlock(data.last)
            prometheus.setStoredBlocks(data.size)
        })
    }

    service.run().then()

    return {
        port: server.port,
        close(): Promise<void> {
            service.stop()
            return server.close()
        }
    }
}
