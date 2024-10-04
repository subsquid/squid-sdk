import {assertNotNull} from '@subsquid/util-internal'
import {ArchiveClient} from '@subsquid/util-internal-archive-client'
import {archiveIngest} from '@subsquid/util-internal-ingest-tools'
import {DataSource, Batch} from '@subsquid/util-internal-processor-tools'
import {getRequestAt, mapRangeRequestList, RangeRequestList} from '@subsquid/util-internal-range'
import {array, cast} from '@subsquid/util-internal-validation'
import assert from 'assert'
import {DataRequest} from '../data/data-request'
import {getDataSchema} from './data-schema'
import {Block} from '../mapping/entities'
import {setUpRelations} from '../mapping/relations'


export class TronGateway implements DataSource<Block, DataRequest> {
    constructor(private client: ArchiveClient) {}

    getFinalizedHeight(): Promise<number> {
        return this.client.getHeight()
    }

    async getBlockHash(height: number): Promise<string | undefined> {
        let blocks = await this.client.query({
            type: 'tron',
            fromBlock: height,
            toBlock: height,
            includeAllBlocks: true
        })
        assert(blocks.length == 1)
        return blocks[0].header.hash
    }

    async *getFinalizedBlocks(
        requests: RangeRequestList<DataRequest>,
        stopOnHead?: boolean
    ): AsyncIterable<Batch<Block>> {
        let archiveRequests = mapRangeRequestList(requests, req => {
            let {fields, includeAllBlocks, ...items} = req
            let archiveItems: any = {}
            let key: keyof typeof items
            for (key in items) {
                archiveItems[key] = items[key]?.map(it => ({...it.where, ...it.include}))
            }
            return {
                type: 'tron',
                fields,
                includeAllBlocks,
                ...archiveItems
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
                let block = Block.fromPartial({
                    header: {height: number, ...hdr},
                    ...items
                })

                setUpRelations(block)

                return block
            })

            yield {blocks, isHead: batch.isHead}
        }
    }
}
