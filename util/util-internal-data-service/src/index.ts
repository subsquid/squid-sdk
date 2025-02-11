import {createLogger, Logger} from '@subsquid/logger'
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
    log?: Logger
}


export async function runDataService(args: DataServiceOptions): Promise<ListeningServer> {
    let log = args.log ?? createLogger('sqd:data-service')

    let service = new DataService(args.source, args.blockCacheSize ?? 1000)

    await service.init()

    let app = createHttpApp(service)

    let server = await app.listen(args.port ?? 3000)
    log.info(`data service is listening on port ${server.port}`)

    service.run().catch(err => {
        log.error(err, 'data ingestion terminated')
    })

    return {
        port: server.port,
        close(): Promise<void> {
            service.stop()
            return server.close()
        }
    }
}
