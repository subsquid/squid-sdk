import {BlockStream, DataSource, ForkException, StreamRequest} from '@subsquid/util-internal-data-source'
import {Range} from '@subsquid/util-internal-range'
import {BlockData, getParentHash, HttpApi} from '@subsquid/tron-data'
import {getChainHead, getSolidifiedHead} from './get-blocks'
import {Commitment, ingest, IngestBatch} from './ingest'


export interface TronDataSourceOptions {
    httpApi: HttpApi
    strideSize?: number
    strideConcurrency?: number
    headPollInterval?: number
}


export class TronDataSource implements DataSource<BlockData> {
    private httpApi: HttpApi
    private strideSize: number
    private strideConcurrency: number
    private headPollInterval: number

    constructor(options: TronDataSourceOptions) {
        this.httpApi = options.httpApi
        this.strideSize = Math.max(1, options.strideSize ?? 5)
        this.strideConcurrency = Math.max(1, options.strideConcurrency ?? 5)
        this.headPollInterval = options.headPollInterval ?? 1000
    }

    getHead() {
        return getChainHead(this.httpApi)
    }

    getFinalizedHead() {
        return getSolidifiedHead(this.httpApi)
    }

    getFinalizedStream(req: StreamRequest): BlockStream<BlockData> {
        return this.toBlockStream(this.ensureContinuity(this.ingest('finalized', req), req.parentHash))
    }

    getStream(req: StreamRequest): BlockStream<BlockData> {
        return this.toBlockStream(this.ensureContinuity(this.ingest('latest', req), req.parentHash))
    }

    private async *toBlockStream(stream: AsyncIterable<IngestBatch>): BlockStream<BlockData> {
        for await (let {blocks, finalized} of stream) {
            yield {
                blocks,
                finalizedHead: finalized
            }
        }
    }

    private ingest(commitment: Commitment, range: Range): AsyncIterable<IngestBatch> {
        return ingest({
            httpApi: this.httpApi,
            commitment,
            range,
            strideSize: this.strideSize,
            strideConcurrency: this.strideConcurrency,
            headPollInterval: this.headPollInterval
        })
    }

    private async *ensureContinuity(
        stream: AsyncIterable<IngestBatch>,
        parentHash?: string
    ): AsyncIterable<IngestBatch> {
        for await (let batch of stream) {
            for (let i = 0; i < batch.blocks.length; i++) {
                let block = batch.blocks[i]
                if (parentHash == null || parentHash === getParentHash(block)) {
                    parentHash = block.hash
                } else {
                    if (i > 0) {
                        // Yielding blocks we are about to question looks strange,
                        // but it greatly simplifies the implementation and forks
                        // are rare enough for this to be a good tradeoff
                        // (same reasoning as in the EVM data source).
                        yield {
                            blocks: batch.blocks.slice(0, i),
                            finalized: batch.finalized
                        }
                    }
                    throw new ForkException(
                        block.height,
                        parentHash,
                        [{
                            number: block.height - 1,
                            hash: getParentHash(block)
                        }]
                    )
                }
            }
            if (batch.blocks.length > 0) {
                yield batch
            }
        }
    }
}
