import {addErrorContext, assertNotNull, unexpectedCase} from '@subsquid/util-internal'
import {ArchiveClient} from '@subsquid/util-internal-archive-client'
import {archiveIngest} from '@subsquid/util-internal-ingest-tools'
import {Batch, DataSource} from '@subsquid/util-internal-processor-tools'
import {getRequestAt, RangeRequest} from '@subsquid/util-internal-range'
import {cast} from '@subsquid/util-internal-validation'
import assert from 'assert'
import {Bytes32} from '../interfaces/base'
import {FieldSelection} from '../interfaces/data'
import {DataRequest} from '../interfaces/data-request'
import {
    Block,
    BlockHeader,
    Log,
    StateDiff,
    StateDiffAdd,
    StateDiffChange,
    StateDiffDelete,
    StateDiffNoChange,
    Trace,
    TraceCall,
    TraceCreate,
    TraceReward,
    TraceSuicide,
    Transaction
} from '../mapping/entities'
import {setUpRelations} from '../mapping/relations'
import {getBlockValidator} from './schema'
import {mapBlock} from './mapping'


const NO_FIELDS = {}


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
        for await (let batch of archiveIngest({
            requests,
            client: this.client,
            stopOnHead
        })) {
            let fields = getRequestAt(requests, batch.blocks[0].header.number)?.fields || NO_FIELDS

            let blocks = batch.blocks.map(b => {
                try {
                    return mapBlock(b, fields)
                } catch(err: any) {
                    throw addErrorContext(err, {
                        blockHeight: b.header.number,
                        blockHash: b.header.hash
                    })
                }
            })

            yield {blocks, isHead: batch.isHead}
        }
    }
}