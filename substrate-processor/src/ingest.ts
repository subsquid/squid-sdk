import {assertNotNull, Output, unexpectedCase} from "@subsquid/util"
import assert from "assert"
import fetch from "node-fetch"
import {Batch, DataHandlers} from "./batch"
import {SubstrateBlock, SubstrateEvent, SubstrateExtrinsic} from "./interfaces/substrate"
import {AbortHandle, Channel, wait} from "./util/async"
import {hasProperties, unique} from "./util/misc"
import {rangeEnd} from "./util/range"

/**
 * Defines block data as part of the ingestion inflow
 * 
 * @property block: {@link SubstrateBlock}
 * @property events: {@link SubstrateEvent}
 */
export interface BlockData {
    block: SubstrateBlock
    events: SubstrateEvent[]
}

/**
 * Defines a batch of ingested blocks.
 * 
 * @property range: a {@link Range} of scanned blocks
 * @property blocks: an array of {@link BlockData}
 */
export interface DataBatch extends Batch {
    /**
     * This is roughly the range of scanned blocks
     */
    range: {from: number, to: number}
    blocks: BlockData[]
}

/**
 * Exposes functions to collect metrics about the ingestion process
 */
export interface IngestMetrics {
    setChainHeight(height: number): void
    setIngestSpeed(blocksPerSecond: number): void
}

/**
 * Set of options for ingesting blockchain data.
 * 
 * @property archive: Subsquid archive URL
 * @property archivePollIntervalMS: Polling interval for the Subssquid Archive, in milliseconds
 * @property batches$: Mutable array of batches to ingest.
 * @property batchSize: the number of blocks in a batch
 * @property metrics: {@link IngestMetrics} (optional)
 */
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

