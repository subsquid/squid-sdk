import {last} from '@subsquid/util-internal'
import {BlockRef, DataSourceStream, DataSource, ForkException, DataSourceStreamOptions} from '@subsquid/util-internal-data-source'
import {Range} from '@subsquid/util-internal-range'
import {Commitment, Rpc} from '../rpc'
import {Block, DataRequest} from '../types'
import {finalize} from './finalizer'
import {ingest, IngestBatch} from './ingest'


export interface SolanaRpcDataSourceOptions {
    rpc: Rpc
    req: DataRequest
    strideSize?: number
    strideConcurrency?: number
    maxConfirmationAttempts?: number
}


export class SolanaRpcDataSource implements DataSource<Block> {
    private rpc: Rpc
    public readonly req: DataRequest
    private strideSize: number
    private strideConcurrency: number
    private maxConfirmationAttempts: number

    constructor(options: SolanaRpcDataSourceOptions) {
        this.rpc = options.rpc
        this.req = options.req
        this.strideSize = Math.max(1, options.strideSize ?? 5)
        this.strideConcurrency = Math.max(1, Math.min(options.strideConcurrency ?? 5, this.rpc.getConcurrency()))
        this.maxConfirmationAttempts = options.maxConfirmationAttempts ?? 10
    }

    async getFinalizedHead(): Promise<BlockRef> {
        let res = await this.rpc.getLatestBlockhash('finalized')
        return {
            number: res.context.slot,
            hash: res.value.blockhash
        }
    }

    async getHead(): Promise<BlockRef> {
        let res = await this.rpc.getLatestBlockhash('confirmed')
        return {
            number: res.context.slot,
            hash: res.value.blockhash
        }
    }

    async *getFinalizedStream(req: DataSourceStreamOptions): DataSourceStream<Block> {
        let range = req.range ?? {from: 0}
        let stream = this.ensureContinuity(
            this.ingest('finalized', range),
            range.from,
            req.parentHash
        )

        for await (let {blocks, finalized} of stream) {
            yield {
                blocks,
                finalizedHead: finalized
            }
        }
    }
    getStream(req: DataSourceStreamOptions): DataSourceStream<Block> {

        let range = req.range ?? {from: 0}
        let stream = this.ensureContinuity(
            this.ingest('confirmed', range),
            range.from,
            req.parentHash
        )
        return this.finalize(stream)
    }

    finalize(stream: AsyncIterable<IngestBatch>): DataSourceStream<Block> {
        return finalize(this.rpc, stream)
    }

    async *ensureContinuity(
        stream: AsyncIterable<IngestBatch>,
        from: number,
        parentHash?: string
    ): AsyncIterable<IngestBatch>
    {
        for await (let batch of this.fillGaps(stream, from, 0)) {
            for (let i = 0; i < batch.blocks.length; i++) {
                let block = batch.blocks[i]
                if (parentHash === block.block.previousBlockhash || parentHash == null) {
                    parentHash = block.block.blockhash
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
                        block.slot,
                        [{
                            number: block.block.parentSlot,
                            hash: block.block.previousBlockhash
                        }]
                    )
                }
            }
            if (batch.blocks.length > 0) {
                yield batch
            }
        }
    }

    private async *fillGaps(
        stream: AsyncIterable<IngestBatch>,
        from: number,
        depth: number
    ): AsyncIterable<IngestBatch>
    {
        if (depth > 10) {
            throw new Error('rpc endpoint is too behind from upstream block source')
        }

        for await (let batch of stream) {
            let offset = 0
            let i = 0

            while (i < batch.blocks.length) {
                let block = batch.blocks[i]
                if (block.block.parentSlot < from || block.slot == 0) {
                    from = block.slot + 1
                    i += 1
                } else {
                    if (offset < i) {
                        yield {
                            blocks: batch.blocks.slice(offset, i),
                            finalized: batch.finalized
                        }
                    }

                    offset = i

                    let missing = this.ingest(
                        batch.finalized ? 'finalized' : 'confirmed',
                        {from, to: block.block.parentSlot}
                    )

                    for await (let missingBatch of this.fillGaps(missing, from, depth + 1)) {
                        from = last(missingBatch.blocks).slot + 1
                        yield missingBatch
                    }
                }
            }

            if (offset < i) {
                yield {
                    blocks: batch.blocks.slice(offset, i),
                    finalized: batch.finalized
                }
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
            maxConfirmationAttempts: this.maxConfirmationAttempts
        })
    }
}
