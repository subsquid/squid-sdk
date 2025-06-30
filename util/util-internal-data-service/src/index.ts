import {BlockBatch, BlockStream, DataSource, StreamRequest} from '@subsquid/util-internal-data-source'
import {ListeningServer} from '@subsquid/util-internal-http-server'
import {DataService} from './data-service'
import {createHttpApp} from './http-app'
import {Block, BlockHeader, BlockRef} from './types'


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
}


export async function runDataService(args: DataServiceOptions): Promise<ListeningServer & {started: Promise<void>}> {
    let service = new DataService(args.source, args.blockCacheSize ?? 1000)
    let app = createHttpApp(service)

    await service.init()
    let server = await app.listen(args.port ?? 3000)

    service.run().then()

    return {
        started: service.started(),
        port: server.port,
        close(): Promise<void> {
            service.stop()
            return server.close()
        }
    }
}
