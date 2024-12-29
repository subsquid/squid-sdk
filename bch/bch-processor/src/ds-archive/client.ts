import {addErrorContext} from '@subsquid/util-internal'
import {ArchiveClient} from '@subsquid/util-internal-archive-client'
import {archiveIngest} from '@subsquid/util-internal-ingest-tools'
import {Batch, DataSource} from '@subsquid/util-internal-processor-tools'
import {getRequestAt, RangeRequest} from '@subsquid/util-internal-range'
import {cast} from '@subsquid/util-internal-validation'
import assert from 'assert'
import {Bytes32} from '../interfaces/base.js'
import {FieldSelection} from '../interfaces/data.js'
import {DataRequest} from '../interfaces/data-request.js'
import {
    Block,
    BlockHeader,
    Transaction
} from '../mapping/entities.js'
import {setUpRelations} from '../mapping/relations.js'
import {getBlockValidator} from './schema.js'


const NO_FIELDS = {}


export class BchArchive implements DataSource<Block, DataRequest> {
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
        for await (let batch of archiveIngest({
            requests,
            client: this.client,
            stopOnHead
        })) {
            let fields = getRequestAt(requests, batch.blocks[0].header.number)?.fields || NO_FIELDS

            let blocks = batch.blocks.map(b => {
                try {
                    return this.mapBlock(b, fields)
                } catch(err: any) {
                    throw addErrorContext(err, {
                        blockHeight: b.header.number,
                        blockHash: b.header.hash
                    })
                }
            })

            yield {blocks, isHead: batch.isHead, mempoolTransactions: []}
        }
    }

    private mapBlock(rawBlock: unknown, fields: FieldSelection): Block {
        let validator = getBlockValidator(fields)

        let src = cast(validator, rawBlock)

        let {height, hash, parentHash, ...hdr} = src.header
        if (hdr.timestamp) {
            hdr.timestamp = hdr.timestamp * 1000 // convert to ms
        }

        let header = new BlockHeader(height, hash, parentHash)
        Object.assign(header, hdr)

        let block = new Block(header)

        if (src.transactions) {
            for (let {...props} of src.transactions) {
                let tx = new Transaction(header, 0)
                Object.assign(tx, props)
                block.transactions.push(tx)
            }
        }

        setUpRelations(block)

        return block
    }
}
