import {BlockRef, BlockStream, DataSource, ForkException, StreamRequest} from '@subsquid/util-internal-data-source'
import {Range} from '@subsquid/util-internal-range'
import {Commitment, Rpc} from '../rpc'
import {Block, DataRequest} from '../types'
import {finalize} from './finalizer'
import {ingest, IngestBatch} from './ingest'


/**
 * Blocks of the new chain reported below a fork, ending at the new parent - the depth the Portal's
 * hot-block service reports in its fork responses. The consumer rolls back to the newest of its
 * blocks that is also in the list; the batch processor keeps only some of its unfinalized blocks,
 * so a list that just reaches the fork point is often not enough.
 */
const FORK_PREVIOUS_BLOCKS = 100


export interface EvmRpcDataSourceOptions {
    rpc: Rpc
    req: DataRequest
    strideSize?: number
    strideConcurrency?: number
    /**
     * Pause before asking for the chain head again, once caught up with it.
     *
     * Defaults to 100ms, which suits head-following consumers.
     * Archiving is not latency sensitive and should set this much higher.
     */
    headPollInterval?: number
}


export class EvmRpcDataSource implements DataSource<Block> {
    private rpc: Rpc
    public readonly req: DataRequest
    private strideSize: number
    private strideConcurrency: number
    private headPollInterval: number

    constructor(options: EvmRpcDataSourceOptions) {
        this.rpc = options.rpc
        this.req = options.req
        this.strideSize = Math.max(1, options.strideSize ?? 5)
        this.strideConcurrency = Math.max(1, Math.min(options.strideConcurrency ?? 5, this.rpc.getConcurrency()))
        this.headPollInterval = Math.max(0, options.headPollInterval ?? 100)
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
                        block.number,
                        parentHash,
                        await this.getForkPreviousBlocks(block)
                    )
                }
            }
            if (batch.blocks.length > 0) {
                yield batch
            }
        }
    }

    /**
     * The new chain below a block whose parent did not match: from the block's parent downwards,
     * following parent hashes, in ascending order, as `ForkException.previousBlocks` expects.
     *
     * A consumer can only roll back to a block that is in both its chain and this list. Reporting
     * just the parent - a block at the height of the consumer's replaced head, with a different hash
     * by definition - left it with nothing in common, and every reorg ended in a fatal error (#631).
     *
     * The blocks are linked from the top rather than read as a range: a load-balanced endpoint can
     * answer some heights from the old branch while it switches, and anything below a broken link
     * is not on the new chain as far as this list can tell.
     */
    private async getForkPreviousBlocks(block: Block): Promise<BlockRef[]> {
        // Each block's parent hash vouches for the block below it, so the walk always ends with that
        // link - even where the node has no header for it, or answers from the old branch.
        let expected: BlockRef = {number: block.number - 1, hash: block.block.parentHash}
        let chain: BlockRef[] = []
        if (expected.number >= 0) {
            let numbers: number[] = []
            for (let n = Math.max(0, expected.number - FORK_PREVIOUS_BLOCKS + 1); n <= expected.number; n++) numbers.push(n)
            let headers = await this.rpc.getBlockHeaders(numbers)
            for (let i = headers.length - 1; i >= 0; i--) {
                let b = headers[i]
                if (b == null || b.block.hash !== expected.hash) break
                chain.push(expected)
                expected = {number: b.number - 1, hash: b.block.parentHash}
            }
        }
        if (expected.number >= 0) chain.push(expected)
        return chain.reverse()
    }

    private ingest(commitment: Commitment, range: Range): AsyncIterable<IngestBatch> {
        return ingest({
            rpc: this.rpc,
            commitment,
            req: this.req,
            range,
            strideSize: this.strideSize,
            strideConcurrency: this.strideConcurrency,
            headPollInterval: this.headPollInterval,
        })
    }
}

