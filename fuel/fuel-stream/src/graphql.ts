import {mapRangeRequestList, RangeRequestList} from '@subsquid/util-internal-range'
import {HttpDataSource} from '@subsquid/fuel-data/lib/data-source'
import {BlockHeader, DataRequest as RawDataRequest} from '@subsquid/fuel-data/lib/raw-data'
import {mapRawBlock} from '@subsquid/fuel-normalization'
import {DataRequest} from './data/data-request'
import {PartialBlock} from './data/data-partial'
import {filterBlockBatch} from './filter'


export class GraphqlDataSource {
    constructor(private baseDataSource: HttpDataSource) { }

    async getFinalizedHeight(): Promise<number> {
        return this.baseDataSource.getFinalizedHeight()
    }

    getBlockHash(height: number): Promise<string | undefined> {
        return this.baseDataSource.getBlockHash(height)
    }

    getBlockHeader(height: number): Promise<BlockHeader | undefined> {
        return this.baseDataSource.getBlockHeader(height)
    }

    async *getBlockStream(
        requests: RangeRequestList<DataRequest>,
        stopOnHead?: boolean
    ): AsyncIterable<PartialBlock[]> {
        for await (let batch of this.baseDataSource.getFinalizedBlocks(
            mapRangeRequestList(requests, toRawDataRequest),
            stopOnHead
        )) {
            let blocks = batch.blocks.map(b => mapRawBlock(b))
            filterBlockBatch(requests, blocks)
            yield blocks
        }
    }
}


function toRawDataRequest(req: DataRequest): RawDataRequest {
    return {
        transactions: !!req.transactions?.length
            || !!req.inputs?.length
            || !!req.outputs?.length
            || !!req.receipts?.length,
        inputs: !!req.inputs?.length,
        outputs: !!req.outputs?.length,
        receipts: !!req.receipts?.length
    }
}
