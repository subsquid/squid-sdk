import {Batch, BlockConsistencyError, BlockRef, coldIngest, HotProcessor, HotUpdate, isDataConsistencyError, trimInvalid} from '@subsquid/util-internal-ingest-tools'
import {getRequestAt, mapRangeRequestList, rangeEnd, RangeRequest, splitRange, splitRangeByRequest, SplitRequest} from '@subsquid/util-internal-range'
import {assertNotNull, AsyncQueue, last, maybeLast, Throttler, wait} from '@subsquid/util-internal'
import assert from 'assert'
import {BlockData, TransactionInfo} from './data'
import {HttpApi} from './http'


function getBlockHash(blockId: string) {
    return '0x' + blockId.slice(16)
}


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

    async getFinalizedHeight(): Promise<number> {
        let height = await this.getHeight()
        return height - this.finalityConfirmation
    }

    async getHeight(): Promise<number> {
        let block = await this.httpApi.getNowBlock()
        let number = assertNotNull(block.block_header.raw_data.number)
        return number
    }

    getFinalizedBlocks(
        requests: RangeRequest<DataRequest>[],
        stopOnHead?: boolean
    ): AsyncIterable<Batch<BlockData>> {
        return coldIngest({
            getFinalizedHeight: () => this.getFinalizedHeight(),
            getSplit: (req) => this.getColdSplit(req),
            requests,
            concurrency: this.strideConcurrency,
            splitSize: this.strideSize,
            stopOnHead,
            headPollInterval: this.headPollInterval
        })
    }

    async *getHotBlocks(
        requests: RangeRequest<DataRequest>[],
    ): AsyncIterable<HotUpdate<BlockData>> {
        if (requests.length == 0) return

        let self = this

        let from = requests[0].range.from - 1
        let block = await this.getBlockHeader(from)

        let queue: HotUpdate<BlockData>[] = [] 

        let proc = new HotProcessor<BlockData>(
            {
                height: from,
                hash: block.blockID,
                top: [],
            },
            {
                process: async (update) => { queue.push(update) },
                getBlock: async (ref) => {
                    let req = getRequestAt(requests, ref.height) || {}
                    let block = await this.getBlock(ref.height, !!req.transactionsInfo)
                    if (block.block.blockID !== ref.hash) {
                        throw new BlockConsistencyError({hash: ref.hash})
                    }
                    await this.addRequestedData([block], req)
                    if (block._isInvalid) {
                        throw new BlockConsistencyError(block, block._errorMessage)
                    }
                    return block
                },
                async *getBlockRange(from: number, to: BlockRef): AsyncIterable<BlockData[]> {
                    assert(to.height != null)
                    if (from > to.height) {
                        from = to.height
                    }
                    for (let split of splitRangeByRequest(requests, {from, to: to.height})) {
                        let request = split.request || {}
                        for (let range of splitRange(10, split.range)) {
                            let blocks = await self.getHotSplit({
                                range,
                                request,
                                finalizedHeight: proc.getFinalizedHeight(),
                            })
                            let lastBlock = maybeLast(blocks)?.height ?? range.from - 1
                            yield blocks
                            if (lastBlock < range.to) {
                                throw new BlockConsistencyError({height: lastBlock + 1})
                            }
                        }
                    }
                },
                getHeader(block) {
                    return {
                        height: block.height,
                        hash: block.block.blockID,
                        parentHash: block.block.block_header.raw_data.parentHash,
                    }
                },
            }
        )

        let isEnd = () => proc.getFinalizedHeight() >= rangeEnd(last(requests).range)

        let prev = -1
        let height = new Throttler(() => this.getHeight(), this.headPollInterval)
        while (!isEnd()) {
            let next = await height.call()
            if (next <= prev) continue
            prev = next
            for (let i = 0; i < 100; i++) {
                try {
                    await proc.goto({
                        best: {height: next},
                        finalized: {
                            height: Math.max(next - this.finalityConfirmation, 0)
                        }
                    })

                    let update = queue.shift()
                    while (update) {
                        yield update
                        update = queue.shift()
                    }

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

    private async getBlock(num: number, detail: boolean): Promise<BlockData> {
        let block = await this.httpApi.getBlock(num, detail)
        return {
            block,
            height: block.block_header.raw_data.number || 0,
            hash: getBlockHash(block.blockID),
        }
    }

    private async getBlocks(from: number, to: number, detail: boolean): Promise<BlockData[]> {
        let promises = []
        for (let num = from; num <= to; num++) {
            let promise = this.getBlock(num, detail)
            promises.push(promise)
        }
        return Promise.all(promises)
    }

    private async addTransactionsInfo(blocks: BlockData[]) {
        let promises = []
        for (let block of blocks) {
            // info isn't presented for genesis block
            if (block.height == 0) continue

            let promise = this.httpApi.getTransactionInfo(block.height)
                .then(transactionsInfo => {
                    let infoById: Record<string, TransactionInfo> = {}
                    for (let info of transactionsInfo) {
                        infoById[info.id] = info
                    }
                    for (let tx of block.block.transactions || []) {
                        assert(infoById[tx.txID])
                    }
                    block.transactionsInfo = transactionsInfo
                })
            promises.push(promise)
        }
        await Promise.all(promises)
    }

    private async getColdSplit(req: SplitRequest<DataRequest>): Promise<BlockData[]> {
        let blocks = await this.getBlocks(req.range.from, req.range.to, !!req.request.transactions)

        return blocks
    }

    private async getHotSplit(req: SplitRequest<DataRequest> & {finalizedHeight: number}): Promise<BlockData[]> {
        let blocks = await this.getBlocks(req.range.from, req.range.to, !!req.request.transactions)

        let chain: BlockData[] = []

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            if (block == null) break
            if (i > 0 && chain[i - 1].block.blockID !== block.block.block_header.raw_data.parentHash) break
            chain.push(block)
        }

        await this.addRequestedData(chain, req.request)

        return trimInvalid(chain)
    }

    private async addRequestedData(blocks: BlockData[], req: DataRequest): Promise<void> {
        if (blocks.length == 0) return

        let subtasks = []

        if (req.transactionsInfo) {
            subtasks.push(this.addTransactionsInfo(blocks))
        }

        await Promise.all(subtasks)
    }
}
