import {Block, SolanaRpcDataSource} from '@subsquid/solana-rpc'
import {IngestBatch} from '@subsquid/solana-rpc/lib/data-source/ingest'
import {BlockRef, BlockStream, DataSource, StreamRequest} from '@subsquid/util-internal-data-service'


export class GeyserDataSource implements DataSource<Block> {
    constructor(
        private rpc: SolanaRpcDataSource,
        private geyser: {
            getStream(): AsyncIterable<IngestBatch>
        }
    ) {}

    getHead(): Promise<BlockRef> {
        return this.rpc.getHead()
    }

    getFinalizedHead(): Promise<BlockRef> {
        return this.rpc.getFinalizedHead()
    }

    getFinalizedStream(req: StreamRequest): BlockStream<Block> {
        return this.rpc.getFinalizedStream(req)
    }

    getStream(req: StreamRequest): BlockStream<Block> {
        return this.rpc.finalize(
            this.rpc.ensureContinuity(
                this.geyser.getStream(),
                req.from,
                req.parentHash,
                req.to
            )
        )
    }
}
