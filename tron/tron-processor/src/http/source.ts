import {mapRangeRequestList, RangeRequestList} from '@subsquid/util-internal-range'
import * as base from '@subsquid/tron-data'
import {mapBlock} from '@subsquid/tron-normalization'
import {Batch, HotDatabaseState, HotDataSource, HotUpdate} from '@subsquid/util-internal-processor-tools'
import {DataRequest} from '../data/data-request'
import {filterBlockBatch} from './filter'
import {Block} from '../mapping/entities'
import {setUpRelations} from '../mapping/relations'


export class HttpDataSource implements HotDataSource<Block, DataRequest> {
    constructor(private baseDataSource: base.HttpDataSource) {}

    async getFinalizedHeight(): Promise<number> {
        return this.baseDataSource.getFinalizedHeight()
    }

    async getBlockHash(height: number): Promise<string | undefined> {
        let header = await this.baseDataSource.getBlockHeader(height)
        return header?.blockID
    }

    async *getFinalizedBlocks(
        requests: RangeRequestList<DataRequest>,
        stopOnHead?: boolean
    ): AsyncIterable<Batch<Block>> {
        for await (let batch of this.baseDataSource.getFinalizedBlocks(
            mapRangeRequestList(requests, toRawDataRequest),
            stopOnHead
        )) {
            let blocks = batch.blocks.map(b => mapBlock(b))
            filterBlockBatch(requests, blocks)
            yield {
                ...batch,
                blocks: blocks.map(b => {
                    let block = Block.fromPartial(b)
                    setUpRelations(block)
                    return block
                })
            }
        }
    }

    async processHotBlocks(
        requests: RangeRequestList<DataRequest>,
        state: HotDatabaseState,
        cb: (upd: HotUpdate<Block>) => Promise<void>
    ): Promise<void> {
        return this.baseDataSource.processHotBlocks(
            mapRangeRequestList(requests, toRawDataRequest),
            state,
            upd => {
                let blocks = upd.blocks.map(b => mapBlock(b))
                filterBlockBatch(requests, blocks)
                return cb({...upd, blocks: blocks.map(b => {
                    let block = Block.fromPartial(b)
                    setUpRelations(block)
                    return block
                })})
            }
        )
    }
}


function toRawDataRequest(req: DataRequest): base.DataRequest {
    let transactions = !!req.transactions?.length ||
        !!req.logs?.length ||
        !!req.internalTransactions?.length ||
        !!req.transferTransactions?.length ||
        !!req.transferAssetTransactions?.length ||
        !!req.triggerSmartContractTransactions?.length
    return {
        transactions,
        transactionsInfo: (transactions && isRequested(TX_INFO_FIELDS, req.fields?.transaction)) ||
            !!req.logs?.length ||
            !!req.internalTransactions?.length ||
            !!req.transactions?.some(req => req.include?.internalTransactions || req.include?.logs) ||
            !!req.transferTransactions?.some(req => req.include?.internalTransactions || req.include?.logs) ||
            !!req.transferAssetTransactions?.some(req => req.include?.internalTransactions || req.include?.logs) ||
            !!req.triggerSmartContractTransactions?.some(req => req.include?.internalTransactions || req.include?.logs)
    }
}


const TX_INFO_FIELDS = {
    contractResult: true,
    contractAddress: true,
    resMessage: true,
    result: true,
    fee: true,
    withdrawAmount: true,
    unfreezeAmount: true,
    withdrawExpireAmount: true,
    energyFee: true,
    energyUsage: true,
    energyUsageTotal: true,
    netUsage: true,
    netFee: true,
    originEnergyUsage: true,
    energyPenaltyTotal: true,
    cancelUnfreezeV2Amount: true
}


function isRequested(set: Record<string, boolean>, selection?: Record<string, boolean>): boolean {
    if (selection == null) return false
    for (let key in selection) {
        if (set[key] && selection[key]) return true
    }
    return false
}
