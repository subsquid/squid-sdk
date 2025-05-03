import {BlockRef, BlockStream, DataSource, StreamRequest} from '@subsquid/util-internal-data-source'
import {Range} from '@subsquid/util-internal-range'
import {Commitment, Rpc} from '../rpc'
import {Block, DataRequest} from '../types'
import {ChainFixer} from './chain-fixer'
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

    ensureContinuity(
        stream: AsyncIterable<IngestBatch>,
        from: number,
        parentHash?: string,
        to?: number
    ): AsyncIterable<IngestBatch>
    {
        return new ChainFixer(
            (commitment, from, depth) => {
                let concurrency: number
                switch(depth) {
                    case 0:
                    case 1:
                        concurrency = this.strideConcurrency
                        break
                    case 2:
                        concurrency = Math.min(1, this.strideConcurrency)
                        break
                    default:
                        concurrency = 0
                }
                return this.ingest(commitment, {from}, concurrency)
            },
            stream,
            from,
            parentHash,
            to
        )
    }

    private ingest(commitment: Commitment, range: Range, strideConcurrency?: number): AsyncIterable<IngestBatch> {
        return ingest({
            rpc: this.rpc,
            commitment,
            req: this.req,
            range,
            strideSize: this.strideSize,
            strideConcurrency: strideConcurrency ?? this.strideConcurrency,
            maxConfirmationAttempts: this.maxConfirmationAttempts,
            noVotes: this.noVotes
        })
    }
}
