import {mapRangeRequestList, RangeRequestList} from '@subsquid/util-internal-range'
import {
    Block,
    DataRequest as RawDataRequest,
    HttpDataSource as RawHttpDataSource
} from '@subsquid/tron-data'
import {mapBlock} from '@subsquid/tron-normalization'
import {DataRequest} from '../data/data-request'
import {PartialBlock} from '../data/data-partial'
import {filterBlockBatch} from './filter'


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
            filterBlockBatch(requests, blocks)
            yield blocks
        }
    }
}


function toRawDataRequest(req: DataRequest): RawDataRequest {
    return {
        transactions: !!req.transactions?.length ||
            !!req.logs?.length ||
            !!req.internalTransactions?.length ||
            !!req.transferTransactions?.length ||
            !!req.transferAssetTransactions?.length ||
            !!req.triggerSmartContractTransactions?.length,
        transactionsInfo: !!req.logs?.length ||
            !!req.internalTransactions?.length ||
            !!req.transactions?.some(req => req.include?.internalTransactions || req.include?.logs) ||
            !!req.transferTransactions?.some(req => req.include?.internalTransactions || req.include?.logs) ||
            !!req.transferAssetTransactions?.some(req => req.include?.internalTransactions || req.include?.logs) ||
            !!req.triggerSmartContractTransactions?.some(req => req.include?.internalTransactions || req.include?.logs)
    }
}
