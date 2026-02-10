import { BlockRef, BlockStream, DataSource, ForkException, StreamRequest } from '@subsquid/util-internal-data-source'
import { Range } from '@subsquid/util-internal-range'
import { Commitment, Rpc } from '../rpc'
import { Block, DataRequest } from '../types'
import { finalize } from './finalizer'
import { ingest, IngestBatch } from './ingest'

export interface BitcoinRpcDataSourceOptions {
    rpc: Rpc
    req: DataRequest
    strideSize?: number
    strideConcurrency?: number
}

export class BitcoinRpcDataSource implements DataSource<Block> {
    private rpc: Rpc
    public readonly req: DataRequest
    private strideSize: number
    private strideConcurrency: number

    constructor(options: BitcoinRpcDataSourceOptions) {
        this.rpc = options.rpc
        this.req = options.req
        this.strideSize = Math.max(1, options.strideSize ?? 5)
        this.strideConcurrency = Math.max(
            1,
            Math.min(options.strideConcurrency ?? 5, this.rpc.getConcurrency()),
        )
    }

    async getFinalizedHead(): Promise<BlockRef> {
        const res = await this.rpc.getLatestBlockhash('finalized')
        return {
            number: res.number,
            hash: res.hash,
        }
    }

    async getHead(): Promise<BlockRef> {
        const res = await this.rpc.getLatestBlockhash('latest')
        return {
            number: res.number,
            hash: res.hash,
        }
    }

    async *getFinalizedStream(req: StreamRequest): BlockStream<Block> {
        const stream = this.ensureContinuity(
            this.ingest('finalized', req),
            req.from,
            req.parentHash,
        )

        for await (const { blocks, finalized } of stream) {
            yield {
                blocks,
                finalizedHead: finalized,
            }
        }
    }

    getStream(req: StreamRequest): BlockStream<Block> {
        const stream = this.ensureContinuity(
            this.ingest('latest', req),
            req.from,
            req.parentHash,
        )
        return this.finalize(stream)
    }

    finalize(stream: AsyncIterable<IngestBatch>): BlockStream<Block> {
        return finalize(this.rpc, stream)
    }

    async *ensureContinuity(
        stream: AsyncIterable<IngestBatch>,
        from: number,
        parentHash?: string,
    ): AsyncIterable<IngestBatch> {
        for await (const batch of stream) {
            for (let i = 0; i < batch.blocks.length; i++) {
                const block = batch.blocks[i]
                const previous = block.block.previousblockhash
                if (parentHash == null || parentHash === previous) {
                    parentHash = block.block.hash
                } else {
                    if (i > 0) {
                        yield {
                            blocks: batch.blocks.slice(0, i),
                            finalized: batch.finalized,
                        }
                    }
                    throw new ForkException(
                        parentHash,
                        {
                            number: block.number,
                            hash: block.block.hash,
                        },
                        [
                            {
                                number: block.number - 1,
                                hash: block.block.previousblockhash ?? '',
                            },
                        ],
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
