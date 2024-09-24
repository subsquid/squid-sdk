import {mapRangeRequestList, RangeRequestList} from '@subsquid/util-internal-range'
import {
    Block,
    DataRequest as RawDataRequest,
    HttpDataSource as RawHttpDataSource
} from '@subsquid/tron-data'
import {mapBlock} from '@subsquid/tron-normalization'
import {DataRequest} from './data/data-request'
import {PartialBlock} from './data/data-partial'
// import {filterBlockBatch} from './filter'


export class HttpDataSource {
    constructor(private baseDataSource: RawHttpDataSource) { }

    async getFinalizedHeight(): Promise<number> {
        return this.baseDataSource.getFinalizedHeight()
    }

    async getBlockHash(height: number): Promise<string | undefined> {
        let header = await this.baseDataSource.getBlockHeader(height)
        return header.blockID
    }

    getBlockHeader(height: number): Promise<Block | undefined> {
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
            let blocks = batch.blocks.map(mapBlock)
            // filterBlockBatch(requests, blocks)
            yield blocks
        }
    }
}


function toRawDataRequest(req: DataRequest): RawDataRequest {
    return {
        transactions: false,
        transactionsInfo: false
    }
}
