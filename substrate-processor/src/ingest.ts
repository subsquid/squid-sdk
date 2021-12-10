import assert from "assert"
import fetch from "node-fetch"
import {Batch, createBatches} from "./batch"
import {Hooks} from "./interfaces/hooks"
import {SubstrateBlock, SubstrateEvent} from "./interfaces/substrate"
import {AbortHandle, Channel, wait} from "./util/async"
import {Output} from "./util/out"
import {Range, rangeEnd} from "./util/range"
import {def} from "./util/util"


export interface BlockData {
    block: SubstrateBlock
    events: SubstrateEvent[]
}


export interface DataBatch extends Omit<Batch, 'range'> {
    blocks: BlockData[]
}


export interface IngestOptions {
    indexer: string
    indexerPollIntervalMS?: number
    range: Range
    batchSize: number
    hooks: Hooks
}


export class Ingest {
    private out = new Channel<DataBatch | null>(2)
    private _abort = new AbortHandle()
    private indexerHeight = -1
    private readonly limit: number

    constructor(private options: IngestOptions) {
        this.limit = this.options.batchSize
        assert(this.limit > 0)
    }

    nextBatch(): Promise<DataBatch | null> {
        return this.out.take()
    }

    abort(): void {
        this._abort.abort()
    }

    @def
    async run(): Promise<void> {
        try {
            await this.loop()
        } finally {
            this.out.close(null)
        }
    }

    private async loop(): Promise<void> {
        let batches = createBatches(this.options.hooks, this.options.range)
        let nextBatch = batches.shift()
        while (nextBatch) {
            this._abort.assertNotAborted()
            let batch = nextBatch
            let indexerHeight = await this.waitIndexerForHeight(batch.range.from)
            let blocks = await this.batchFetch(batch, indexerHeight)
            if (blocks.length) {
                assert(blocks.length <= this.limit)
                assert(batch.range.from <= blocks[0].block.height)
                assert(rangeEnd(batch.range) >= blocks[blocks.length - 1].block.height)
                assert(indexerHeight >= blocks[blocks.length - 1].block.height)
            }

            if (blocks.length === this.limit) {
                let maxBlock = blocks[blocks.length-1].block.height
                if (maxBlock < rangeEnd(batch.range)) {
                    batch.range = {from: maxBlock + 1, to: batch.range.to}
                }
            } else if (indexerHeight < rangeEnd(batch.range)) {
                batch.range = {from: indexerHeight + 1, to: batch.range.to}
            } else {
                nextBatch = batches.shift()
            }

            await this._abort.guard(this.out.put({
                blocks,
                pre: batch.pre,
                post: batch.post,
                events: batch.events
            }))
        }
    }

    private async batchFetch(batch: Batch, indexerHeight: number): Promise<BlockData[]> {
        let from = batch.range.from
        let to = Math.min(indexerHeight, rangeEnd(batch.range))
        assert(from <= to)

        let events = Object.keys(batch.events)
        let notAllBlocksRequired = batch.pre.length == 0 && batch.post.length == 0

        // filters
        let height = `height: {_gte: ${from}, _lte: ${to}}`

        let where: string
        if (notAllBlocksRequired) {
            let blockEvents = events.map(name => `events: {_contains: [{name: "${name}"}]}`)
            if (blockEvents.length > 1) {
                where = `{_and: [{${height}}, {_or: [${blockEvents.map(f => `{${f}}`).join(', ')}]}]}`
            } else {
                assert(blockEvents.length == 1)
                where = `{${height} ${blockEvents[0]}}`
            }
        } else {
            where = `{${height}}`
        }

        let eventWhere = ''
        if (events.length > 0) {
            eventWhere = `where: {name: {_in: [${events.map(name => `"${name}"`)}]}}`
        }

        let q = new Output()
        q.block(`query`, () => {
            q.block(`substrate_block(limit: ${this.limit} order_by: {height: asc} where: ${where})`, () => {
                q.line('id')
                q.line('hash')
                q.line('height')
                q.line('timestamp')
                q.line('parentHash')
                q.line('stateRoot')
                q.line('extrinsicsRoot')
                q.line('runtimeVersion')
                q.line('lastRuntimeUpgrade')
                q.line('events')
                q.line('extrinsics')
                q.line()
                q.block(`substrate_events(order_by: {indexInBlock: asc} ${eventWhere})`, () => {
                    q.line('id')
                    q.line('name')
                    q.line('method')
                    q.line('section')
                    q.line('params')
                    q.line('indexInBlock')
                    q.line('blockNumber')
                    q.line('blockTimestamp')
                    q.block('extrinsic', () => {
                        q.line('id')
                        q.line('name')
                        q.line('method')
                        q.line('section')
                        q.line('versionInfo')
                        q.line('era')
                        q.line('signer')
                        q.line('args')
                        q.line('hash')
                        q.line('tip')
                        q.line('indexInBlock')
                    })
                })
            })
        })

        let gql = q.toString()
        let {substrate_block: fetchedBlocks} = await this.indexerRequest<any>(gql)

        let blocks = new Array<BlockData>(fetchedBlocks.length)
        for (let i = 0; i < fetchedBlocks.length; i++) {
            i > 0 && assert(fetchedBlocks[i-1].height < fetchedBlocks[i].height)
            let {timestamp, substrate_events: events, ...block} = fetchedBlocks[i]
            block.timestamp = Number.parseInt(timestamp)
            for (let j = 0; j < events.length; j++) {
                j > 0 && assert(fetchedBlocks[j-1].indexInBlock < fetchedBlocks[j].indexInBlock)
                let event = events[j]
                event.blockTimestamp = block.timestamp
                if (event?.extrinsic?.tip != null) {
                    event.extrinsic.tip = BigInt(event.extrinsic.tip)
                }
            }
            blocks[i] = {block, events}
        }
        return blocks
    }

    private async waitIndexerForHeight(minimumHeight: number): Promise<number> {
        while (this.indexerHeight < minimumHeight) {
            this.indexerHeight = Math.max(this.indexerHeight, await this.fetchIndexerHeight())
            if (this.indexerHeight >= minimumHeight) {
                return this.indexerHeight
            } else {
                await wait(this.options.indexerPollIntervalMS || 5000, this._abort)
            }
        }
        return this.indexerHeight
    }

    private fetchIndexerHeight(): Promise<number> {
        return this.indexerRequest(`
            query {
                indexerStatus {
                    head
                }
            }
        `).then((res: any) => res.indexerStatus.head)
    }

    private async indexerRequest<T>(query: string): Promise<T> {
        let response = await fetch(this.options.indexer, {
            method: 'POST',
            body: JSON.stringify({query}),
            headers: {
                'content-type': 'application/json',
                'accept': 'application/json',
                'accept-encoding': 'gzip, br'
            }
        })
        if (!response.ok) {
            throw new Error(`Got http ${response.status}, body: ${await response.text()}`)
        }
        let result = await response.json()
        return result.data as T
    }
}

