import {ArchiveClient} from '@subsquid/util-internal-archive-client'
import {
    archiveIngest,
    Batch,
    DataSource,
    PollingHeightTracker,
    RangeRequest,
    SplitRequest
} from '@subsquid/util-internal-processor-tools'
import assert from 'assert'
import {AllFields, BlockData} from '../interfaces/data'
import {DataRequest} from '../interfaces/data-request'
import {Bytes32} from '../interfaces/evm'
import * as gw from './gateway'
import {mapGatewayBlock, withDefaultFields} from './mapping'


type Block = BlockData<AllFields>


export class EvmArchive implements DataSource<Block, DataRequest> {
    constructor(private client: ArchiveClient) {}

    getFinalizedHeight(): Promise<number> {
        return this.client.getHeight()
    }

    async getBlockHash(height: number): Promise<Bytes32> {
        let blocks = await this.query({
            fromBlock: height,
            toBlock: height,
            includeAllBlocks: true
        })
        assert(blocks.length == 1)
        return blocks[0].header.hash
    }

    getFinalizedBlocks(requests: RangeRequest<DataRequest>[], stopOnHead?: boolean | undefined): AsyncIterable<Batch<Block>> {
        return archiveIngest({
            requests,
            heightTracker: new PollingHeightTracker(() => this.getFinalizedHeight(), 10_000),
            query: s => this.fetchSplit(s),
            stopOnHead
        })
    }

    private async fetchSplit(s: SplitRequest<DataRequest>): Promise<Block[]> {
        let blocks = await this.query({
            fromBlock: s.range.from,
            toBlock: s.range.to,
            fields: withDefaultFields(s.request.fields),
            includeAllBlocks: !!s.request.includeAllBlocks,
            transactions: s.request.transactions,
            logs: s.request.logs,
            traces: s.request.traces,
            stateDiffs: s.request.stateDiffs
        })

        return blocks.map(mapGatewayBlock)
    }

    private query(q: gw.BatchRequest): Promise<gw.BlockData[]> {
        return this.client.query(q)
    }
}
