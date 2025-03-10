import {createLogger} from '@subsquid/logger'
import {archive, mapRpcBlock, removeVotes} from '@subsquid/solana-normalization'
import * as rpc from '@subsquid/solana-rpc'
import {withErrorContext} from '@subsquid/util-internal'
import {Block, BlockRef, DataSourceStream, DataSource, DataSourceStreamOptions} from '@subsquid/util-internal-data-service'
import {toJSON} from '@subsquid/util-internal-json'
import {promisify} from 'node:util'
import * as zlib from 'node:zlib'


const gzip = promisify(zlib.gzip)


export class Mapping implements DataSource<Block> {
    private dataNormalizationLogger = createLogger('sqd:solana-normalization')

    constructor(
        private inner: DataSource<rpc.Block>,
        private votes = false
    ) {}

    getHead(): Promise<BlockRef | undefined> {
        return this.inner.getHead()
    }

    getFinalizedHead(): Promise<BlockRef | undefined> {
        return this.inner.getFinalizedHead()
    }

    getFinalizedStream(req: DataSourceStreamOptions): DataSourceStream<Block> {
        return this.mapRpcStream(this.inner.getFinalizedStream(req))
    }

    getStream(req: DataSourceStreamOptions): DataSourceStream<Block> {
        return this.mapRpcStream(this.inner.getStream(req))
    }

    private async *mapRpcStream(stream: DataSourceStream<rpc.Block>): DataSourceStream<Block> {
        for await (let batch of stream) {
            let {blocks, ...props} = batch
            yield {
                blocks: await this.mapRpcBatch(blocks),
                ...props
            }
        }
    }

    private mapRpcBatch(blocks: rpc.Block[]): Promise<Block[]> {
        return Promise.all(blocks.map(block => {
            return this.mapRpcBlock(block).catch(withErrorContext({
                blockSlot: block.slot,
                blockHash: block.block.blockhash
            }))
        }))
    }

    private async mapRpcBlock(block: rpc.Block): Promise<Block> {
        let normalized = mapRpcBlock(
            block.slot,
            block.block,
            this.dataNormalizationLogger.child({
                blockSlot: block.slot,
                blockHash: block.block.blockhash
            })
        )

        if (!this.votes) {
            removeVotes(normalized)
        }

        let json = archive.toArchiveBlock(normalized)
        let jsonLine = JSON.stringify(toJSON(json)) + '\n'
        let jsonLineGzip = await gzip(jsonLine)

        return {
            number: block.slot,
            hash: block.block.blockhash,
            parentNumber: block.block.parentSlot,
            parentHash: block.block.previousBlockhash,
            timestamp: block.block.blockTime && block.block.blockTime * 1000 || undefined,
            jsonLineGzip
        }
    }
}
