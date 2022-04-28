import {AbortHandle, assertNotNull, def, unexpectedCase, wait} from "@subsquid/util-internal"
import {Output} from "@subsquid/util-internal-code-printer"
import assert from "assert"
import fetch from "node-fetch"
import {Batch} from "./batch"
import * as gw from "./interfaces/gateway"
import {SubstrateBlock, SubstrateCall, SubstrateEvent, SubstrateExtrinsic} from "./interfaces/substrate"
import {printGqlArguments} from "./util/gql"
import {rangeEnd} from "./util/range"


export type LogItem = {
    kind: 'call'
    call: SubstrateCall
    extrinsic: SubstrateExtrinsic
} | {
    kind: 'event'
    event: SubstrateEvent
}


export interface BlockData {
    header: SubstrateBlock
    log: LogItem[]
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
    batchRequestTime(start: bigint, end: bigint, fetchedBlocksCount: number): void
}


export interface IngestOptions {
    archive: string
    archivePollIntervalMS?: number
    /**
     * Mutable array of batches to ingest.
     *
     * Ingest will shift elements and modify the range of a head batch.
     */
    batches$: Batch[]
    batchSize: number
    metrics?: IngestMetrics
}


export class Ingest {
    private _abort = new AbortHandle()
    private archiveHeight = -1
    private readonly limit: number // maximum number of blocks in a single batch
    private readonly batches: Batch[]
    private readonly maxQueueSize = 3
    private queue: Promise<DataBatch>[] = []
    private fetchLoopRunning = false

    constructor(private options: IngestOptions) {
        this.batches = options.batches$
        this.limit = this.options.batchSize
        assert(this.limit > 0)
    }

    close(): void {
        this._abort.abort()
    }

    @def
    async *getBlocks(): AsyncGenerator<DataBatch> {
        while (this.batches.length) {
            this.startFetchLoop()
            yield await assertNotNull(this.queue[0])
            this.queue.shift()
        }
    }

    private startFetchLoop(): void {
        this._abort.assertNotAborted()
        if (this.fetchLoopRunning) return
        this.fetchLoopRunning = true
        this.fetchLoop().finally(() => this.fetchLoopRunning = false)
    }

    private async fetchLoop(): Promise<void> {
        while (this.batches.length && this.queue.length < this.maxQueueSize) {
            let batch = this.batches[0]
            let promise = this.waitForHeight(batch.range.from)
                .then(async archiveHeight => {
                    let metrics = this.options.metrics
                    let beg = metrics && process.hrtime.bigint()
                    let blocks = await this.batchFetch(batch, archiveHeight)
                    if (metrics) {
                        let end = process.hrtime.bigint()
                        metrics.batchRequestTime(beg!, end, blocks.length)
                    }

                    if (blocks.length) {
                        assert(blocks.length <= this.limit)
                        assert(batch.range.from <= blocks[0].header.height)
                        assert(rangeEnd(batch.range) >= blocks[blocks.length - 1].header.height)
                        assert(archiveHeight >= blocks[blocks.length - 1].header.height)
                    }

                    let from = batch.range.from
                    let to: number
                    if (blocks.length === this.limit && blocks[blocks.length - 1].header.height < rangeEnd(batch.range)) {
                        to = blocks[blocks.length - 1].header.height
                        batch.range = {from: to + 1, to: batch.range.to}
                    } else if (archiveHeight < rangeEnd(batch.range)) {
                        to = archiveHeight
                        batch.range = {from: to + 1, to: batch.range.to}
                    } else {
                        to = assertNotNull(batch.range.to)
                        this.batches.shift()
                    }

                    return {
                        blocks,
                        range: {from, to},
                        handlers: batch.handlers
                    }
                })

            this.queue.push(promise)

            let result = await promise.catch((err: unknown) => {
                assert(err instanceof Error)
                return err
            })

            if (result instanceof Error) {
                this._abort.abort(result)
                return
            }
        }
    }

