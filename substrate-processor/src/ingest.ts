import {assertNotNull, Output} from "@subsquid/util"
import assert from "assert"
import fetch from "node-fetch"
import {Batch} from "./batch"
import {SubstrateBlock, SubstrateEvent} from "./interfaces/substrate"
import {AbortHandle, Channel, wait} from "./util/async"
import {unique} from "./util/misc"
import {rangeEnd} from "./util/range"


export interface BlockData {
    block: SubstrateBlock
    events: SubstrateEvent[]
}


export interface DataBatch extends Batch {
    /**
     * This is roughly the range of scanned blocks
     */
    range: {from: number, to: number}
    blocks: BlockData[]
}


export interface IngestMetrics {
    setChainHeight(height: number): void
    setIngestSpeed(blocksPerSecond: number): void
}


export interface IngestOptions {
    archive: string
    archivePollIntervalMS?: number
    /**
     * Mutable array of batches to ingest.
     *
     * Ingest will shift elements and modify the range of a head branch.
     */
    batches$: Batch[]
    batchSize: number
    metrics?: IngestMetrics
}


export class Ingest {
    private out = new Channel<DataBatch | null>(3)
    private _abort = new AbortHandle()
    private archiveHeight = -1
    private readonly limit: number // maximum number of blocks in a single batch
    private readonly batches: Batch[]
    private readonly ingestion: Promise<void | Error>

    constructor(private options: IngestOptions) {
        this.batches = options.batches$
        this.limit = this.options.batchSize
        assert(this.limit > 0)
        this.ingestion = this.run()
    }

    nextBatch(): Promise<DataBatch | null> {
        return this.out.take()
    }

    close(): Promise<Error | void> {
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
        while (this.batches.length) {
            this._abort.assertNotAborted()
            let batch = this.batches[0]
            let archiveHeight = await this.waitForHeight(batch.range.from)
            let fetchStart = process.hrtime.bigint()
            let blocks = await this.batchFetch(batch, archiveHeight)
            if (blocks.length) {
                assert(blocks.length <= this.limit)
                assert(batch.range.from <= blocks[0].block.height)
                assert(rangeEnd(batch.range) >= blocks[blocks.length - 1].block.height)
                assert(archiveHeight >= blocks[blocks.length - 1].block.height)
            }

            let from = batch.range.from
            let to: number
            if (blocks.length === this.limit && blocks[blocks.length-1].block.height < rangeEnd(batch.range)) {
                to = blocks[blocks.length-1].block.height
                batch.range = {from: to + 1, to: batch.range.to}
            } else if (archiveHeight < rangeEnd(batch.range)) {
                to = archiveHeight
                batch.range = {from: to + 1, to: batch.range.to}
            } else {
                to = assertNotNull(batch.range.to)
                this.batches.shift()
            }

            if (this.options.metrics && blocks.length > 0) {
                let fetchEnd = process.hrtime.bigint()
                let duration = Number(fetchEnd - fetchStart)
                let speed =  blocks.length * Math.pow(10, 9) / duration
                this.options.metrics.setIngestSpeed(speed)
            }

            await this._abort.guard(this.out.put({
                blocks,
                range: {from, to},
                handlers: batch.handlers
            }))
        }
    }

    private async batchFetch(batch: Batch, archiveHeight: number): Promise<BlockData[]> {
        let from = batch.range.from
        let to = Math.min(archiveHeight, rangeEnd(batch.range))
        assert(from <= to)

        let hs = batch.handlers
        let events = Object.keys(hs.events)
        let notAllBlocksRequired = hs.pre.length == 0 && hs.post.length == 0

        // filters
        let height = `height: {_gte: ${from}, _lte: ${to}}`
        let blockWhere: string
        if (notAllBlocksRequired) {
            let or: string[] = []
            events.forEach(name => {
                or.push(`events: {_contains: [{name: "${name}"}]}`)
            })
            let extrinsics = unique(Object.entries(hs.extrinsics).flatMap(e => Object.keys(e[1])))
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
            for (let event in hs.extrinsics) {
                let extrinsics = Object.keys(hs.extrinsics[event])
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
            q.block(`indexerStatus`, () => {
                q.line('head')
            })
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
                q.block('events: substrate_events(order_by: {indexInBlock: asc})', () => {
                    q.line('id')
                    q.line('name')
                    q.line('extrinsicId')
                    q.line('extrinsicName')
                })
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
        let response = await this.archiveRequest<any>(gql)

        this.setArchiveHeight(response)

        let fetchedBlocks = response.substrate_block
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
            await this.fetchArchiveHeight()
            if (this.archiveHeight >= minimumHeight) {
                return this.archiveHeight
            } else {
                await wait(this.options.archivePollIntervalMS || 5000, this._abort)
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
        this.setArchiveHeight(res)
        return this.archiveHeight
    }

    private setArchiveHeight(res: {indexerStatus: {head: number}}): void {
        let height = res.indexerStatus.head
        this.archiveHeight = Math.max(this.archiveHeight, height)
        this.options.metrics?.setChainHeight(this.archiveHeight)
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
