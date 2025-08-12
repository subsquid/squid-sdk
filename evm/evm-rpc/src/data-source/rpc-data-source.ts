import {BlockRef, BlockStream, DataSource, ForkException, StreamRequest} from '@subsquid/util-internal-data-source'
import {Range} from '@subsquid/util-internal-range'
import {Commitment, Rpc} from '../rpc'
import {Block, DataRequest} from '../types'
import {finalize} from './finalizer'
import {ingest, IngestBatch} from './ingest'


export interface EvmRpcDataSourceOptions {
    rpc: Rpc
    req: DataRequest
    strideSize?: number
    strideConcurrency?: number
}


export class EvmRpcDataSource implements DataSource<Block> {
    private rpc: Rpc
    public readonly req: DataRequest
    private strideSize: number
    private strideConcurrency: number

    constructor(options: EvmRpcDataSourceOptions) {
        this.rpc = options.rpc
        this.req = options.req
        this.strideSize = Math.max(1, options.strideSize ?? 5)
        this.strideConcurrency = Math.max(1, Math.min(options.strideConcurrency ?? 5, this.rpc.getConcurrency()))
    }

    async getFinalizedHead(): Promise<BlockRef> {
        let res = await this.rpc.getLatestBlockhash('finalized')
        return {
            number: res.number,
            hash: res.hash
        }
    }

    async getHead(): Promise<BlockRef> {
        let res = await this.rpc.getLatestBlockhash('latest')
        return {
            number: res.number,
            hash: res.hash
        }
    }

    async *getFinalizedStream(req: StreamRequest): BlockStream<Block> {
        let stream = this.ensureContinuity(
            this.ingest('finalized', req),
            req.from,
            req.parentHash
        )

        for await (let {blocks, finalized} of stream) {
            yield {
                blocks,
                finalizedHead: finalized
            }
        }
    }

    getStream(req: StreamRequest): BlockStream<Block> {
        let stream = this.ensureContinuity(
            this.ingest('latest', req),
            req.from,
            req.parentHash
        )
        return this.finalize(stream)
    }

    finalize(stream: AsyncIterable<IngestBatch>): BlockStream<Block> {
        return finalize(this.rpc, stream)
    }

    async *ensureContinuity(
        stream: AsyncIterable<IngestBatch>,
        from: number,
        parentHash?: string
    ): AsyncIterable<IngestBatch>
    {
        for await (let batch of stream) {
            for (let i = 0; i < batch.blocks.length; i++) {
                let block = batch.blocks[i]
                if (parentHash === block.block.parentHash || parentHash == null) {
                    parentHash = block.block.hash
                } else {
                    if (i > 0) {
                        // Although it is very strange to yield a block,
                        // that we are about to rollback (or at least to question),
                        // such move greatly simplifies implementation.
                        // Given how rare forks happen, this seems to be more than a good tradeoff.
                        yield {
                            blocks: batch.blocks.slice(0, i),
                            finalized: batch.finalized
                        }
                    }
                    throw new ForkException(
                        parentHash,
                        {
                            number: block.number,
                            hash: block.block.hash
                        },
                        [{
                            number: block.number - 1,
                            hash: block.block.parentHash
                        }]
                    )
                }
            }
            if (batch.blocks.length > 0) {
                yield batch
            }
        }
    }

    private ingest(commitment: Commitment, range: Range): AsyncIterable<IngestBatch> {
        return ingest({
            rpc: this.rpc,
            commitment,
            req: this.req,
            range,
            strideSize: this.strideSize,
            strideConcurrency: this.strideConcurrency,
        })
    }
}
