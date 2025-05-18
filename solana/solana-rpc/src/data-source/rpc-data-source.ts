import {BlockRef, BlockStream, DataSource, StreamRequest} from '@subsquid/util-internal-data-source'
import {Range} from '@subsquid/util-internal-range'
import {Commitment, RpcApi} from '../rpc'
import {Block, DataRequest} from '../types'
import {ensureContinuity} from './chain-fixer'
import {finalize} from './finalizer'
import {ingest, IngestBatch, IngestOptions} from './ingest'


export interface SolanaRpcDataSourceOptions {
    rpc: RpcApi
    req: DataRequest
    strideConcurrency: number
    strideSize?: number
    maxConfirmationAttempts?: number
}


export class SolanaRpcDataSource implements DataSource<Block> {
    private rpc: RpcApi
    public readonly req: DataRequest
    private strideSize: number
    private strideConcurrency: number
    private maxConfirmationAttempts: number

    constructor(options: SolanaRpcDataSourceOptions) {
        this.rpc = options.rpc
        this.req = options.req
        this.strideSize = Math.max(1, options.strideSize ?? 5)
        this.strideConcurrency = options.strideConcurrency
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

    async *getFinalizedStream(req: StreamRequest): BlockStream<Block> {
        let stream = this.ensureContinuity(
            ingest(this.getIngestOptions('finalized', req)),
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
            ingest(this.getIngestOptions('confirmed', req)),
            req.from,
            req.parentHash,
            req.to
        )
        return this.finalize(stream)
    }

    finalize(stream: AsyncIterable<IngestBatch>): BlockStream<Block> {
        return finalize(this.rpc, stream)
    }

    ensureContinuity(
        stream: AsyncIterable<IngestBatch>,
        from: number,
        parentHash?: string,
        to?: number
    ): AsyncIterable<IngestBatch>
    {
        return ensureContinuity(
            this.getIngestOptions('confirmed', {from: 0}),
            stream,
            from,
            parentHash,
            to
        )
    }

    private getIngestOptions(commitment: Commitment, range: Range): IngestOptions {
        return {
            rpc: this.rpc,
            commitment,
            req: this.req,
            range: {from: range.from, to: range.to},
            strideSize: this.strideSize,
            strideConcurrency: this.strideConcurrency,
            maxConfirmationAttempts: this.maxConfirmationAttempts,
        }
    }
}