/**
 * Manages the ingestion of blockchain blocks in batches.
 * 
 * The classes' constructor takes care of starting the ingestion loop as well.
 * 
 * @see run
 * @see loop
 * @see nextBatch
 */
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

    /**
     * Asynchronous function that will return a new batch of ingested blocks
     * 
     * @returns a Promise to a {@link DataBatch}, if there is data, `null` otherwise
     */
    nextBatch(): Promise<DataBatch | null> {
        return this.out.take()
    }

    /**
     * Asynchronous function that terminates the ingestion loop
     * 
     * @internal 
     */
    close(): Promise<Error | void> {
        this._abort.abort()
        return this.ingestion
    }

    /**
     * Asynchronous function to starts the ingestion loop
     * 
     * @internal 
     */
    private async run(): Promise<void | Error> {
        try {
            await this.loop()
        } catch (err: any) {
            return err
        } finally {
            this.out.close(null)
        }
    }

    /**
     * @internal
     */
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
            if (blocks.length === this.limit && blocks[blocks.length - 1].block.height < rangeEnd(batch.range)) {
                to = blocks[blocks.length - 1].block.height
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
                let speed = blocks.length * Math.pow(10, 9) / duration
                this.options.metrics.setIngestSpeed(speed)
            }

            await this._abort.guard(this.out.put({
                blocks,
                range: {from, to},
                handlers: batch.handlers
            }))
        }
    }

    /**
     * @internal
     */
    private async batchFetch(batch: Batch, archiveHeight: number): Promise<BlockData[]> {
        let from = batch.range.from
        let to = Math.min(archiveHeight, rangeEnd(batch.range))
        assert(from <= to)

        let hs = batch.handlers
        let events = Object.keys(hs.events)
        let notAllBlocksRequired = hs.pre.length == 0 && hs.post.length == 0

        let blockArgs = {
            limit: this.limit,
            order_by: {height: {$: 'asc'}},
            where: {
                height: {_gte: from, _lte: to},
                _or: [] as any[]
            }
        }

        if (notAllBlocksRequired) {
            events.forEach(name => {
                blockArgs.where._or.push({
                    events: {_contains: [{name}]}
                })
            })
            let extrinsics = unique(Object.entries(hs.extrinsics).flatMap(e => Object.keys(e[1])))
            extrinsics.forEach(name => {
                blockArgs.where._or.push({
                    extrinsics: {_contains: [{name}]}
                })
            })
            if (hasProperties(hs.evmLogs)) {
                let blocks = await this.fetchBlocksWithEvmData(from, to, hs.evmLogs)
                blocks.evm_log_idx.forEach(({block_id}) => {
                    blockArgs.where._or.push({id: {_eq: block_id}})
                })
            }
        }

        let eventArgs = {
            order_by: {indexInBlock: {$: 'asc'}},
            where: {_or: [] as any[]}
        }

        if (events.length > 0) {
            eventArgs.where._or.push({
                name: {_in: events}
            })
        }

        for (let event in hs.extrinsics) {
            let extrinsics = Object.keys(hs.extrinsics[event])
            eventArgs.where._or.push({
                name: {_eq: event},
                extrinsic: {name: {_in: extrinsics}}
            })
        }

        this.forEachEvmContract(hs.evmLogs, (contract, topics) => {
            eventArgs.where._or.push({
                evmLogAddress: {_eq: contract},
                _or: topics.map(topic => {
                    return {
                        evmLogTopics: {_contains: topic}
                    }
                })
            })
        })

        let q = new Output()
        q.block(`query`, () => {
            q.block(`indexerStatus`, () => {
                q.line('head')
            })
            q.block(`substrate_block(${printArguments(blockArgs)})`, () => {
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
                    q.line('extrinsic: extrinsicName')
                    q.line('extrinsicId')
                })
                q.line('extrinsics')
                q.line()
                q.block(`substrate_events(${printArguments(eventArgs)})`, () => {
                    q.line('id')
                    q.line('name')
                    q.line('method')
                    q.line('section')
                    q.line('params')
                    q.line('indexInBlock')
                    q.line('blockNumber')
                    q.line('blockTimestamp')
                    if (hasProperties(hs.evmLogs)) {
                        q.line('evmLogAddress')
                        q.line('evmLogData')
                        q.line('evmLogTopics')
                        q.line('evmHash')
                    }
                    q.block('extrinsic', () => {
                        q.line('id')
                    })
                })
            })
        })
        let gql = q.toString()
        let response = await this.archiveRequest<any>(gql)
        this.setArchiveHeight(response)
        return this.joinExtrinsicsAndDoPostProcessing(response.substrate_block)
    }

    /**
     * @internal
     */
    private async joinExtrinsicsAndDoPostProcessing(fetchedBlocks: any[]): Promise<BlockData[]> {
        let extrinsicIds = new Set<string>()
        let blocks = new Array<BlockData>(fetchedBlocks.length)

        for (let i = 0; i < fetchedBlocks.length; i++) {
            i > 0 && assert(fetchedBlocks[i - 1].height < fetchedBlocks[i].height)
            let {timestamp, substrate_events: events, ...block} = fetchedBlocks[i]
            block.timestamp = Number.parseInt(timestamp)
            for (let j = 0; j < events.length; j++) {
                j > 0 && assert(events[j - 1].indexInBlock < events[j].indexInBlock)
                let event = events[j]
                event.blockTimestamp = block.timestamp
                if (event.extrinsic) {
                    extrinsicIds.add(`"${event.extrinsic.id}"`)
                }
            }
            blocks[i] = {block, events}
        }

        if (extrinsicIds.size == 0) return blocks

        let q = new Output()
        q.block(`query`, () => {
            q.block(`substrate_extrinsic(where: {id: {_in: [${Array.from(extrinsicIds).join(', ')}]}})`, () => {
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
        let gql = q.toString()
        let {substrate_extrinsic}: { substrate_extrinsic: SubstrateExtrinsic[] } = await this.archiveRequest(gql)

        let extrinsics = new Map<string, SubstrateExtrinsic>() // lying a bit about type here
        for (let i = 0; i < substrate_extrinsic.length; i++) {
            let ex = substrate_extrinsic[i]
            if (ex.tip != null) {
                ex.tip = BigInt(ex.tip)
            }
            extrinsics.set(ex.id, ex)
        }

        for (let i = 0; i < blocks.length; i++) {
            let events = blocks[i].events
            for (let j = 0; j < events.length; j++) {
                let event = events[j]
                if (event.extrinsic) {
                    event.extrinsic = assertNotNull(extrinsics.get(event.extrinsic.id))
                }
            }
        }

        return blocks
    }

    /**
     * @internal
     */
    private fetchBlocksWithEvmData(from: number, to: number, logs: DataHandlers['evmLogs']): Promise<{evm_log_idx: {block_id: string}[]}> {
        let args: any = {
            limit: this.limit,
            distinct_on: {$: 'block_id'},
            where: {
                block_id: {
                    _gte: String(from).padStart(10, '0'),
                    _lte: String(to).padStart(10, '0')
                },
                _or: []
            }
        }

        this.forEachEvmContract(logs, (contract, topics) => {
            args.where._or.push({
                contract_address: {_eq: contract},
                _or: (topics.length == 0 ? ['*'] : topics).map(topic => {
                    return {
                        topic: {_eq: topic}
                    }
                })
            })
        })

        let q = new Output()
        q.block('query', () => {
            q.block(`evm_log_idx(${printArguments(args)})`, () => {
                q.line('block_id')
            })
        })
        let gql = q.toString()
        return this.archiveRequest(gql)
    }

    /**
     * Collects the set of mentioned topics per contract.
     *
     * If there is a handler without any topic restriction the resulting set will be empty.
     * Otherwise, every topic mentioned in any restriction will be included in the resulting set.
     *
     * The ingester will fetch every evm.Log event which includes any mentioned topic (regardless it's position).
     * This is a lame procedure, we'll rework it when new archive will be ready.
     */
    private forEachEvmContract(logs: DataHandlers['evmLogs'], cb: (contract: string, topics: string[]) => void): void {
        for (let contract in logs) {
            let topics: string[] = []
            for (let h of logs[contract]) {
                if (h.filter ==null) {
                    return cb(contract, [])
                }
                let allEmpty = true
                for (let set of h.filter) {
                    if (set == null || Array.isArray(set) && set.length == 0) {
                        continue
                    }
                    allEmpty = false
                    if (Array.isArray(set)) {
                        topics.push(...set)
                    } else {
                        topics.push(set)
                    }
                }
                if (allEmpty) {
                    return cb(contract, [])
                }
            }
            cb(contract, unique(topics))
        }
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

    private setArchiveHeight(res: { indexerStatus: { head: number } }): void {
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

/**
 * @internal
 */
function printArguments(args: any): string {
    let exp = _printArguments(args)
    assert(exp[0] == '{' && exp[exp.length - 1] == '}')
    return exp.slice(1, exp.length - 1)
}

/**
 * @internal
 */
function _printArguments(args: any): string {
    if (args == null) return ''
    switch(typeof args) {
        case 'string':
            return `"${args}"`
        case 'number':
            return ''+args
        case 'object':
            if (Array.isArray(args)) {
                return `[${args.map(i => _printArguments(i)).filter(e => !!e).join(', ')}]`
            } else if (args.$) {
                return args.$
            } else {
                let fields: string[] = []
                collectFields(args, fields)
                return fields.length ? `{${fields.join(', ')}}` : ''
            }
        default:
            throw unexpectedCase(typeof args)
    }
}

/**
 * @internal 
 */
function collectFields(obj: any, fields: string[]): void {
    for (let field in obj) {
        let val = obj[field]
        if (field == '_or') {
            assert(Array.isArray(val))
            collectOrExpressions(val, fields)
        } else {
            let exp = _printArguments(val)
            if (exp) {
                fields.push(`${field}: ${exp}`)
            }
        }
    }
}

/**
 * @internal
 */
function collectOrExpressions(or: any[], fields: string[]): void {
    switch(or.length) {
        case 0:
            return
        case 1:
            return collectFields(or[0], fields)
        default:
            fields.push(`_or: ${_printArguments(or)}`)
    }
}
