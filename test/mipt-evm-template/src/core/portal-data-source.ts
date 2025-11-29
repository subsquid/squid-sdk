import {createLogger} from '@subsquid/logger'
import {AnyQuery, BlockRef, createQueryStream, GetQueryBlock, StreamOptions} from '@subsquid/portal-tools'
import {last} from '@subsquid/util-internal'
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
                    let ttfb = batch.firstByteTime - batch.startTime
                    let duration = batch.endTime - batch.startTime
                    let time = Math.max(duration, 1)

                    let blockDistance = blocks.length
                        ? last(blocks).header.number - blocks[0].header.number + 1
                        : 0

                    let bps = Math.round(1000 * blockDistance / time)
                    let ips = Math.round(1000 * batch.itemSize / time)
                    let mbs = Math.round(10000 * batch.byteSize / (time * 1024 * 1024)) / 10

                    batchLog.debug({
                        blockDistance,
                        blockSize: blocks.length,
                        ...props
                    }, `rate: ${bps} blocks/sec, ${ips} items/sec, ${mbs} MB/sec; time: ${duration} ms; TTFB: ${ttfb} ms`)
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
