import {Logger} from '@subsquid/logger'
import {Batch, HotDatabaseState, HotDataSource, HotUpdate} from '@subsquid/util-internal-processor-tools'
import {mapRangeRequestList, RangeRequestList} from '@subsquid/util-internal-range'
import {HttpDataSource} from '@subsquid/fuel-data/lib/data-source'
import {mapRawBlock} from '@subsquid/fuel-data/lib/mapping'
import {DataRequest} from './interfaces/data-request'
import {mapBlock, Block} from './mapping'
import {filterBlockBatch} from './filter'


export interface GraphqlDataSourceOptions {
    baseDataSource: HttpDataSource
    newHeadTimeout?: number
    headPollInterval?: number
    log?: Logger
}


export class GraphqlDataSource implements HotDataSource<Block, DataRequest> {
    private baseDataSource: HttpDataSource
    private headPollInterval: number
    private newHeadTimeout: number
    private log?: Logger

    constructor(options: GraphqlDataSourceOptions) {
        this.log = options.log
        this.baseDataSource = options.baseDataSource
        this.headPollInterval = options.headPollInterval || 5_000
        this.newHeadTimeout = options.newHeadTimeout || 0
    }

    async getFinalizedHeight(): Promise<number> {
        return this.baseDataSource.getFinalizedHeight()
    }

    getBlockHash(height: number): Promise<string | undefined> {
        return this.baseDataSource.getBlockHash(height)
    }

    async *getFinalizedBlocks(
        requests: RangeRequestList<DataRequest>,
        stopOnHead?: boolean
    ): AsyncIterable<Batch<Block>> {
        for await (let batch of this.baseDataSource.getFinalizedBlocks(
            mapRangeRequestList(requests, (req) => req),
            stopOnHead
        )) {
            let blocks = batch.blocks.map(b => mapBlock(mapRawBlock(b)))
            filterBlockBatch(requests, blocks)
            yield {
                ...batch,
                blocks
            }
        }
    }

    async processHotBlocks(
        requests: RangeRequestList<DataRequest>,
        state: HotDatabaseState,
        cb: (upd: HotUpdate<Block>) => Promise<void>
    ): Promise<void> { 
        throw new Error('All blocks in Fuel are finalized')
    }
}
