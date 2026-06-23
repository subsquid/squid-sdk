import {mapRpcBlock} from '@subsquid/evm-normalization'
import {Block, DataRequest, FieldSelection} from '@subsquid/evm-stream'
import {EvmRpcDataSource, Rpc, DataRequest as RpcDataRequest, Block as RpcBlock} from '@subsquid/evm-rpc'
import {BlockBatch, BlockRef, BlockStream, DataSource, StreamRequest} from '@subsquid/util-internal-data-source'
import {FiniteRange, RangeRequest, RangeRequestList, applyRangeBound, getSize} from '@subsquid/util-internal-range'

import {decodeBlock} from '../decode/decode'
import {filterBlock, setUpRelations} from '../filter/filter'
import {FlatDataRequest, flattenRequest, toRequiredData} from '../filter/request'
import {augmentFields} from './augment'

/**
 * RPC method-selection + data toggles that aren't derivable from the query — they depend on
 * the chain / provider (the "C1" deploy-config layer, plan §S5). Supplied by per-network
 * presets; merged into the coarse evm-rpc `DataRequest`.
 */
export interface RpcMethodOptions {
    useTraceApi?: boolean
    useDebugTraceBlockByNumber?: boolean
    useDebugApiForStateDiffs?: boolean
    debugTraceTimeout?: string
}

export interface EvmRpcStreamOptions<F extends FieldSelection> {
    rpc: Rpc
    fields: F
    requests: RangeRequestList<DataRequest>
    method?: RpcMethodOptions
    strideSize?: number
    strideConcurrency?: number
}

/**
 * An RPC-backed `DataSource<Block<F>>` whose output matches the Portal source's. It delegates
 * streaming, finality tracking, continuity and fork detection to `@subsquid/evm-rpc`'s
 * `EvmRpcDataSource` (which throws the same `ForkException` the processor handles), then maps
 * every raw block through the reused Portal decoder (`decodeBlock`) and the ported client-side
 * filter engine (`filterBlock`) so the result is shaped exactly as the Portal source produces.
 *
 * v1 scope: client-side filtering augments the field selection with the fields its `where`
 * clauses reference, so the yielded block can be a *superset* of `fields` when a filter targets
 * an unselected field. Projecting back to exactly `fields` and `includeAllBlocks:false`
 * (dropping empty blocks) are noted refinements; `includeAllBlocks:true` semantics are used.
 */
export class EvmRpcStreamDataSource<F extends FieldSelection> implements DataSource<Block<F>> {
    private inner: EvmRpcDataSource
    private fields: F
    private augmentedFields: FieldSelection
    private requests: RangeRequestList<DataRequest>
    private flatRequests: {range: RangeRequest<DataRequest>['range']; request: FlatDataRequest}[]
    private withTraces: boolean
    private withStateDiffs: boolean

    constructor(options: EvmRpcStreamOptions<F>) {
        this.fields = options.fields
        this.requests = options.requests
        this.flatRequests = options.requests.map((r) => ({range: r.range, request: flattenRequest(r.request)}))
        this.augmentedFields = augmentFields(options.fields, this.flatRequests.map((r) => r.request))

        let coarse = unionRequiredData(this.flatRequests.map((r) => r.request), options.fields)
        this.withTraces = coarse.traces
        this.withStateDiffs = coarse.stateDiffs

        let req: RpcDataRequest = {
            transactions: coarse.transactions,
            logs: coarse.logs,
            receipts: coarse.receipts,
            traces: coarse.traces,
            stateDiffs: coarse.stateDiffs,
            useTraceApi: options.method?.useTraceApi,
            useDebugTraceBlockByNumber: options.method?.useDebugTraceBlockByNumber,
            useDebugApiForStateDiffs: options.method?.useDebugApiForStateDiffs,
            debugTraceTimeout: options.method?.debugTraceTimeout,
        }

        this.inner = new EvmRpcDataSource({
            rpc: options.rpc,
            req,
            strideSize: options.strideSize,
            strideConcurrency: options.strideConcurrency,
        })
    }

    getHead(): Promise<BlockRef> {
        return this.inner.getHead()
    }

    getFinalizedHead(): Promise<BlockRef> {
        return this.inner.getFinalizedHead()
    }

    async *getFinalizedStream(req: StreamRequest): BlockStream<Block<F>> {
        for await (let batch of this.inner.getFinalizedStream(req)) {
            yield this.mapBatch(batch)
        }
    }

    async *getStream(req: StreamRequest): BlockStream<Block<F>> {
        for await (let batch of this.inner.getStream(req)) {
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
        return {
            blocks: batch.blocks.map((raw) => this.mapBlock(raw)),
            finalizedHead: batch.finalizedHead,
        }
    }

    private mapBlock(raw: RpcBlock): Block<F> {
        let normalized = mapRpcBlock(raw, {withTraces: this.withTraces, withStateDiffs: this.withStateDiffs})
        let block = decodeBlock(normalized, this.augmentedFields)

        let flat = this.flatRequestFor(block.header.number)
        if (flat) {
            filterBlock(block, flat, setUpRelations(block))
        }

        return block as Block<F>
    }

    private flatRequestFor(blockNumber: number): FlatDataRequest | undefined {
        for (let {range, request} of this.flatRequests) {
            if (range.from <= blockNumber && (range.to == null || blockNumber <= range.to)) {
                return request
            }
        }

        return undefined
    }
}

function unionRequiredData(requests: FlatDataRequest[], fields: FieldSelection) {
    let acc = {transactions: false, logs: false, receipts: false, traces: false, stateDiffs: false}
    for (let req of requests) {
        let r = toRequiredData(req, fields)
        acc.transactions ||= r.transactions
        acc.logs ||= r.logs
        acc.receipts ||= r.receipts
        acc.traces ||= r.traces
        acc.stateDiffs ||= r.stateDiffs
    }

    return acc
}

// Re-export so the bounded-stream consumer can apply request range bounds the same way.
export {applyRangeBound}
