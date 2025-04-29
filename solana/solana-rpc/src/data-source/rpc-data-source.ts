import {last} from '@subsquid/util-internal'
import {BlockRef, BlockStream, DataSource, ForkException, StreamRequest} from '@subsquid/util-internal-data-source'
import {Range} from '@subsquid/util-internal-range'
import assert from 'assert'
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
    noVotes?: boolean
}


export class SolanaRpcDataSource implements DataSource<Block> {
    private rpc: Rpc
    public readonly req: DataRequest
    private strideSize: number
    private strideConcurrency: number
    private maxConfirmationAttempts: number
    private noVotes: boolean

    constructor(options: SolanaRpcDataSourceOptions) {
        this.rpc = options.rpc
        this.req = options.req
        this.strideSize = Math.max(1, options.strideSize ?? 5)
        this.strideConcurrency = Math.max(1, Math.min(options.strideConcurrency ?? 5, this.rpc.getConcurrency()))
        this.maxConfirmationAttempts = options.maxConfirmationAttempts ?? 10
        this.noVotes = options.noVotes ?? false
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

    async *getFinalizedStream(req: StreamRequest): BlockStream<Block> {
        let stream = this.ensureContinuity(
            this.ingest('finalized', req),
            req.from,
            req.parentHash,
            req.to
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
            this.ingest('confirmed', req),
            req.from,
            req.parentHash,
            req.to
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
        to?: number
    ): AsyncIterable<IngestBatch>
    {
        for await (let batch of this.fillGaps(0, stream, from, to ?? Infinity)) {
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
                        {
                            number: block.slot,
                            hash: block.block.blockhash
                        },
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
        depth: number,
        stream: AsyncIterable<IngestBatch>,
        from: number,
        to: number
    ): AsyncIterable<IngestBatch>
    {
        if (from > to) return
        if (depth > 10) {
            throw new Error('rpc endpoint is too far behind from upstream block source')
        }

        for await (let batch of stream) {
            batch.blocks.reduce((prev, b) => {
                assert(prev < b.slot, 'batch blocks are not monotonic')
                return b.slot
            }, -1)

            let offset = 0
            let i = 0
            while (i < batch.blocks.length) {
                let block = batch.blocks[i]
                if (block.slot < from) {
                    assert(offset == i)
                    offset += 1
                    i += 1
                } else if (block.block.parentSlot < from || block.slot == 0) {
                    from = block.slot + 1
                    if (block.slot <= to) {
                        i += 1
                    }
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
                        {from, to: Math.min(to, block.block.parentSlot)}
                    )

                    for await (let missingBatch of this.fillGaps(depth + 1, missing, from, Infinity)) {
                        from = last(missingBatch.blocks).slot + 1
                        yield missingBatch
                    }
                }

                if (from > to) break
            }

            if (offset < i) {
                yield {
                    blocks: batch.blocks.slice(offset, i),
                    finalized: batch.finalized
                }
            }

            if (from > to) return
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
            maxConfirmationAttempts: this.maxConfirmationAttempts,
            noVotes: this.noVotes
        })
    }
}
