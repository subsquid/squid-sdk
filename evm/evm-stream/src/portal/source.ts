import {evm, isForkException as isPortalForkException, PortalClient} from '@subsquid/portal-client'
import {def, maybeLast} from '@subsquid/util-internal'
import {BlockBatch, BlockRef, ForkException, StreamRequest} from '@subsquid/util-internal-data-source'
import {getOrGenerateSquidId} from '@subsquid/util-internal-processor-tools'
import {applyRangeBound, FiniteRange, getSize, RangeRequest, RangeRequestList} from '@subsquid/util-internal-range'
import assert from 'assert'
import {Block, FieldSelection} from '../data/model'
import {DataRequest} from '../data/request'
import type {EVMDataSource} from '../source'
import {LOG_FILTER_KEYS, mergeItems, STATE_DIFF_FILTER_KEYS, TRACE_FILTER_KEYS, TX_FILTER_KEYS} from './merge'

export class PortalEvmDataSource<F extends FieldSelection> implements EVMDataSource<F> {
    constructor(
        private client: PortalClient,
        private fields: F,
        private requests: RangeRequestList<DataRequest>,
    ) {}

    async getHead(): Promise<BlockRef> {
        let head = await this.client.getHead({headers: this.getHeaders()})
        assert(head, 'portal has no chain head')
        return head
    }

    async getFinalizedHead(): Promise<BlockRef> {
        let head = await this.client.getFinalizedHead({headers: this.getHeaders()})
        assert(head, 'portal has no finalized head')
        return head
    }

    getFinalizedStream(opts?: StreamRequest): AsyncIterable<BlockBatch<Block<F>>> {
        return this._getStream(opts, true)
    }

    getStream(opts?: StreamRequest): AsyncIterable<BlockBatch<Block<F>>> {
        return this._getStream(opts, false)
    }

    getBlocksCountInRange(range: FiniteRange): number {
        return getSize(
            this.requests.map((r) => r.range),
            range,
        )
    }

    private async *_getStream(opts?: StreamRequest, finalized?: boolean): AsyncIterable<BlockBatch<Block<F>>> {
        let requests = applyRangeBound(this.requests, opts?.from != null ? {from: opts.from} : undefined)
        if (requests.length === 0) return

        let streamOptions = {request: {headers: this.getHeaders()}}
        let parentHash = opts?.parentHash
        let nextBlock = opts?.from

        // Stream a request from the portal and keep (parentHash, nextBlock)
        // in sync with the last block of every batch.
        let drain = async function* (
            this: PortalEvmDataSource<F>,
            req: RangeRequest<DataRequest>,
        ): AsyncIterable<BlockBatch<Block<F>>> {
            for await (let {blocks, meta} of this.client.getStream(
                mapRequest(req, this.fields, parentHash),
                streamOptions,
                finalized,
            )) {
                yield {
                    blocks: blocks.map((block) => mapBlock(block)),
                    finalizedHead: getHead(meta.finalizedHeadNumber, meta.finalizedHeadHash),
                }

                let lastBlock = maybeLast(blocks)?.header
                if (lastBlock != null) {
                    parentHash = lastBlock.hash
                    nextBlock = lastBlock.number + 1
                }
            }
        }.bind(this)

        // Advance the stream until the given block becomes finalized, after
        // which chain-continuity info is no longer needed and is dropped.
        // When `to` is undefined the stream is open-ended and we wait on the
        // current tail (nextBlock - 1).
        let finalize = async (to?: number) => {
            if (nextBlock == null) return
            if (to != null && nextBlock > to) return
            let target = to ?? nextBlock - 1
            for await (let {finalizedHead} of drain({range: {from: nextBlock, to}, request: {}})) {
                if (finalizedHead && target <= finalizedHead.number) {
                    parentHash = undefined
                    nextBlock = undefined
                    return
                }
            }
        }

        try {
            for (let req of requests) {
                // Close any gap preceding this query so parentHash lands on
                // req.range.from (or is safely dropped).
                await finalize(req.range.from - 1)

                if (nextBlock !== req.range.from) {
                    parentHash = undefined
                }

                yield* drain(req)
            }

            // After the last query, wait for its range to finalize before
            // ending the stream.
            await finalize()
        } catch (e: unknown) {
            if (isPortalForkException(e)) {
                throw new ForkException(e.blockNumber, e.parentBlockHash, e.previousBlocks)
            }

            throw e
        }
    }

    private getHeaders() {
        return {'x-squid-id': this.getSquidId()}
    }

    @def
    private getSquidId() {
        return getOrGenerateSquidId()
    }
}

function getHead(number?: number | undefined, hash?: string | undefined): BlockRef | undefined {
    if (number == null || hash == null) {
        return undefined
    }
    return {number, hash}
}

function mapRequest(
    req: RangeRequest<DataRequest>,
    fields: FieldSelection,
    parentBlockHash?: string,
): evm.Query<MapFieldSelection> {
    let logs = req.request.logs?.map((log) => ({...log.where, ...log.include}))
    let transactions = req.request.transactions?.map((tx) => ({...tx.where, ...tx.include}))
    let traces = req.request.traces?.map((trace) => ({...trace.where, ...trace.include}))
    let stateDiffs = req.request.stateDiffs?.map((sd) => ({...sd.where, ...sd.include}))
    return {
        type: 'evm',
        fromBlock: req.range.from,
        toBlock: req.range.to === Infinity ? undefined : req.range.to,
        parentBlockHash: parentBlockHash,
        fields: mapFieldSelection(fields),
        includeAllBlocks: req.request.includeAllBlocks,
        logs: logs && mergeItems(logs, LOG_FILTER_KEYS),
        transactions: transactions && mergeItems(transactions, TX_FILTER_KEYS),
        traces: traces && mergeItems(traces, TRACE_FILTER_KEYS),
        stateDiffs: stateDiffs && mergeItems(stateDiffs, STATE_DIFF_FILTER_KEYS),
    }
}

function mapFieldSelection(fields: FieldSelection) {
    return {
        block: fields.block,
        transaction: {...fields.transaction, transactionIndex: true},
        log: {...fields.log, logIndex: true, transactionIndex: true},
        trace: {...fields.trace, transactionIndex: true, traceAddress: true},
        stateDiff: {...fields.stateDiff, transactionIndex: true, key: true, address: true},
    } satisfies evm.FieldSelection
}

type MapFieldSelection = ReturnType<typeof mapFieldSelection>

export function mapBlock<F extends FieldSelection>(rawBlock: evm.Block<MapFieldSelection>): Block<F> {
    let {number, hash, ...hdr} = rawBlock.header
    let header = {
        number,
        hash,
        height: number,
        ...hdr,
    }
    if ('timestamp' in header && typeof header.timestamp === 'number') {
        header.timestamp = header.timestamp * 1000 // convert to ms
    }

    let block: Block<F> = {
        header: header as any,
        transactions: [],
        logs: [],
        traces: [],
        stateDiffs: [],
    }

    for (let {transactionIndex, ...props} of rawBlock.transactions) {
        block.transactions.push({...props, transactionIndex} as any)
    }

    for (let {logIndex, transactionIndex, ...props} of rawBlock.logs) {
        block.logs.push({logIndex, transactionIndex, ...props} as any)
    }

    for (let {transactionIndex, traceAddress, type, ...props} of rawBlock.traces) {
        block.traces.push({transactionIndex, traceAddress, type, ...props} as any)
    }

    for (let {transactionIndex, address, key, kind, ...props} of rawBlock.stateDiffs) {
        block.stateDiffs.push({transactionIndex, address, key, kind, ...props} as any)
    }

    return block
}
