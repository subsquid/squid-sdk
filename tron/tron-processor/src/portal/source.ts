import type {PortalClient, tron as portal} from '@subsquid/portal-client'
import {annotateSyncError, assertNotNull, last, wait} from '@subsquid/util-internal'
import type {Batch, DataSource} from '@subsquid/util-internal-processor-tools'
import type {RangeRequest, RangeRequestList} from '@subsquid/util-internal-range'
import {array, cast} from '@subsquid/util-internal-validation'
import assert from 'assert'
import type {DataRequest} from '../data/data-request'
import type {FieldSelection} from '../data/model'
import {Block} from '../mapping/entities'
import {setUpRelations} from '../mapping/relations'
import {getDataSchema} from './data-schema'

export interface TronPortalOptions {
    client: PortalClient
    /**
     * Headers sent with every portal request
     */
    headers?: Record<string, string>
    /**
     * How often to poll the portal for new finalized blocks once
     * the processor caught up with it, in `ms`
     */
    headPollInterval?: number
    /**
     * Number of retries of a failed portal request, `0` disables retries
     */
    retryAttempts?: number
}

/**
 * Finalized block source backed by an SQD Portal dataset.
 */
export class TronPortal implements DataSource<Block, DataRequest> {
    private client: PortalClient
    private headers?: Record<string, string>
    private headPollInterval: number
    private retryAttempts?: number

    constructor(options: TronPortalOptions) {
        this.client = options.client
        this.headers = options.headers
        this.headPollInterval = options.headPollInterval ?? 5_000
        this.retryAttempts = options.retryAttempts
    }

    async getFinalizedHeight(): Promise<number> {
        let head = await this.client.getFinalizedHead(this.getRequestOptions())
        return head?.number ?? -1
    }

    async getBlockHash(height: number): Promise<string | undefined> {
        let query: portal.Query = {
            type: 'tron',
            fromBlock: height,
            toBlock: height,
            includeAllBlocks: true,
            fields: {block: {number: true, hash: true}},
        }
        for await (let {blocks} of this.client.getFinalizedStream(query, {request: this.getRequestOptions()})) {
            for (let block of blocks) {
                if (block.header.number == height) return block.header.hash
            }
        }
        return undefined
    }

    async *getFinalizedBlocks(
        requests: RangeRequestList<DataRequest>,
        stopOnHead?: boolean,
    ): AsyncIterable<Batch<Block>> {
        for (let req of requests) {
            let beg = req.range.from
            let end = req.range.to ?? Number.POSITIVE_INFINITY
            let schema = array(getDataSchema(assertNotNull(req.request.fields)))

            while (beg <= end) {
                let head = await this.getFinalizedHeight()
                if (head < beg) {
                    if (stopOnHead) return
                    await wait(this.headPollInterval)
                    continue
                }

                let query = toPortalQuery({range: {from: beg, to: req.range.to}, request: req.request})
                let streamFrom = beg

                for await (let {blocks: batch, meta} of this.client.getFinalizedStream(query, {
                    request: this.getRequestOptions(),
                })) {
                    if (meta.finalizedHeadNumber != null) {
                        head = Math.max(head, meta.finalizedHeadNumber)
                    }

                    // The stream reports head updates without data,
                    // stop on them once we've seen everything the portal has.
                    if (batch.length == 0) {
                        if (beg > head) break
                        continue
                    }

                    let lastBlock = last(batch).header.number
                    assert(lastBlock >= beg)
                    beg = lastBlock + 1

                    let isHead = beg > head

                    yield {
                        blocks: cast(schema, batch).map((b) => this.mapBlock(b)),
                        isHead,
                    }

                    // Leave the stream at the head, the outer loop
                    // decides whether to stop or to wait for new blocks.
                    if (isHead) break
                }

                // The stream ended without data although the portal reported blocks ahead,
                // back off instead of re-requesting in a loop.
                if (beg == streamFrom) {
                    await wait(this.headPollInterval)
                }
            }
        }
    }

    private getRequestOptions() {
        // passed per request: `PortalClient` can not tell an explicit `0` set on its HTTP client from an unset value
        return {headers: this.headers, retryAttempts: this.retryAttempts}
    }

    @annotateSyncError((src: any) => ({blockHeight: src.header.number, blockHash: src.header.hash}))
    private mapBlock(src: any): Block {
        let {
            header: {number, ...hdr},
            ...items
        } = src
        let block = Block.fromPartial({
            header: {height: number, ...hdr},
            ...items,
        })
        setUpRelations(block)
        return block
    }
}

/**
 * Unlike the legacy archive, the portal returns only the fields that were asked for,
 * so the fields the processor relies on are always requested explicitly.
 */
export function getPortalFields(fields: FieldSelection | undefined): portal.FieldSelection {
    return {
        block: {...fields?.block, number: true, hash: true, parentHash: true},
        transaction: {...fields?.transaction, transactionIndex: true},
        log: {...fields?.log, transactionIndex: true, logIndex: true},
        internalTransaction: {...fields?.internalTransaction, transactionIndex: true, internalTransactionIndex: true},
    }
}

/**
 * Maps a processor data request to a portal query: item requests are sent flat,
 * with their filters and relation flags merged.
 */
export function toPortalQuery(req: RangeRequest<DataRequest>): portal.Query {
    let {fields, includeAllBlocks, ...items} = req.request
    let query: portal.Query = {
        type: 'tron',
        fromBlock: req.range.from,
        toBlock: req.range.to,
        fields: getPortalFields(fields),
        includeAllBlocks,
    }
    let key: keyof typeof items
    for (key in items) {
        let list = items[key]
        if (list?.length) {
            ;(query as any)[key] = list.map((it: any) => ({...it.where, ...it.include}))
        }
    }
    return query
}
