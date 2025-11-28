import {createLogger} from '@subsquid/logger'
import {AnyQuery, BlockRef, createQueryStream, GetQueryBlock, StreamOptions} from '@subsquid/portal-tools'
import {DataBatch, DataSource} from './clickhouse-processor'
import {PortalClient} from './portal-client'


export class PortalDataSource<Q extends AnyQuery> implements DataSource<GetQueryBlock<Q>> {
    private client: PortalClient
    private options: StreamOptions

    constructor(url: string, private query: Q, options?: StreamOptions) {
        this.client = new PortalClient(url)

        let log = createLogger('portal')
        let batchLog = log.child('batch')

        this.options = {
            retryAttempts: Number.MAX_SAFE_INTEGER,
            onRetry(err, _attempt, _pause) {
                log.warn('' + err)
            },
            onBatch(batch) {
                if (batchLog.isDebug()) {
                    let {blocks, ...props} = batch
                    batchLog.debug({
                        blockSize: blocks.length,
                        ...props
                    })
                }
            },
            ...options
        }
    }

    createDataStream(afterBlock?: BlockRef): AsyncIterable<DataBatch<GetQueryBlock<Q>>> {
        let query = {...this.query}
        if (afterBlock && afterBlock.number >= query.fromBlock) {
            if (query.toBlock && afterBlock.number >= query.toBlock) {
                return (async function* emptyStream() {})()
            }
            query.fromBlock = afterBlock.number + 1
            query.parentBlockHash = afterBlock.hash
        }
        return createQueryStream(this.client, query, this.options)
    }
}
