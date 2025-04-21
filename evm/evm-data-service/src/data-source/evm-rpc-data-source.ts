import {last} from '@subsquid/util-internal'
import {BlockRef, BlockStream, DataSource, ForkException, StreamRequest} from '@subsquid/util-internal-data-source'
import {Range} from '@subsquid/util-internal-range'
import {Commitment, Rpc} from './evm-rpc'
import {Block, DataRequest} from './evm-types'
import {finalize} from './evm-finalizer'
import {ingest, IngestBatch} from './evm-ingest'


export interface SolanaRpcDataSourceOptions {
    rpc: Rpc
    req: DataRequest
    strideSize?: number
    strideConcurrency?: number
    maxConfirmationAttempts?: number
}


export class EVMRpcDataSource implements DataSource<Block> {
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
        // console.log("FIN HEAD: ", res)
        // return {
        //     number: 22210000,
        //     hash: "0x76e10d6c09b7334e2165316e8e432125a95cadc3ac16f812926d50152e45b927"
        // }
        // return {
        //     number: 134150000,
        //     hash: "0x13ee48de20ea2a7c13b5f538244a68aaa6f3c1b3d3cb6d68b1ee4aeb2b73885f"
        // }
        // return {
        //     number: 321846884,
        //     hash: "0xf526a2d2c17bafca995eed14f6476f120d18700237a157db740860e3bb10e15a"
        // }
        // return {
        //     number: 22215265,
        //     hash: "0x2408301809284471f236094abe5196db21fbd4147fc0bc816be90d37945ee9e3"
        // }
        // return {
        //     number: 22286467,
        //     hash: "0xd22b93b8d88e99f630114c533b3702cdad90d9b49fa9f83ae63779b661b6a1e5"
        // }
        return {
            number: res.number,
            hash: res.hash
        }
    }

    async getHead(): Promise<BlockRef> {
        let res = await this.rpc.getLatestBlockhash('latest')
        console.log("REG HEAD: ", res)
        return {
            number: res.number,
            hash: res.hash
        }
    }

    async *getFinalizedStream(req: StreamRequest): BlockStream<Block> {
        console.log("FIN STREAM: ", req)
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
        console.log("REG STREAM: ", req)
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
        for await (let batch of this.fillGaps(stream, from, 0)) {
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
                if (block.number - 1 < from || block.number == 0) {
                    from = block.number + 1
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
                        batch.finalized ? 'finalized' : 'latest',
                        {from, to: block.number - 1}
                    )

                    for await (let missingBatch of this.fillGaps(missing, from, depth + 1)) {
                        from = last(missingBatch.blocks).number + 1
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
