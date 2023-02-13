import {def, last, wait} from '@subsquid/util-internal'
import assert from 'assert'
import {BatchRequest} from './batch'
import {rangeEnd} from './range'


export interface BlockBase {
    header: {
        height: number
    }
    items: object[]
}


export interface BatchResponse<B> {
    /**
     * This the range of scanned blocks
     */
    range: {from: number, to: number}
    blocks: B[]
    isHead: boolean
}


export interface DataSource<R, B> {
    batchRequest(request: BatchRequest<R>): Promise<BatchResponse<B>>
    getChainHeight(): Promise<number>
}


export interface DataBatch<R, B> extends BatchResponse<B> {
    request: R
    fetchStartTime: bigint
    fetchEndTime: bigint
    chainHeight: number
    itemsCount: number
}


export interface IngestOptions<R, B> {
    src: DataSource<R, B>
    requests: BatchRequest<R>[]
    pollInterval?: number
    maxBufferedBatches?: number
}


export class Ingest<R, B extends BlockBase> {
    private requests: BatchRequest<R>[]
    private src: DataSource<R, B>
    private pollInterval: number
    private queue: Promise<DataBatch<R, B>>[] = []
    private chainHeight = -1
    private fetching = false
    private maxBufferedBatches: number

    constructor(options: IngestOptions<R, B>) {
        this.requests = options.requests.slice()
        this.src = options.src
        this.pollInterval = options.pollInterval ?? 2000
        this.maxBufferedBatches = options.maxBufferedBatches ?? 2
    }

    @def
    async *getBlocks(): AsyncIterable<DataBatch<R, B>> {
        while (true) {
            if (!this.fetching) {
                this.loop()
            }
            let promise = this.queue.shift()
            if (promise) {
                yield await promise
            } else {
                return
            }
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

        let promise: Promise<DataBatch<R, B>> = this.waitForHeight(req.range.from).then(async () => {
            let fetchStartTime = process.hrtime.bigint()
            let response = await this.src.batchRequest(req)
            let fetchEndTime = process.hrtime.bigint()

            assert(response.range.from <= response.range.to)
            assert(response.range.from == req.range.from)
            assert(response.range.to <= rangeEnd(req.range))

            let blocks = response.blocks.sort((a, b) => a.header.height - b.header.height)
            if (blocks.length) {
                assert(response.range.from <= blocks[0].header.height)
                assert(response.range.to >= last(blocks).header.height)
            }

            this.chainHeight = Math.max(this.chainHeight, response.range.to)

            if (response.range.to < rangeEnd(req.range)) {
                this.requests[0] = {
                    range: {from: response.range.to, to: req.range.to},
                    request: req.request
                }
            } else {
                this.requests.shift()
            }

            this.loop()

            return {
                ...response,
                request: req.request,
                fetchStartTime,
                fetchEndTime,
                chainHeight: this.chainHeight,
                itemsCount: getBatchItemsCount(response)
            }
        })

        promise.catch(() => {})

        this.queue.push(promise)
    }

    private async waitForHeight(minimumHeight: number): Promise<number> {
        while (this.chainHeight < minimumHeight) {
            this.chainHeight = Math.max(this.chainHeight, await this.src.getChainHeight())
            if (this.chainHeight < minimumHeight) {
                await wait(this.pollInterval)
            } else {
                return this.chainHeight
            }
        }
        return this.chainHeight
    }
}


function getBatchItemsCount(batch: BatchResponse<BlockBase>): number {
    let count = 0
    for (let i = 0; i < batch.blocks.length; i++) {
        count += batch.blocks[i].items.length
    }
    return count
}
