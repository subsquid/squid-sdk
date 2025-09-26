import {Block as RpcBlock} from '@subsquid/evm-rpc'
import {mapRpcBlock} from '@subsquid/evm-normalization'
import {withErrorContext} from '@subsquid/util-internal'
import {Block, BlockRef, BlockStream, DataSource, StreamRequest} from '@subsquid/util-internal-data-service'
import {toJSON} from '@subsquid/util-internal-json'
import {promisify} from 'node:util'
import * as zlib from 'node:zlib'


const gzip = promisify(zlib.gzip)


export class Mapping implements DataSource<Block> {
    constructor(
        private inner: DataSource<RpcBlock>,
        private withTraces?: boolean,
        private withStateDiffs?: boolean,
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
                blockNumber: block.number,
                blockHash: block.hash
            }))
        }))
    }

    private async mapRpcBlock(block: RpcBlock): Promise<Block> {
        let normalized = mapRpcBlock(block, this.withTraces, this.withStateDiffs)
        let jsonLine = JSON.stringify(toJSON(normalized)) + '\n'
        let jsonLineGzip = await gzip(jsonLine, {
            level: zlib.constants.Z_BEST_COMPRESSION
        })

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
