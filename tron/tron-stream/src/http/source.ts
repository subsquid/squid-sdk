import {applyRangeBound, mapRangeRequestList, RangeRequestList} from '@subsquid/util-internal-range'
import {
    DataRequest as RawDataRequest,
    HttpDataSource as RawHttpDataSource
} from '@subsquid/tron-data'
import {BlockHeader, mapBlock, mapBlockHeader} from '@subsquid/tron-normalization'
import {DataRequest} from '../data/data-request'
import {BlocksData, PartialBlock} from '../data/data-partial'
import {filterBlockBatch} from './filter'
import assert from 'assert'
import {last} from '@subsquid/util-internal'


export class HttpDataSource {
    constructor(private baseDataSource: RawHttpDataSource) { }

    async getFinalizedHeight(): Promise<number> {
        return this.baseDataSource.getFinalizedHeight()
    }

    async getBlockHash(height: number): Promise<string | undefined> {
        let header = await this.getBlockHeader(height)
        return header?.hash
    }

    async getBlockHeader(height: number): Promise<BlockHeader | undefined> {
        let header = await this.baseDataSource.getBlockHeader(height)
        return header ? mapBlockHeader(header) : undefined
    }

    async *getBlockStream(opts: {
        requests: RangeRequestList<DataRequest>,
        stopOnHead?: boolean
        supportHotBlocks?: boolean
    }): AsyncIterable<BlocksData<PartialBlock>> {
        let requests = opts.requests
        let from = requests[0].range.from

        while (true) {
            requests = applyRangeBound(requests, {from})

            for await (let batch of this.baseDataSource.getFinalizedBlocks(
                mapRangeRequestList(requests, toRawDataRequest),
                !!opts.supportHotBlocks || opts.stopOnHead
            )) {
                // FIXME: needs to be done during batch ingestion
                let finalizedHeight = await this.getFinalizedHeight()
                let finalizedHead = await this.getBlockHeader(finalizedHeight)
                assert(finalizedHead != null)
    
                let blocks = batch.blocks.map(mapBlock)
                filterBlockBatch(requests, blocks)
                yield {finalizedHead, blocks: blocks as PartialBlock[]}
                from = last(blocks).header.height + 1
            }
    
            if (opts.supportHotBlocks) {
                requests = applyRangeBound(requests, {from})

                for await (let data of this.baseDataSource.getHotBlocks(
                    mapRangeRequestList(requests, toRawDataRequest),
                )) {
                    let blocks = data.blocks.map(mapBlock)
                    filterBlockBatch(requests, blocks)
                    yield {finalizedHead: data.finalizedHead, blocks: blocks as PartialBlock[]}
                    from = Math.min(last(blocks).header.height, data.finalizedHead.height) + 1
                }
            }

            if (opts.stopOnHead) break
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
