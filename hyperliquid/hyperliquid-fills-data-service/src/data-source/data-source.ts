import {Block} from '@subsquid/hyperliquid-fills-data'
import {last} from '@subsquid/util-internal'
import {BlockRef, BlockStream, DataSource, StreamRequest} from '@subsquid/util-internal-data-service'
import {HyperliquidGateway} from './gateway'


export class HyperliquidGatewayDataSource implements DataSource<Block> {
    constructor(private gateway: HyperliquidGateway) {}

    async getHead(): Promise<BlockRef> {
        for await (let batch of this.gateway.getStream()) {
            let lastBlock = last(batch.blocks)
            return {
                number: lastBlock.block_number,
                hash: '0x0000000000000000000000000000000000000000000000000000000000000000'
            }
        }
        throw new Error('failed to get head of the chain')
    }

    getFinalizedHead(): Promise<BlockRef> {
        return this.getHead()
    }

    getFinalizedStream(req: StreamRequest): BlockStream<Block> {
        return this.getStream(req)
    }

    getStream(req: StreamRequest): BlockStream<Block> {
        return this.gateway.getStream(req.from)
    }
}
