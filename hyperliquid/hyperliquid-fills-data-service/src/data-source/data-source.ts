import {Block} from '@subsquid/hyperliquid-fills-data'
import {last} from '@subsquid/util-internal'
import {BlockRef, BlockStream, DataSource, StreamRequest} from '@subsquid/util-internal-data-service'
import assert from 'assert'
import {HyperliquidGateway, IngestBatch} from './gateway'


export class HyperliquidGatewayDataSource implements DataSource<Block> {
    constructor(private gateway: HyperliquidGateway) {}

    async getHead(): Promise<BlockRef> {
        for await (let batch of this.gateway.getStream()) {
            let lastBlock = last(batch.blocks)
            return getBlockRef(lastBlock)
        }
        throw new Error('failed to get head of the chain')
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
            batch.finalizedHead = getBlockRef(lastBlock)
            yield batch
        }
    }
}


function getBlockRef(block: Block): BlockRef {
    return {
        number: block.block_number,
        hash: '0x0000000000000000000000000000000000000000000000000000000000000000'
    }
}


async function* limitUpperBoundary(stream: AsyncIterable<IngestBatch>, to: number): BlockStream<Block> {
    for await (let batch of stream) {
        if (last(batch.blocks).block_number >= to) {
            batch.blocks = batch.blocks.filter(block => block.block_number <= to)
            yield batch
            return
        }
        yield batch
    }
}


async function* ensureContinuity(stream: AsyncIterable<IngestBatch>, from: number): BlockStream<Block> {
    let expected = from
    for await (let batch of stream) {
        let blocks: Block[] = []

        for (let block of batch.blocks) {
            assert(block.block_number >= expected)

            while (block.block_number > expected) {
                blocks.push(emptyBlock(expected))
                expected += 1
            }

            blocks.push(block)
            expected += 1
        }

        batch.blocks = blocks
        yield batch
    }
}


function emptyBlock(blockNumber: number) {
    return {
        block_number: blockNumber,
        block_time: '1970-01-01T00:00:00.000Z',
        local_time: '1970-01-01T00:00:00.000Z',
        events: []
    }
}
