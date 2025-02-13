import {mapRpcBlock, removeVotes} from '@subsquid/solana-normalization'
import * as rpc from '@subsquid/solana-rpc'
import {withErrorContext} from '@subsquid/util-internal'
import {Block, BlockRef, BlockStream, DataSource, StreamRequest} from '@subsquid/util-internal-data-service'
import {toJSON} from '@subsquid/util-internal-json'
import {promisify} from 'node:util'
import * as zlib from 'node:zlib'


const gzip = promisify(zlib.gzip)


export class Source implements DataSource<Block> {
    constructor(
        private inner: DataSource<rpc.Block>,
        private votes = false
    ) {}

    getFinalizedHead(): Promise<BlockRef> {
        return this.inner.getFinalizedHead()
    }

    getFinalizedStream(req: StreamRequest): BlockStream<Block> {
        return this.mapRpcStream(this.inner.getFinalizedStream(req))
    }

    getStream(req: StreamRequest): BlockStream<Block> {
        return this.mapRpcStream(this.inner.getStream(req))
    }

    private async *mapRpcStream(stream: BlockStream<rpc.Block>): BlockStream<Block> {
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
        let normalized = mapRpcBlock(block.slot, block.block)
        if (!this.votes) {
            removeVotes(normalized)
        }

        let {
            header: {slot, parentSlot, ...hdr},
            ...items
        } = normalized

        let json = {
            header: {
                number: slot,
                parentNumber: parentSlot,
                ...hdr
            },
            ...items
        }

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
