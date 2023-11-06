import {ArchiveClient} from '@subsquid/util-internal-archive-client'
import {archiveIngest} from '@subsquid/util-internal-ingest-tools'
import {Batch, DataSource, mapRangeRequestList, RangeRequest} from '@subsquid/util-internal-processor-tools'
import assert from 'assert'
import {Bytes32} from '../interfaces/base'
import {AllFields, BlockData} from '../interfaces/data'
import {DataRequest} from '../interfaces/data-request'
import * as gw from './gateway'
import {mapGatewayBlock, withDefaultFields} from './mapping'


type Block = BlockData<AllFields>


export class EvmArchive implements DataSource<Block, DataRequest> {
    constructor(private client: ArchiveClient) {}

    getFinalizedHeight(): Promise<number> {
        return this.client.getHeight()
    }

    async getBlockHash(height: number): Promise<Bytes32> {
        let blocks = await this.client.query({
            fromBlock: height,
            toBlock: height,
            includeAllBlocks: true
        })
        assert(blocks.length == 1)
        return blocks[0].header.hash
    }

    async *getFinalizedBlocks(requests: RangeRequest<DataRequest>[], stopOnHead?: boolean | undefined): AsyncIterable<Batch<Block>> {
        let archiveRequests = mapRangeRequestList(requests, req => {
            let {fields, ...items} = req
            return {
                fields: withDefaultFields(fields),
                ...items
            }
        })

        for await (let {blocks, isHead} of archiveIngest<gw.BlockData>({
            requests: archiveRequests,
            client: this.client,
            stopOnHead
        })) {
            yield {
                blocks: blocks.map(mapGatewayBlock),
                isHead
            }
        }
    }
}