    private async batchFetch(batch: Batch, archiveHeight: number): Promise<BlockData[]> {
        let from = batch.range.from
        let to = Math.min(archiveHeight, rangeEnd(batch.range))
        assert(from <= to)

        let hs = batch.handlers
        let includeAllBlocks = hs.pre.length > 0 || hs.post.length > 0

        let args: gw.BatchRequest = {
            fromBlock: from,
            toBlock: to + 1,
            limit: this.limit,
            includeAllBlocks
        }

        args.events = Object.entries(hs.events).map(([name, options]) => {
            return {
                name,
                data: toGatewayFields(options.data, CONTEXT_NESTING_SHAPE)
            }
        })

        args.calls = Object.entries(hs.calls).map(([name, options]) => {
            return {
                name,
                data: toGatewayFields(options.data, CONTEXT_NESTING_SHAPE)
            }
        })

        args.evmLogs = Object.entries(hs.evmLogs).flatMap(([contract, hs]) => {
            return hs.map(h => {
                let data: any | undefined
                if (h.data) {
                    data = {
                        txHash: h.data.txHash,
                        substrate: toGatewayFields(h.data.substrate, CONTEXT_NESTING_SHAPE)
                    }
                }
                return {
                    contract,
                    filter: h.filter?.map(f => f == null ? [] : Array.isArray(f) ? f : [f]),
                    data
                }
            })
        })

        let q = new Output()
        q.block(`query`, () => {
            q.block(`status`, () => {
                q.line('head')
            })
            q.block(`batch(${printGqlArguments(args)})`, () => {
                q.block('header', () => {
                    q.line('id')
                    q.line('height')
                    q.line('hash')
                    q.line('parentHash')
                    q.line('timestamp')
                    q.line('specId')
                })
                q.line('events')
                q.line('calls')
                q.line('extrinsics')
            })
        })
        let gql = q.toString()
        // console.log(gql)
        let response = await this.archiveRequest<{status: {head: number}, batch: gw.BatchBlock[]}>(gql)
        // console.log(inspect(response, false, 10))
        this.setArchiveHeight(response)
        return response.batch.map(mapGatewayBlock)
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

    async fetchArchiveHeight(): Promise<number> {
        let res: any = await this.archiveRequest('query { status { head } }')
        this.setArchiveHeight(res)
        return this.archiveHeight
    }

    private setArchiveHeight(res: {status: {head: number}}): void {
        let height = res.status.head
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
            let body = await response.text()
            throw new Error(`Got http ${response.status}${body ? `, body: ${body}` : ''}`)
        }
        let result = await response.json()
        if (result.errors?.length) {
            throw new Error(`GraphQL error: ${result.errors[0].message}`)
        }
        return assertNotNull(result.data) as T
    }
}


const CONTEXT_NESTING_SHAPE = (() => {
    let call = {
        parent: {}
    }
    let extrinsic = {
        call
    }
    return {
        event: {
            call,
            extrinsic
        },
        call,
        extrinsic
    }
})();


function toGatewayFields(req: any | undefined, shape?: Record<string, any>): any | undefined {
    if (req == null || !req) return undefined
    if (req === true) return shape ? {_all: true} : true
    let fields: any = {}
    for (let key in req) {
        let val = toGatewayFields(req[key], shape?.[key])
        if (val != null) {
            fields[key] = val
        }
    }
    return fields
}


function mapGatewayBlock(block: gw.BatchBlock): BlockData {
    block.calls = block.calls || []
    block.events = block.events || []
    block.extrinsics = block.extrinsics || []

    let events = createObjects(block.events, go => {
        let {callId, extrinsicId, ...event} = go
        return event
    })

    let calls = createObjects<gw.Call, SubstrateCall>(block.calls, go => {
        let {parentId, extrinsicId, ...call} = go
        return call
    })

    let extrinsics = createObjects<gw.Extrinsic, SubstrateExtrinsic>(block.extrinsics || [], go => {
        let {callId, ...extrinsic} = go
        return extrinsic
    })

    let log: LogItem[] = []

    for (let go of block.events) {
        let event = assertNotNull(events.get(go.id)) as SubstrateEvent
        if (go.extrinsicId) {
            event.extrinsic = assertNotNull(extrinsics.get(go.extrinsicId)) as SubstrateExtrinsic
        }
        if (go.callId) {
            event.call = assertNotNull(calls.get(go.callId)) as SubstrateCall
        }
        log.push({
            kind: 'event',
            event
        })
    }

    for (let go of block.calls) {
        let call = assertNotNull(calls.get(go.id)) as SubstrateCall
        if (go.parentId) {
            call.parent = assertNotNull(calls.get(go.parentId)) as SubstrateCall
        }
        let item: Partial<LogItem> = {
            kind: 'call',
            call
        }
        if (go.extrinsicId) {
            item.extrinsic = assertNotNull(extrinsics.get(go.extrinsicId)) as SubstrateExtrinsic
        }
        log.push(item as LogItem)
    }

    for (let go of block.extrinsics) {
        if (go.callId) {
            let extrinsic = assertNotNull(extrinsics.get(go.id)) as SubstrateExtrinsic
            extrinsic.call = assertNotNull(calls.get(go.id)) as SubstrateCall
        }
    }

    log.sort((a, b) => getPos(a) - getPos(b))

    let {timestamp, ...hdr} = block.header

    return {
        header: {...hdr, timestamp: new Date(timestamp).valueOf()},
        log
    }
}


function createObjects<S, T extends {id: string}>(src: S[], f: (s: S) => PartialObj<T>): Map<string, PartialObj<T>> {
    let m = new Map<string, PartialObj<T>>()
    for (let i = 0; i < src.length; i++) {
        let obj = f(src[i])
        m.set(obj.id, obj)
    }
    return m
}


type PartialObj<T> = Partial<T> & {id: string, pos: number}


function getPos(item: LogItem): number {
    switch(item.kind) {
        case 'call':
            return item.call.pos
        case 'event':
            return item.event.pos
        default:
            throw unexpectedCase()
    }
}
