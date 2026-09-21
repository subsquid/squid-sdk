import {BlockData} from '@subsquid/tron-data'
import {mapBlock} from '@subsquid/tron-normalization'
import {withErrorContext} from '@subsquid/util-internal'
import {Block, BlockRef, BlockStream, DataSource, StreamRequest} from '@subsquid/util-internal-data-service'
import {toJSON} from '@subsquid/util-internal-json'
import {promisify} from 'node:util'
import * as zlib from 'node:zlib'


const zstdCompress = promisify(zlib.zstdCompress)


export class Mapping implements DataSource<Block> {
    constructor(private inner: DataSource<BlockData>) {}

    getHead(): Promise<BlockRef> {
        return this.inner.getHead()
    }

    getFinalizedHead(): Promise<BlockRef> {
        return this.inner.getFinalizedHead()
    }

    getFinalizedStream(req: StreamRequest): BlockStream<Block> {
        return this.mapStream(this.inner.getFinalizedStream(req))
    }

    getStream(req: StreamRequest): BlockStream<Block> {
        return this.mapStream(this.inner.getStream(req))
    }

    private async *mapStream(stream: BlockStream<BlockData>): BlockStream<Block> {
        for await (let batch of stream) {
            let {blocks, ...props} = batch
            yield {
                blocks: await Promise.all(blocks.map(block => this.mapBlock(block))),
                ...props
            }
        }
    }

    private mapBlock(block: BlockData): Promise<Block> {
        return this.mapBlockData(block).catch(withErrorContext({
            blockHeight: block.height,
            blockHash: block.hash
        }))
    }

    private async mapBlockData(block: BlockData): Promise<Block> {
        let normalized = mapBlock(block)
        let jsonLine = JSON.stringify(toJSON(normalized)) + '\n'
        let jsonLineZstd = await zstdCompress(Buffer.from(jsonLine), {
            params: {[zlib.constants.ZSTD_c_compressionLevel]: 1}
        })

        return {
            number: block.height,
            hash: block.hash,
            parentNumber: block.height - 1,
            parentHash: block.block.block_header.raw_data.parentHash,
            timestamp: block.block.block_header.raw_data.timestamp ?? undefined,
            jsonLineZstd
        }
    }
}
