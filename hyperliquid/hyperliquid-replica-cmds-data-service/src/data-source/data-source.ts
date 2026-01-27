import {Block} from '@subsquid/hyperliquid-replica-cmds-data'
import {last} from '@subsquid/util-internal'
import {BlockRef, BlockStream, DataSource, StreamRequest} from '@subsquid/util-internal-data-service'
import assert from 'assert'
import {HyperliquidGateway, IngestBatch} from './gateway'


export class HyperliquidGatewayDataSource implements DataSource<Block> {
    constructor(private gateway: HyperliquidGateway) {}

    async getHead(): Promise<BlockRef> {
        let height = await this.gateway.getFinalizedHeight()
        return getBlockRef(height)
    }

    getFinalizedHead(): Promise<BlockRef> {
        return this.getHead()
    }

    getFinalizedStream(req: StreamRequest): BlockStream<Block> {
        return this.getStream(req)
    }

    async *getStream(req: StreamRequest): BlockStream<Block> {
        let stream = ensureContinuity(this.gateway.getStream(req.from), req.from)
        if (req.to) {
            stream = limitUpperBoundary(stream, req.to)
        }
        for await (let batch of stream) {
            let lastBlock = last(batch.blocks)
            batch.finalizedHead = getBlockRef(lastBlock.height)
            yield batch
        }
    }
}


function getBlockRef(height: number): BlockRef {
    return {
        number: height,
        hash: '0x0000000000000000000000000000000000000000000000000000000000000000'
    }
}


async function* limitUpperBoundary(stream: AsyncIterable<IngestBatch>, to: number): BlockStream<Block> {
    for await (let batch of stream) {
        if (last(batch.blocks).height >= to) {
            batch.blocks = batch.blocks.filter(block => block.height <= to)
            yield batch
            return
        }
        yield batch
    }
}


async function* ensureContinuity(stream: AsyncIterable<IngestBatch>, from: number): BlockStream<Block> {
    let parentRound
    for await (let batch of stream) {
        for (let block of batch.blocks) {
            if (parentRound != null) {
                assert(parentRound == block.block.abci_block.parent_round)
            }
            parentRound = block.block.abci_block.round
        }
        yield batch
    }
}
