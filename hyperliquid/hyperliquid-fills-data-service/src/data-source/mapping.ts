import {Block as RawBlock} from '@subsquid/hyperliquid-fills-data'
import {mapRawBlock} from '@subsquid/hyperliquid-fills-normalization'
import {withErrorContext} from '@subsquid/util-internal'
import {Block, BlockRef, BlockStream, DataSource, StreamRequest} from '@subsquid/util-internal-data-service'
import {toJSON} from '@subsquid/util-internal-json'
import {promisify} from 'node:util'
import * as zlib from 'node:zlib'


const gzip = promisify(zlib.gzip)


export class Mapping implements DataSource<Block> {
    constructor(private inner: DataSource<RawBlock>) {}

    getHead(): Promise<BlockRef> {
        return this.inner.getHead()
    }

    getFinalizedHead(): Promise<BlockRef> {
        return this.inner.getFinalizedHead()
    }

    getFinalizedStream(req: StreamRequest): BlockStream<Block> {
        return this.mapRpcStream(this.inner.getFinalizedStream(req))
    }

    getStream(req: StreamRequest): BlockStream<Block> {
        return this.mapRpcStream(this.inner.getStream(req))
    }

    private async *mapRpcStream(stream: BlockStream<RawBlock>): BlockStream<Block> {
        for await (let batch of stream) {
            let {blocks, ...props} = batch
            yield {
                blocks: await this.mapRpcBatch(blocks),
                ...props
            }
        }
    }

    private mapRpcBatch(blocks: RawBlock[]): Promise<Block[]> {
        return Promise.all(blocks.map(block => {
            return this.mapRpcBlock(block).catch(withErrorContext({
                blockNumber: block.block_number,
            }))
        }))
    }

    private async mapRpcBlock(block: RawBlock): Promise<Block> {
        let normalized = mapRawBlock(block)
        let jsonLine = JSON.stringify(toJSON(normalized)) + '\n'
        let jsonLineGzip = await gzip(jsonLine, {
            level: zlib.constants.Z_BEST_COMPRESSION
        })

        return {
            number: block.block_number,
            hash: normalized.header.hash,
            parentNumber: block.block_number - 1,
            parentHash: normalized.header.parentHash,
            timestamp: Date.parse(block.block_time),
            jsonLineGzip
        }
    }
}
