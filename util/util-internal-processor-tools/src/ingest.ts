import {def, last, maybeLast, wait} from '@subsquid/util-internal'
import assert from 'assert'
import {BatchRequest} from './batch'
import {HotDatabaseState} from './database'
import {rangeEnd} from './range'


export interface HashAndHeight {
    hash: string
    height: number
}


export interface BlockHeader {
    height: number
    hash: string
    parentHash: string
}


export interface Block {
    header: BlockHeader
}


export interface BatchResponse<B extends Block = Block> {
    /**
     * This is the range of scanned blocks
     */
    range: {from: number, to: number}
    blocks: B[]
    chainHeight: number
}


export interface DataBatch<B extends Block = Block> extends BatchResponse<B> {
    fetchStartTime: bigint
    fetchEndTime: bigint
    finalizedHead?: HashAndHeight
    baseHead?: HashAndHeight
}


export interface HotDataBatch extends DataBatch {
    finalizedHead: HashAndHeight
    baseHead: HashAndHeight
}


export interface ArchiveDataSource<R> {
    getFinalizedBatch(request: BatchRequest<R>): Promise<BatchResponse>
    getFinalizedHeight(): Promise<number>
}


export interface HotDataSource<R> extends ArchiveDataSource<R> {
    getBlock(blockHash: string, request?: R): Promise<Block>
    getBlockHash(height: number): Promise<string>
    getBestHead(): Promise<HashAndHeight>
    getFinalizedHead(): Promise<HashAndHeight>
}


export interface ArchiveIngestOptions<R> {
    requests: BatchRequest<R>[]
    archive: ArchiveDataSource<R>
    pollInterval?: number
    maxBufferedBatches?: number
}


export class ArchiveIngest<R> {
    private requests: BatchRequest<R>[]
    private src: ArchiveDataSource<R>
    private pollInterval: number
    private queue: Promise<DataBatch | null>[] = []
    private chainHeight = -1
    private fetching = false
    private maxBufferedBatches: number

    constructor(options: ArchiveIngestOptions<R>) {
        this.requests = options.requests.slice()
        this.src = options.archive
        this.pollInterval = options.pollInterval ?? 2000
        this.maxBufferedBatches = options.maxBufferedBatches ?? 2
    }

    async shouldStopOnHeight(height: number): Promise<boolean> {
        return false
    }

    @def
    async *getBlocks(): AsyncIterable<DataBatch> {
        this.chainHeight = await this.src.getFinalizedHeight()
        while (true) {
            if (!this.fetching) {
                this.loop()
            }
            let batch = await this.queue.shift()
            if (batch == null) return
            yield batch
        }
    }

    private loop() {
        if (this.queue.length >= this.maxBufferedBatches) {
            this.fetching = false
            return
        } else {
            this.fetching = true
        }

        if (this.requests.length == 0) return

        let req = this.requests[0]

        let promise: Promise<DataBatch | null> = this.waitForHeight(req.range.from).then(async ok => {
            if (!ok) return null

            let fetchStartTime = process.hrtime.bigint()
            let response = await this.src.getFinalizedBatch(req)
            let fetchEndTime = process.hrtime.bigint()

            assert(response.range.from <= response.range.to)
            assert(response.range.from == req.range.from)
            assert(response.range.to <= rangeEnd(req.range))
            assert(response.range.to <= response.chainHeight)

            let blocks = response.blocks.sort((a, b) => a.header.height - b.header.height)
            if (blocks.length) {
                assert(response.range.from <= blocks[0].header.height)
                assert(response.range.to >= last(blocks).header.height)
            }

            this.chainHeight = Math.max(this.chainHeight, response.chainHeight)

            if (response.range.to < rangeEnd(req.range)) {
                this.requests[0] = {
                    range: {from: response.range.to + 1, to: req.range.to},
                    request: req.request
                }
            } else {
                this.requests.shift()
            }

            this.loop()

            return {
                ...response,
                fetchStartTime,
                fetchEndTime,
                chainHeight: this.chainHeight
            }
        })

        promise.catch(() => {})

        this.queue.push(promise)
    }

