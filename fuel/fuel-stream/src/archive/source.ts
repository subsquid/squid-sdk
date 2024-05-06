import {BlockHeader} from '@subsquid/fuel-normalization'
import {assertNotNull} from '@subsquid/util-internal'
import {ArchiveClient} from '@subsquid/util-internal-archive-client'
import {archiveIngest} from '@subsquid/util-internal-ingest-tools'
import {getRequestAt, mapRangeRequestList, RangeRequestList} from '@subsquid/util-internal-range'
import {array, cast} from '@subsquid/util-internal-validation'
import assert from 'assert'
import {DataRequest} from '../data/data-request'
import {getDataSchema} from './data-schema'
import {PartialBlock} from '../data/data-partial'


export class FuelGateway {
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

    async getBlockHeader(height: number): Promise<BlockHeader> {
        let blocks = await this.client.query({
            type: 'fuel',
            fromBlock: height,
            toBlock: height,
            includeAllBlocks: true,
            fields: {
                block: {
                    daHeight: true,
                    transactionsRoot: true,
                    transactionsCount: true,
                    messageReceiptRoot: true,
                    messageReceiptCount: true,
                    prevRoot: true,
                    time: true,
                    applicationHash: true
                }
            }
        })
        assert(blocks.length == 1)
        let {number, ...rest} = blocks[0].header
        return {
            height: number,
            ...rest
        } as BlockHeader
    }

    async *getBlockStream(requests: RangeRequestList<DataRequest>, stopOnHead?: boolean | undefined): AsyncIterable<PartialBlock[]> {
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
                return {
                    header: {height: number, ...hdr},
                    ...items
                }
            })

            yield blocks
        }
    }
}
