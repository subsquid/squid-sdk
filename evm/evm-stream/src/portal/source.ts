import {evm, isForkException as isPortalForkException, PortalClient} from '@subsquid/portal-client'
import {maybeLast} from '@subsquid/util-internal'
import {
    BlockRef,
    DataSource,
    DataSourceStreamOptions,
    ForkException,
    type BlockBatch,
} from '@subsquid/util-internal-data-source'
import {applyRangeBound, RangeRequestList, type Range, type RangeRequest} from '@subsquid/util-internal-range'
import {Block, FieldSelection, type BlockHeader, type StateDiff, type Trace} from '../data/model'
import {DataRequest} from '../data/request'
import assert from 'assert'

export class PortalDataSource<F extends FieldSelection> implements DataSource<Block<F>> {
    constructor(
        private client: PortalClient,
        private requests: RangeRequestList<DataRequest<F>>,
        private opts?: {squidId?: string}
    ) {}

    getHead(): Promise<BlockRef | undefined> {
        return this.client.getHead({headers: this.getHeaders()})
    }

    getFinalizedHead(): Promise<BlockRef | undefined> {
        return this.client.getFinalizedHead({headers: this.getHeaders()})
    }

    getFinalizedStream(opts?: DataSourceStreamOptions): AsyncIterable<BlockBatch<Block<F>>> {
        return this._getStream(opts, true)
    }

    getStream(opts?: DataSourceStreamOptions): AsyncIterable<BlockBatch<Block<F>>> {
        return this._getStream(opts, false)
    }

    private async *_getStream(
        opts?: DataSourceStreamOptions,
        finalized?: boolean
    ): AsyncIterable<BlockBatch<Block<F>>> {
        let requests = applyRangeBound(this.requests, opts?.after ? {from: opts?.after.number + 1} : undefined)
        if (requests.length === 0) return

        let streamOptions = {request: {headers: this.getHeaders()}}
        let parentBlock = opts?.after

        for (let i = 0; i < requests.length; i++) {
            let req = requests[i]
            let query = mapRequest(req, parentBlock?.hash)

            try {
                for await (let {blocks, meta} of this.client.getStream(query, streamOptions, finalized)) {
                    yield {
                        blocks: blocks.map((block) => mapBlock(block)),
                        finalizedHead: getHead(meta.finalizedHeadNumber, meta.finalizedHeadHash),
                    }

                    let lastBlock = maybeLast(blocks)?.header
                    if (lastBlock != null) {
                        parentBlock = {number: lastBlock.number, hash: lastBlock.hash}
                    }
                }

                // finalize range
                assert(req.range.to != null)

                let nextReq = requests[i + 1]
                let gapRange = {from: req.range.to + 1, to: nextReq ? nextReq.range.from - 1 : undefined}
                if (gapRange.from === gapRange.to) continue

                for await (let {blocks, meta} of this.client.getStream(
                    mapRequest({range: gapRange, request: {fields: req.request.fields}}, parentBlock?.hash),
                    streamOptions,
                    finalized
                )) {
                    let finalizedHead = getHead(meta.finalizedHeadNumber, meta.finalizedHeadHash)
                    if (finalizedHead && req.range.to <= finalizedHead.number) {
                        parentBlock = undefined
                        break
                    }

                    let lastBlock = maybeLast(blocks)?.header
                    if (lastBlock != null) {
                        parentBlock = {number: lastBlock.number, hash: lastBlock.hash}
                    }
                }
            } catch (e: unknown) {
                if (isPortalForkException(e)) {
                    throw new ForkException(e.blockNumber, e.parentBlockHash, e.previousBlocks)
                }

                throw e
            }
        }
    }

    private getHeaders() {
        return this.opts?.squidId ? {'x-squid-id': this.opts.squidId} : undefined
    }
}

function getHead(number?: number | undefined, hash?: string | undefined): BlockRef | undefined {
    if (number == null || hash == null) {
        return undefined
    }
    return {number, hash}
}

function mapRequest<F extends FieldSelection>(
    req: RangeRequest<DataRequest<F>>,
    parentBlockHash?: string
): evm.Query<MapFieldSelection<F>> {
    return {
        type: 'evm',
        fromBlock: req.range.from,
        toBlock: req.range.to === Infinity ? undefined : req.range.to,
        parentBlockHash: parentBlockHash,
        fields: mapFieldSelection(req.request.fields),
        includeAllBlocks: req.request.includeAllBlocks,
        logs: req.request.logs?.map((log) => ({...log.where, ...log.include})),
        transactions: req.request.transactions?.map((transaction) => ({...transaction.where, ...transaction.include})),
        traces: req.request.traces?.map((trace) => ({...trace.where, ...trace.include})),
        stateDiffs: req.request.stateDiffs?.map((stateDiff) => ({...stateDiff.where, ...stateDiff.include})),
    }
}

function mapFieldSelection<F extends FieldSelection>(fields?: F) {
    return {
        block: fields?.block,
        transaction: {...fields?.transaction, transactionIndex: true},
        log: {...fields?.log, logIndex: true, transactionIndex: true},
        trace: {...fields?.trace, transactionIndex: true, traceAddress: true},
        stateDiff: {...fields?.stateDiff, transactionIndex: true, key: true, address: true},
    } satisfies evm.FieldSelection
}

type MapFieldSelection<F extends FieldSelection> = ReturnType<typeof mapFieldSelection<F>>

export function mapBlock<F extends FieldSelection>(rawBlock: evm.Block<MapFieldSelection<F>>): Block<F> {
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
