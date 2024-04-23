import {assertNotNull} from '@subsquid/util-internal'
import {ArchiveClient} from '@subsquid/util-internal-archive-client'
import {archiveIngest} from '@subsquid/util-internal-ingest-tools'
import {Batch, DataSource} from '@subsquid/util-internal-processor-tools'
import {getRequestAt, mapRangeRequestList, RangeRequestList} from '@subsquid/util-internal-range'
import {array, cast} from '@subsquid/util-internal-validation'
import assert from 'assert'
import {DataRequest} from '../interfaces/data-request'
import {Block, mapBlock} from '../mapping'
import {getDataSchema} from './data-schema'


export class FuelArchive implements DataSource<Block, DataRequest> {
    constructor(private client: ArchiveClient) {}

    getFinalizedHeight(): Promise<number> {
        return this.client.getHeight()
    }

    async getBlockHash(height: number): Promise<string | undefined> {
        let blocks = await this.client.query({
            fromBlock: height,
            toBlock: height,
            includeAllBlocks: true
        })
        assert(blocks.length == 1)
        return blocks[0].header.hash
    }

    async *getFinalizedBlocks(requests: RangeRequestList<DataRequest>, stopOnHead?: boolean | undefined): AsyncIterable<Batch<Block>> {
        let archiveRequests = mapRangeRequestList(requests, req => {
            let {fields, ...items} = req
            return {
                type: 'fuel',
                fields,
                ...items
            }
        })

        for await (let batch of archiveIngest({
            client: this.client,
            requests: archiveRequests,
            stopOnHead
        })) {
            let req = getRequestAt(requests, batch.blocks[0].header.number)

            let blocks = cast(
                array(getDataSchema(assertNotNull(req?.fields))),
                batch.blocks
            ).map(b => {
                let {header: {number, ...hdr}, ...items} = b
                return mapBlock({
                    header: {height: number, ...hdr},
                    ...items
                })
            })

            yield {blocks, isHead: batch.isHead}
        }
    }
}