    private async waitForHeight(minimumHeight: number): Promise<boolean> {
        while (this.chainHeight < minimumHeight) {
            if (await this.shouldStopOnHeight(this.chainHeight)) return false
            await wait(this.pollInterval)
            this.chainHeight = Math.max(this.chainHeight, await this.src.getFinalizedHeight())
        }
        return true
    }
}


export interface HotIngestOptions<R> {
    src: HotDataSource<R>
    state: HotDatabaseState
    requests: BatchRequest<R>[]
    pollInterval?: number
}


export class HotIngest<R> {
    private requests: BatchRequest<R>[]
    private chain: HashAndHeight[]
    private src: HotDataSource<R>
    private pollInterval: number

    constructor(options: HotIngestOptions<R>) {
        this.requests = options.requests
        this.chain = [options.state, ...options.state.top]
        this.src = options.src
        this.pollInterval = options.pollInterval ?? 1000
        this.assertInvariants()
    }

    private assertInvariants(): void {
        for (let i = 1; i < this.chain.length; i++) {
            assert(this.chain[i].height == this.chain[i-1].height + 1)
        }
    }

    private waitsForBlocks(): boolean {
        let next = this.chain[0].height + 1
        for (let req of this.requests) {
            let to = req.range.to ?? Infinity
            if (next <= to) return true
        }
        return false
    }

    private getRequestAtHeight(height: number): R | undefined {
        for (let req of this.requests) {
            let from = req.range.from
            let to = req.range.to ?? Infinity
            if (from <= height && height <= to) return req.request
        }
    }

    @def
    async *getItems(): AsyncIterable<HotDataBatch> {
        while (this.waitsForBlocks()) {
            let fetchStartTime = process.hrtime.bigint()
            let newBlocks = await this.pollNewBlocks()
            let fetchEndTime = process.hrtime.bigint()

            if (newBlocks.length) {
                yield {
                    range: {from: newBlocks[0].header.height, to: last(newBlocks).header.height},
                    blocks: newBlocks,
                    chainHeight: last(newBlocks).header.height,
                    fetchStartTime,
                    fetchEndTime,
                    finalizedHead: this.chain[0],
                    baseHead: {
                        height: newBlocks[0].header.height - 1,
                        hash: newBlocks[0].header.parentHash
                    }
                }
            }

            let sinceLastPoll = Number(process.hrtime.bigint() - fetchStartTime) / 1_000_000
            await wait(Math.max(0, this.pollInterval - sinceLastPoll))
        }
    }

    private async pollNewBlocks(): Promise<Block[]> {
        let finalizedHead = await this.src.getFinalizedHead()
        let best = await this.src.getBestHead()

        if (this.chain[0].height > finalizedHead.height) {
            // this happens with all RPC providers
            // sometimes we just loose the progress...
            finalizedHead = this.chain[0]
        }
        assert(finalizedHead.height <= best.height)

        if (last(this.chain).height > best.height) {
            let bestPos = best.height - this.chain[0].height
            if (this.chain[bestPos].hash === best.hash) {
                // once again we just lost progress
                return []
            } else {
                // we have a proper fork
                // we don't apply height judgement here,
                // because blockchains can differ in how they define the notion of the best block
                this.chain = this.chain.slice(0, bestPos)
            }
        }

        let newBlocks: Block[] = []

        while (last(this.chain).height < best.height) {
            let item = await this.getBlock(best)
            newBlocks.push(item.block)
            best = item.parent
        }

        while (last(this.chain).hash !== best.hash) {
            let item = await this.getBlock(best)
            newBlocks.push(item.block)
            best = item.parent
            this.chain.pop()
        }

        newBlocks = newBlocks.reverse()
        for (let block of newBlocks) {
            this.chain.push(block.header)
        }

        let finalizedHeadPos = finalizedHead.height - this.chain[0].height
        assert(this.chain[finalizedHeadPos].hash === finalizedHead.hash)
        this.chain = this.chain.slice(finalizedHeadPos)

        return newBlocks
    }

    private async getBlock(ref: HashAndHeight): Promise<{block: Block, parent: HashAndHeight}> {
        let request = this.getRequestAtHeight(ref.height)
        let block = await this.src.getBlock(ref.hash, request)
        return {
            block,
            parent: {
                hash: block.header.parentHash,
                height: block.header.height - 1
            }
        }
    }
}
