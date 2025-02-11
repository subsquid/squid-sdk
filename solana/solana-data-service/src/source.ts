import {mapRpcBlock} from '@subsquid/solana-normalization'
import * as rpc from '@subsquid/solana-rpc'
import {withErrorContext} from '@subsquid/util-internal'
import {Block, BlockRef, BlockStream, DataSource, StreamRequest} from '@subsquid/util-internal-data-service'
import {toJSON} from '@subsquid/util-internal-json'
import * as zlib from 'node:zlib'


export class Source implements DataSource<Block> {
    constructor(private inner: DataSource<rpc.Block>) {}

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
                blocks: await this.mapRpcBlocks(blocks),
                ...props
            }
        }
    }

    private mapRpcBlocks(blocks: rpc.Block[]): Promise<Block[]> {
        return Promise.all(blocks.map(block => {
            return transformRpcBlock(block).catch(withErrorContext({
                blockSlot: block.slot,
                blockHash: block.block.blockhash
            }))
        }))
    }
}


async function transformRpcBlock(block: rpc.Block): Promise<Block> {
    let data = mapRpcBlock(block.slot, block.block)
    let jsonLine = JSON.stringify(toJSON(data)) + '\n'

    let jsonLineGzip: Uint8Array = await new Promise((resolve, reject) => {
        zlib.gzip(jsonLine, (err, data) => {
            if (err == null) {
                resolve(data)
            } else {
                reject(err)
            }
        })
    })

    return {
        number: block.slot,
        hash: block.block.blockhash,
        parentNumber: block.block.parentSlot,
        parentHash: block.block.previousBlockhash,
        timestamp: block.block.blockTime && block.block.blockTime * 1000 || undefined,
        jsonLineGzip
    }
}
