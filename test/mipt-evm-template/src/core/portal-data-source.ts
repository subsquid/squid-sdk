import {createLogger} from '@subsquid/logger'
import {AnyQuery, BlockRef, createQueryStream, GetQueryBlock, StreamOptions} from '@subsquid/portal-tools'
import {DataBatch, DataSource} from './clickhouse-processor'
import {PortalClient} from './portal-client'


export class PortalDataSource<Q extends AnyQuery> implements DataSource<GetQueryBlock<Q>> {
    private client: PortalClient
    private options: StreamOptions

    constructor(url: string, private query: Q, options?: StreamOptions) {
        this.client = new PortalClient(url)
        this.options = {
            retryAttempts: Number.MAX_SAFE_INTEGER,
            onRetry: (err, _attempt, _pause) => {
                createLogger('portal').warn(''+err)
            },
            ...options
        }
    }

    createDataStream(afterBlock?: BlockRef): AsyncIterable<DataBatch<GetQueryBlock<Q>>> {
        let query = {...this.query}
        if (afterBlock) {
            throw new Error('afterBlock parameter is not implemented')
        }
        return createQueryStream(this.client, query, this.options)
    }
}
