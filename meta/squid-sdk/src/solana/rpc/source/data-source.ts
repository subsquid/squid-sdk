import {mapRpcBlock} from '@subsquid/solana-normalization'
import {Block as RpcBlock, RpcApi, SolanaRpcDataSource} from '@subsquid/solana-rpc'
import {Block, DataRequest, FieldSelection} from '@subsquid/solana-stream'
import {createLogger} from '@subsquid/logger'
import {BlockBatch, BlockRef, BlockStream, DataSource, StreamRequest} from '@subsquid/util-internal-data-source'
import {FiniteRange, RangeRequestList, getSize} from '@subsquid/util-internal-range'

import {dropEmptyBlocks, streamBoundedRanges} from '../../../common/bounded-stream'
import {decodeBlock} from '../decode/decode'
import {filterBlockItems} from '../filter/filter'

const log = createLogger('sqd:solana-rpc')

export interface SolanaRpcStreamOptions<F extends FieldSelection> {
    rpc: RpcApi
    fields: F
    requests: RangeRequestList<DataRequest>
    strideSize?: number
    strideConcurrency?: number
}

const rpcBlockRef = (b: RpcBlock): BlockRef => ({number: b.slot, hash: b.block.blockhash})

/**
 * An RPC-backed `DataSource<Block<F>>` whose output matches the Portal source's. It delegates
 * streaming, finality tracking, continuity and fork detection to `@subsquid/solana-rpc`'s
 * `SolanaRpcDataSource` (which throws the same `ForkException` the processor handles), then maps
 * every raw block through `@subsquid/solana-normalization` and the ported client-side filter
 * engine, and finally decodes through the reused Portal decoder (`decodeBlock`) so the result is
 * shaped exactly as the Portal source produces.
 *
 * Unlike the EVM adapter, filtering happens on the **full normalized block**, before field
 * projection — so `where` clauses never reference a missing field and no augmentation/projection
 * machinery is needed. `includeAllBlocks` is honored like the Portal: when it is false for a
 * block's range, a block left empty by filtering is dropped (interior blocks only — batch
 * boundaries always survive).
 *
 * Blocks are keyed by **slot** throughout, matching the Portal dataset numbering.
 */
export class SolanaRpcStreamDataSource<F extends FieldSelection> implements DataSource<Block<F>> {
    private inner: SolanaRpcDataSource
    private fields: F
    private requests: RangeRequestList<DataRequest>

    constructor(options: SolanaRpcStreamOptions<F>) {
        this.fields = options.fields
        this.requests = options.requests

        this.inner = new SolanaRpcDataSource({
            rpc: options.rpc,
            req: coarseRequest(options.requests),
            strideSize: options.strideSize ?? 5,
            strideConcurrency: options.strideConcurrency ?? 5,
        })
    }

    getHead(): Promise<BlockRef> {
        return this.inner.getHead()
    }

    getFinalizedHead(): Promise<BlockRef> {
        return this.inner.getFinalizedHead()
    }

    async *getFinalizedStream(req: StreamRequest): BlockStream<Block<F>> {
        for await (let batch of streamBoundedRanges(this.inner, this.requests, req, true, rpcBlockRef)) {
            yield this.mapBatch(batch)
        }
    }

    async *getStream(req: StreamRequest): BlockStream<Block<F>> {
        for await (let batch of streamBoundedRanges(this.inner, this.requests, req, false, rpcBlockRef)) {
            yield this.mapBatch(batch)
        }
    }

    getBlocksCountInRange(range: FiniteRange): number {
        return getSize(
            this.requests.map((r) => r.range),
            range,
        )
    }

    private mapBatch(batch: BlockBatch<RpcBlock>): BlockBatch<Block<F>> {
        let blocks = batch.blocks.map((raw) => this.mapBlock(raw))

        return {
            blocks: dropEmptyBlocks(
                blocks,
                (slot) => this.requestFor(slot)?.includeAllBlocks ?? false,
                (b) => b.header.number,
                (b) =>
                    b.transactions.length > 0 ||
                    b.instructions.length > 0 ||
                    b.logs.length > 0 ||
                    b.balances.length > 0 ||
                    b.tokenBalances.length > 0 ||
                    b.rewards.length > 0,
            ),
            finalizedHead: batch.finalizedHead,
        }
    }

    private mapBlock(raw: RpcBlock): Block<F> {
        let normalized = mapRpcBlock(raw.slot, raw.block, log)
        let request = this.requestFor(raw.slot)
        if (request) {
            filterBlockItems(normalized, request)
        }
        return decodeBlock(normalized, this.fields)
    }

    private requestFor(slot: number): DataRequest | undefined {
        for (let {range, request} of this.requests) {
            if (range.from <= slot && (range.to == null || slot <= range.to)) {
                return request
            }
        }

        return undefined
    }
}

/**
 * Union the per-range stream requests into the coarse `@subsquid/solana-rpc` data request: any
 * transaction-derived item filter (transactions, instructions, logs, balances, token balances)
 * needs full transaction details; rewards fetch only when a reward filter is present. A block's
 * unrequested sections are never fetched — mirroring what the Portal serves for the same query.
 */
export function coarseRequest(requests: RangeRequestList<DataRequest>): {transactions: boolean; rewards: boolean} {
    let transactions = false
    let rewards = false
    for (let {request} of requests) {
        transactions ||= !!(
            request.transactions?.length ||
            request.instructions?.length ||
            request.logs?.length ||
            request.balances?.length ||
            request.tokenBalances?.length
        )
        rewards ||= !!request.rewards?.length
    }
    return {transactions, rewards}
}
