import {Block as RpcBlock} from '@subsquid/evm-rpc'
import {createLogger} from '@subsquid/logger'
import {withErrorContext} from '@subsquid/util-internal'
import {Block, BlockRef, BlockStream, DataSource, StreamRequest} from '@subsquid/util-internal-data-service'
import {promisify} from 'node:util'
import * as zlib from 'node:zlib'
import {mapRpcBlock} from './evm-normaliztion'


const gzip = promisify(zlib.gzip)


export class Mapping implements DataSource<Block> {
    private dataNormalizationLogger = createLogger('sqd:solana-normalization')

    constructor(
        private inner: DataSource<RpcBlock>
    ) {}

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

    private async *mapRpcStream(stream: BlockStream<RpcBlock>): BlockStream<Block> {
        for await (let batch of stream) {
            let {blocks, ...props} = batch
            yield {
                blocks: await this.mapRpcBatch(blocks),
                ...props
            }
        }
    }

    private mapRpcBatch(blocks: RpcBlock[]): Promise<Block[]> {
        return Promise.all(blocks.map(block => {
            return this.mapRpcBlock(block).catch(withErrorContext({
                blockSlot: block.number,
                blockHash: block.block.hash
            }))
        }))
    }

    private async mapRpcBlock(block: RpcBlock): Promise<Block> {
        let normalized = mapRpcBlock(
            block.number,
            block.block,
            this.dataNormalizationLogger.child({
                blockSlot: block.number,
                blockHash: block.block.hash
            })
        )

        let json = JSON.stringify(normalized) + "\n"

        let jsonLineGzip = await gzip(json)
        return {
            number: block.number,
            hash: block.block.hash,
            parentNumber: block.number - 1,
            parentHash: block.block.parentHash,
            timestamp: parseInt(block.block.timestamp, 16) * 1000,
            jsonLineGzip
        }
    }
}
