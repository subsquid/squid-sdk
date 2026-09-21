import {
    Batch,
    coldIngest,
    BlockConsistencyError,
    HotState,
    HotUpdate,
    HotProcessor,
    BlockRef,
    isDataConsistencyError
} from '@subsquid/util-internal-ingest-tools'
import {
    RangeRequest,
    SplitRequest,
    RangeRequestList,
    getRequestAt,
    splitRangeByRequest,
    splitRange,
    rangeToArray,
    rangeEnd
} from '@subsquid/util-internal-range'
import {assertNotNull, last, Throttler, wait} from '@subsquid/util-internal'
import assert from 'assert'
import {BlockData} from './data'
import {fetchBlock, fetchTransactionsInfo, getParentHash} from './fetch'
import {HttpApi} from './http'


export interface DataRequest {
    transactions?: boolean
    transactionsInfo?: boolean
}


export interface HttpDataSourceOptions {
    httpApi: HttpApi
    headPollInterval?: number
    strideSize?: number
    strideConcurrency?: number
}


export class HttpDataSource {
    private httpApi: HttpApi
    private headPollInterval: number
    private strideSize: number
    private strideConcurrency: number
    private finalityConfirmation: number

    constructor(options: HttpDataSourceOptions) {
        this.httpApi = options.httpApi
        this.headPollInterval = options.headPollInterval ?? 1000
        this.strideSize = options.strideSize || 10
        this.strideConcurrency = options.strideConcurrency || 2
        this.finalityConfirmation = 20
    }

    getBlockHeader(height: number) {
        return this.httpApi.getBlock(height, false)
    }

    async getHeight(): Promise<number> {
        let block = await this.httpApi.getNowBlock()
        let number = assertNotNull(block.block_header.raw_data.number)
        return number
    }

    async getFinalizedHeight(): Promise<number> {
        let block = await this.httpApi.getNowBlock()
        let number = assertNotNull(block.block_header.raw_data.number)
        return Math.max(0, number - this.finalityConfirmation)
    }

    getFinalizedBlocks(
        requests: RangeRequest<DataRequest>[],
        stopOnHead?: boolean
    ): AsyncIterable<Batch<BlockData>> {
        return coldIngest({
            getFinalizedHeight: () => this.getFinalizedHeight(),
            getSplit: (req) => this.getSplit(req),
            requests,
            concurrency: this.strideConcurrency,
            splitSize: this.strideSize,
            stopOnHead,
            headPollInterval: this.headPollInterval
        })
    }

    async processHotBlocks(
        requests: RangeRequestList<DataRequest>,
        state: HotState,
        cb: (upd: HotUpdate<BlockData>) => Promise<void>
    ): Promise<void> {
        let self = this

        let proc = new HotProcessor<BlockData>(state, {
            process: cb,
            getBlock: async ref => {
                let req = getRequestAt(requests, ref.height) || {}
                let block = await self.getBlock(ref.height, !!req.transactions)
                if (block.hash != ref.hash) throw new BlockConsistencyError(ref)
                if (req.transactionsInfo) {
                    await self.addTransactionsInfo([block])
                }
                return block
            },
            async *getBlockRange(from: number, to: BlockRef): AsyncIterable<BlockData[]> {
                assert(to.height != null)
                if (from > to.height) {
                    from = to.height
                }
                for (let split of splitRangeByRequest(requests, {from, to: to.height})) {
                    let req = split.request || {}
                    for (let range of splitRange(5, split.range)) {
                        let blocks = await self.getSplit({range, request: req})
                        yield blocks
                    }
                }
            },
            getHeader(block) {
                return {
                    hash: block.block.blockID,
                    parentHash: block.block.block_header.raw_data.parentHash,
                    height: block.height,
                }
            }
        })

        let isEnd = () => proc.getFinalizedHeight() >= rangeEnd(last(requests).range)

        let navigate = (head: {height: number, hash?: string}): Promise<void> => {
            return proc.goto({
                best: head,
                finalized: {
                    height: Math.max(head.height - this.finalityConfirmation, 0)
                }
            })
        }

        return this.polling(navigate, isEnd)
    }

    private async getBlock(num: number, detail: boolean): Promise<BlockData> {
        let block = await fetchBlock(this.httpApi, num, detail)
        if (block == null) throw new BlockConsistencyError({height: num})
        return block
    }

    private async getBlocks(numbers: number[], detail: boolean): Promise<BlockData[]> {
        let promises = numbers.map(n => this.getBlock(n, detail))
        return Promise.all(promises)
    }

    private async addTransactionsInfo(blocks: BlockData[]) {
        await Promise.all(blocks.map(async block => {
            if (!await fetchTransactionsInfo(this.httpApi, block)) {
                throw new BlockConsistencyError(block)
            }
        }))
    }

    private async getSplit(req: SplitRequest<DataRequest>): Promise<BlockData[]> {
        let blocks = await this.getBlocks(rangeToArray(req.range), !!req.request.transactions)

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i];
            let prevBlock = blocks[i - 1]
            if (i > 0 && getParentHash(block) !== prevBlock.hash) {
                throw new BlockConsistencyError(block)
            }
        }

        if (req.request.transactionsInfo) {
            await this.addTransactionsInfo(blocks)
        }

        return blocks
    }

    private async polling(cb: (head: {height: number}) => Promise<void>, isEnd: () => boolean): Promise<void> {
        let prev = -1
        let height = new Throttler(() => this.getHeight(), this.headPollInterval)
        while (!isEnd()) {
            let next = await height.call()
            if (next <= prev) continue
            prev = next
            for (let i = 0; i < 100; i++) {
                try {
                    await cb({height: next})
                    break
                } catch(err: any) {
                    if (isDataConsistencyError(err)) {
                        await wait(100)
                    } else {
                        throw err
                    }
                }
            }
        }
    }
}
