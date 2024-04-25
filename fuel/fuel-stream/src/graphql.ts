import {mapRangeRequestList, RangeRequestList} from '@subsquid/util-internal-range'
import {HttpDataSource} from '@subsquid/fuel-data/lib/data-source'
import {BlockHeader} from '@subsquid/fuel-data/lib/raw-data'
import {mapRawBlock} from '@subsquid/fuel-normalization'
import {DataRequest} from './interfaces/data-request'
import {PartialBlock} from './interfaces/data-partial'
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
            mapRangeRequestList(requests, (req) => req),
            stopOnHead
        )) {
            let blocks = batch.blocks.map(b => mapRawBlock(b))
            filterBlockBatch(requests, blocks)
            yield blocks
        }
    }
}
