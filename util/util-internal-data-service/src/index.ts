import {BlockBatch, DataSourceStream, DataSource, DataSourceStreamOptions} from '@subsquid/util-internal-data-source'
import {ListeningServer} from '@subsquid/util-internal-http-server'
import {DataService} from './data-service'
import {createHttpApp} from './http-app'
import {Block, BlockHeader, BlockRef} from './types'


export {
    Block,
    BlockBatch,
    BlockHeader,
    BlockRef,
    DataSource,
    DataSourceStream,
    DataSourceStreamOptions
}


export interface DataServiceOptions {
    source: DataSource<Block>
    blockCacheSize?: number
    port?: number
}


export async function runDataService(args: DataServiceOptions): Promise<ListeningServer> {
    let service = new DataService(args.source, args.blockCacheSize ?? 1000)
    let app = createHttpApp(service)

    await service.init()
    let server = await app.listen(args.port ?? 3000)

    service.run().then()

    return {
        port: server.port,
        close(): Promise<void> {
            service.stop()
            return server.close()
        }
    }
}
