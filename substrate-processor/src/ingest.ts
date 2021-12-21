import {Output} from "@subsquid/util"
import assert from "assert"
import fetch from "node-fetch"
import {Batch, createBatches} from "./batch"
import {Hooks} from "./interfaces/hooks"
import {SubstrateBlock, SubstrateEvent} from "./interfaces/substrate"
import {Prometheus} from "./prometheus"
import {AbortHandle, Channel, wait} from "./util/async"
import {unique} from "./util/misc"
import {Range, rangeEnd} from "./util/range"


export interface BlockData {
    block: SubstrateBlock
    events: SubstrateEvent[]
}


export interface DataBatch extends Omit<Batch, 'range'> {
    blocks: BlockData[]
}


export interface IngestOptions {
    archive: string
    indexerPollIntervalMS?: number
    range: Range
    batchSize: number
    hooks: Hooks,
    prometheus?: Prometheus
}


export class Ingest {
    private out = new Channel<DataBatch | null>(2)
    private _abort = new AbortHandle()
    private archiveHeight = -1
    private readonly limit: number
    private readonly ingestion: Promise<void | Error>

    constructor(private options: IngestOptions) {
        this.limit = this.options.batchSize
        assert(this.limit > 0)
        this.ingestion = this.run()
    }

    nextBatch(): Promise<DataBatch | null> {
        return this.out.take()
    }

    stop(): Promise<Error | void> {
        this._abort.abort()
        return this.ingestion
    }

    private async run(): Promise<void | Error> {
        try {
            await this.loop()
        } catch(err: any) {
            return err
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
            let archiveHeight = await this.waitForHeight(batch.range.from)
            let blocks = await this.batchFetch(batch, archiveHeight)
            if (blocks.length) {
                assert(blocks.length <= this.limit)
                assert(batch.range.from <= blocks[0].block.height)
                assert(rangeEnd(batch.range) >= blocks[blocks.length - 1].block.height)
                assert(archiveHeight >= blocks[blocks.length - 1].block.height)
            }

            if (blocks.length === this.limit) {
                let maxBlock = blocks[blocks.length-1].block.height
                if (maxBlock < rangeEnd(batch.range)) {
                    batch.range = {from: maxBlock + 1, to: batch.range.to}
                }
            } else if (archiveHeight < rangeEnd(batch.range)) {
                batch.range = {from: archiveHeight + 1, to: batch.range.to}
            } else {
                nextBatch = batches.shift()
            }

            await this._abort.guard(this.out.put({
                blocks,
                pre: batch.pre,
                post: batch.post,
                events: batch.events,
                extrinsics: batch.extrinsics
            }))
        }
    }

    private async batchFetch(batch: Batch, archiveHeight: number): Promise<BlockData[]> {
        let from = batch.range.from
        let to = Math.min(archiveHeight, rangeEnd(batch.range))
        assert(from <= to)

        let events = Object.keys(batch.events)
        let notAllBlocksRequired = batch.pre.length == 0 && batch.post.length == 0

        // filters
        let height = `height: {_gte: ${from}, _lte: ${to}}`
        let blockWhere: string
        if (notAllBlocksRequired) {
            let or: string[] = []
            events.forEach(name => {
                or.push(`events: {_contains: [{name: "${name}"}]}`)
            })
            let extrinsics = unique(Object.entries(batch.extrinsics).flatMap(e => Object.keys(e[1])))
            extrinsics.forEach(name => {
                or.push(`extrinsics: {_contains: [{name: "${name}"}]}`)
            })
            if (or.length > 1) {
                blockWhere = `{_and: [{${height}}, {_or: [${or.map(f => `{${f}}`).join(', ')}]}]}`
            } else {
                assert(or.length == 1)
                blockWhere = `{${height} ${or[0]}}`
            }
        } else {
            blockWhere = `{${height}}`
        }

        let eventWhere = ''
        {
            let or: string[] = []
            if (events.length > 0) {
                or.push(`name: {_in: [${events.map(event => `"${event}"`).join(', ')}]}`)
            }
            for (let event in batch.extrinsics) {
                let extrinsics = Object.keys(batch.extrinsics[event])
                or.push(`name: {_eq: "${event}"}, extrinsic: {name: {_in: [${extrinsics.map(name => `"${name}"`).join(', ')}]}}`)
            }
            if (or.length == 1) {
                eventWhere = ` where: {${or[0]}}`
            } else if (or.length > 1) {
                eventWhere = ` where: {_or: [${or.map(exp => `{${exp}}`).join(', ')}]}`
            }
        }

        let q = new Output()
        q.block(`query`, () => {
            q.block(`substrate_block(limit: ${this.limit} order_by: {height: asc} where: ${blockWhere})`, () => {
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
                q.block(`substrate_events(order_by: {indexInBlock: asc}${eventWhere})`, () => {
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
        let {substrate_block: fetchedBlocks} = await this.archiveRequest<any>(gql)

        let blocks = new Array<BlockData>(fetchedBlocks.length)
        for (let i = 0; i < fetchedBlocks.length; i++) {
            i > 0 && assert(fetchedBlocks[i-1].height < fetchedBlocks[i].height)
            let {timestamp, substrate_events: events, ...block} = fetchedBlocks[i]
            block.timestamp = Number.parseInt(timestamp)
            for (let j = 0; j < events.length; j++) {
                j > 0 && assert(events[j-1].indexInBlock < events[j].indexInBlock)
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

    private async waitForHeight(minimumHeight: number): Promise<number> {
        while (this.archiveHeight < minimumHeight) {
            this.archiveHeight = Math.max(this.archiveHeight, await this.fetchArchiveHeight())
            if (this.archiveHeight >= minimumHeight) {
                return this.archiveHeight
            } else {
                await wait(this.options.indexerPollIntervalMS || 5000, this._abort)
            }
        }
        return this.archiveHeight
    }

    private async fetchArchiveHeight(): Promise<number> {
        let res: any = await this.archiveRequest(`
            query {
                indexerStatus {
                    head
                }
            }
        `)
        let height: number = res.indexerStatus.head
        this.options.prometheus?.setChainHeight(height)
        return height
    }

    private async archiveRequest<T>(query: string): Promise<T> {
        let response = await fetch(this.options.archive, {
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

