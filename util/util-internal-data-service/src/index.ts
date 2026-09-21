import {BlockBatch, BlockStream, DataSource, StreamRequest} from '@subsquid/util-internal-data-source'
import {ListeningServer} from '@subsquid/util-internal-http-server'
import {DataService} from './data-service'
import {createHttpApp} from './http-app'
import {Metrics} from './metrics'
import {Block, BlockHeader, BlockRef} from './types'


export {
    Block,
    BlockBatch,
    BlockHeader,
    BlockRef,
    BlockStream,
    DataSource,
    Metrics,
    StreamRequest
}


export interface DataServiceOptions {
    source: DataSource<Block>
    blockCacheSize?: number
    port?: number
    autoAdjustFinalizedHead?: boolean
}


export async function runDataService(args: DataServiceOptions): Promise<ListeningServer & {started: Promise<void>, metrics: Metrics}> {
    let service = new DataService(args.source, args.blockCacheSize ?? 1000, args.autoAdjustFinalizedHead)
    let app = createHttpApp(service)

    await service.init()
    let server = await app.listen(args.port ?? 3000)

    service.run().then()

    return {
        started: service.started(),
        metrics: service.metrics,
        port: server.port,
        close(): Promise<void> {
            service.stop()
            return server.close()
        }
    }
}
