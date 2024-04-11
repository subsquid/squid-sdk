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

    // getFinalizedBlocks(
    //     requests: RangeRequest<DataRequest>[],
    //     stopOnHead?: boolean
    // ): AsyncIterable<Batch<Block>> {
    //     return coldIngest({
    //         getFinalizedHeight: () => this.getFinalizedHeight(),
    //         getSplit: req => {
    //             this.baseDataSource.getFinalizedBlocks
    //         },
    //         requests: mapRangeRequestList(requests, req => req),
    //         splitSize: 10,
    //         concurrency: 5,
    //         // concurrency: Math.min(5, this.rpc.client.getConcurrency()),
    //         stopOnHead,
    //         headPollInterval: this.headPollInterval
    //     })
    // }

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
        // if (requests.length == 0) return

        // let mappingRequests = mapRangeRequestList(requests, req => this.toMappingRequest(req))

        // let self = this

        // let proc = new HotProcessor<Block>(state, {
        //     process: cb,
        //     getBlock: async ref => {
        //         let req = getRequestAt(mappingRequests, ref.height) || NO_REQUEST
        //         let block = await this.rpc.getColdBlock(ref.hash, req, proc.getFinalizedHeight())
        //         return mapBlock(block, req)
        //     },
        //     async *getBlockRange(from: number, to: BlockRef): AsyncIterable<Block[]> {
        //         assert(to.height != null)
        //         if (from > to.height) {
        //             from = to.height
        //         }
        //         for (let split of splitRangeByRequest(mappingRequests, {from, to: to.height})) {
        //             let request = split.request || NO_REQUEST
        //             for (let range of splitRange(10, split.range)) {
        //                 let rpcBlocks = await self.rpc.getHotSplit({
        //                     range,
        //                     request,
        //                     finalizedHeight: proc.getFinalizedHeight()
        //                 })
        //                 let blocks = rpcBlocks.map(b => mapBlock(b, request))
        //                 let lastBlock = maybeLast(blocks)?.header.height ?? range.from - 1
        //                 yield blocks
        //                 if (lastBlock < range.to) {
        //                     throw new BlockConsistencyError({height: lastBlock + 1})
        //                 }
        //             }
        //         }
        //     },
        //     getHeader(block) {
        //         return block.header
        //     }
        // })

        // let isEnd = () => proc.getFinalizedHeight() >= rangeEnd(last(requests).range)

        // let navigate = (head: {height: number, hash?: Bytes32}): Promise<void> => {
        //     return proc.goto({
        //         best: head,
        //         finalized: {
        //             height: Math.max(head.height - this.finalityConfirmation, 0)
        //         }
        //     })
        // }

        // if (this.rpc.client.supportsNotifications()) {
        //     return this.subscription(navigate, isEnd)
        // } else {
        //     return this.polling(navigate, isEnd)
        // }
    }

    // private async polling(cb: (head: {height: number}) => Promise<void>, isEnd: () => boolean): Promise<void> {
    //     let prev = -1
    //     let height = new Throttler(() => this.rpc.getHeight(), this.headPollInterval)
    //     while (!isEnd()) {
    //         let next = await height.call()
    //         if (next <= prev) continue
    //         prev = next
    //         for (let i = 0; i < 100; i++) {
    //             try {
    //                 await cb({height: next})
    //                 break
    //             } catch(err: any) {
    //                 if (isDataConsistencyError(err)) {
    //                     this.log?.write(
    //                         i > 0 ? LogLevel.WARN : LogLevel.DEBUG,
    //                         err.message
    //                     )
    //                     await wait(100)
    //                 } else {
    //                     throw err
    //                 }
    //             }
    //         }
    //     }
    // }
}
