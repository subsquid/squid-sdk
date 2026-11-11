import {BlockRef, BlockStream, DataSource, ForkException, StreamRequest} from '@subsquid/util-internal-data-source'
import {Range} from '@subsquid/util-internal-range'
import {Commitment, Rpc} from '../rpc'
import {Block, DataRequest} from '../types'
import {finalize} from './finalizer'
import {ingest, IngestBatch} from './ingest'


/**
 * Blocks of the new chain reported below a fork, on top of the current unfinalized window
 * (`latest - finalized`). The consumer rolls back to the newest of its blocks that is also in the
 * list, so the list has to reach below whatever the consumer still holds unfinalized: it may have
 * fallen behind the source's finality, or be resuming after downtime.
 */
const FORK_LOOKBACK_MARGIN = 64
/** Upper bound on the blocks reported below a fork, for chains with a very long unfinalized window. */
const FORK_LOOKBACK_LIMIT = 1000
/** Blocks fetched per request while collecting them. */
const FORK_LOOKBACK_BATCH = 100


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
        let top = block.number - 1
        let parent: BlockRef = {number: top, hash: block.block.parentHash}
        if (top < 0) return [parent]

        let depth = FORK_LOOKBACK_LIMIT
        try {
            let [head, finalized] = await Promise.all([
                this.rpc.getLatestBlockhash('latest'),
                this.rpc.getLatestBlockhash('finalized'),
            ])
            depth = Math.min(FORK_LOOKBACK_LIMIT, Math.max(0, head.number - finalized.number) + FORK_LOOKBACK_MARGIN)
        } catch {
            // The window is unknown; fall back to the limit rather than to too short a list.
        }
        let lowest = Math.max(0, top - depth + 1)

        let chain: BlockRef[] = []
        let expectedHash = block.block.parentHash
        for (let hi = top; hi >= lowest; hi -= FORK_LOOKBACK_BATCH) {
            let lo = Math.max(lowest, hi - FORK_LOOKBACK_BATCH + 1)
            let numbers: number[] = []
            for (let n = lo; n <= hi; n++) numbers.push(n)
            let headers = await this.rpc.getBlockHeaders(numbers)
            for (let i = headers.length - 1; i >= 0; i--) {
                let b = headers[i]
                if (b == null || b.block.hash !== expectedHash) return linked(chain, parent)
                chain.push({number: b.number, hash: b.block.hash})
                expectedHash = b.block.parentHash
            }
        }
        return linked(chain, parent)
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


/** `chain` was collected top-down; return it ascending, or at least the known parent. */
function linked(chain: BlockRef[], parent: BlockRef): BlockRef[] {
    return chain.length > 0 ? chain.reverse() : [parent]
}
