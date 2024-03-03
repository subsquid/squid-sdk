import {Base58Bytes} from '@subsquid/solana-data'
import {ArchiveClient} from '@subsquid/util-internal-archive-client'
import {archiveIngest} from '@subsquid/util-internal-ingest-tools'
import {Batch, DataSource} from '@subsquid/util-internal-processor-tools'
import {mapRangeRequestList, RangeRequestList} from '@subsquid/util-internal-range'
import assert from 'assert'
import {getFields} from '../fields'
import {DataRequest} from '../interfaces/data-request'
import {Block} from '../mapping/items'


export class SolanaArchive implements DataSource<Block, DataRequest> {
    constructor(private client: ArchiveClient) {}

    getFinalizedHeight(): Promise<number> {
        return this.client.getHeight()
    }

    async getBlockHash(height: number): Promise<Base58Bytes | undefined> {
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
                type: 'solana',
                fields: {
                    block: {parentHash: true, ...fields?.block},
                    transaction: fields?.transaction,
                    instruction: fields?.instruction,
                    log: {instructionAddress: true, ...fields?.instruction},
                    balance: fields?.balance
                },
                ...items
            }
        })

        for await (let {blocks, isHead} of archiveIngest({
            client: this.client,
            requests: archiveRequests,
            stopOnHead
        })) {

        }
    }
}
