import {
    DataRequest as StreamDataRequest,
    FieldSelection,
    LogRequest as StreamLogRequest,
    StateDiffRequest as StreamStateDiffRequest,
    TraceRequest as StreamTraceRequest,
    TransactionRequest as StreamTransactionRequest,
} from '@subsquid/evm-stream'

/**
 * Flat data request — the evm-stream `{where, include}` request with each item's
 * `where` and `include` spread into a single object. This is the shape the ported
 * filter engine (`filterBlock`) consumes, and it is field-identical to the legacy
 * `@subsquid/evm-processor` `ds-rpc` request (the reference we ported from).
 */
export interface FlatDataRequest {
    includeAllBlocks?: boolean
    logs?: FlatLogRequest[]
    transactions?: FlatTransactionRequest[]
    traces?: FlatTraceRequest[]
    stateDiffs?: FlatStateDiffRequest[]
}

export interface FlatLogRequest {
    address?: string[]
    topic0?: string[]
    topic1?: string[]
    topic2?: string[]
    topic3?: string[]
    transaction?: boolean
    transactionTraces?: boolean
    transactionLogs?: boolean
    transactionStateDiffs?: boolean
}

export interface FlatTransactionRequest {
    to?: string[]
    from?: string[]
    sighash?: string[]
    type?: number[]
    logs?: boolean
    traces?: boolean
    stateDiffs?: boolean
}

export interface FlatTraceRequest {
    type?: string[]
    createFrom?: string[]
    callTo?: string[]
    callFrom?: string[]
    callSighash?: string[]
    suicideRefundAddress?: string[]
    rewardAuthor?: string[]
    transaction?: boolean
    transactionLogs?: boolean
    subtraces?: boolean
    parents?: boolean
}

export interface FlatStateDiffRequest {
    address?: string[]
    key?: string[]
    kind?: string[]
    transaction?: boolean
}

function flattenItem<W extends object, I extends object>(item: {where?: W; include?: I}): W & I {
    return {...item.where, ...item.include} as W & I
}

/**
 * Flatten an evm-stream nested data request into the flat form. Mirrors the
 * `{...where, ...include}` flatten Portal's own `mapRequest` uses.
 */
export function flattenRequest(req: StreamDataRequest): FlatDataRequest {
    return {
        includeAllBlocks: req.includeAllBlocks,
        logs: (req.logs as StreamLogRequest[] | undefined)?.map(flattenItem),
        transactions: (req.transactions as StreamTransactionRequest[] | undefined)?.map(flattenItem),
        traces: (req.traces as StreamTraceRequest[] | undefined)?.map(flattenItem),
        stateDiffs: (req.stateDiffs as StreamStateDiffRequest[] | undefined)?.map(flattenItem),
    }
}

/**
 * The coarse data types an RPC source must fetch to satisfy a request. Drives both
 * the evm-rpc fetch toggles and the capability the probe must verify (a node
 * missing trace/stateDiff support for a request that needs them is "unhealthy").
 */
export interface RequiredData {
    logs: boolean
    receipts: boolean
    traces: boolean
    stateDiffs: boolean
}

/**
 * Derive the coarse data toggles from a flat request + field selection. Ported from
 * `@subsquid/evm-processor` `ds-rpc/request.ts` (`toMappingRequest`), including the
 * relation-implication rules (e.g. a log filter that includes `transaction` forces
 * transaction fetching, and requested receipt fields upgrade logs → receipts).
 */
export function toRequiredData(req: FlatDataRequest, fields: FieldSelection): RequiredData {
    // `logs` is the *raw* need (a log filter or log relation). The "receipts already carry logs, so
    // skip the separate eth_getLogs" de-duplication is deliberately NOT applied here — it must run on
    // the aggregate of all requests (see `unionRequiredData`); applying it per-request lets a config
    // where request A needs logs and request B needs receipts still fire a redundant eth_getLogs.
    //
    // No `transactions` toggle: the RPC source *always* fetches full transactions (mapRpcBlock needs
    // them to normalize a block), so a derived flag would be dead — the fetch can't be turned off.
    // `txs` is still needed to decide whether requested *receipt* fields upgrade the fetch to receipts.
    let txs = transactionsRequested(req)
    return {
        logs: logsRequested(req),
        receipts: txs && isRequested(TX_RECEIPT_FIELDS, fields.transaction),
        traces: tracesRequested(req),
        stateDiffs: stateDiffsRequested(req),
    }
}

/**
 * The coarse fetch plan for the whole request list: the per-request needs OR-ed together, then the
 * logs↔receipts de-duplication applied *once* on the aggregate. A receipt fetch already returns the
 * block's logs, so a separate `eth_getLogs` is only needed when some request wants logs and *nothing*
 * in the list pulls receipts.
 */
export function unionRequiredData(requests: FlatDataRequest[], fields: FieldSelection): RequiredData {
    let acc: RequiredData = {logs: false, receipts: false, traces: false, stateDiffs: false}
    for (let req of requests) {
        let r = toRequiredData(req, fields)
        acc.logs ||= r.logs
        acc.receipts ||= r.receipts
        acc.traces ||= r.traces
        acc.stateDiffs ||= r.stateDiffs
    }
    acc.logs &&= !acc.receipts

    return acc
}

function transactionsRequested(req: FlatDataRequest): boolean {
    if (req.transactions?.length) return true
    for (let items of [req.logs, req.traces, req.stateDiffs]) {
        if (items) {
            for (let it of items) {
                if (it.transaction) return true
            }
        }
    }

    return false
}

function logsRequested(req: FlatDataRequest): boolean {
    if (req.logs?.length) return true
    if (req.transactions) {
        for (let tx of req.transactions) {
            if (tx.logs) return true
        }
    }
    if (req.traces) {
        for (let trace of req.traces) {
            if (trace.transactionLogs) return true
        }
    }

    return false
}

function tracesRequested(req: FlatDataRequest): boolean {
    if (req.traces?.length) return true
    if (req.transactions) {
        for (let tx of req.transactions) {
            if (tx.traces) return true
        }
    }
    if (req.logs) {
        for (let log of req.logs) {
            if (log.transactionTraces) return true
        }
    }

    return false
}

function stateDiffsRequested(req: FlatDataRequest): boolean {
    if (req.stateDiffs?.length) return true
    if (req.transactions) {
        for (let tx of req.transactions) {
            if (tx.stateDiffs) return true
        }
    }
    if (req.logs) {
        for (let log of req.logs) {
            if (log.transactionStateDiffs) return true
        }
    }

    return false
}

const TX_RECEIPT_FIELDS: Record<string, true> = {
    gasUsed: true,
    cumulativeGasUsed: true,
    effectiveGasPrice: true,
    contractAddress: true,
    type: true,
    status: true,
    l1Fee: true,
    l1FeeScalar: true,
    l1GasPrice: true,
    l1GasUsed: true,
    l1BaseFeeScalar: true,
    l1BlobBaseFee: true,
    l1BlobBaseFeeScalar: true,
}

function isRequested(set: Record<string, boolean>, selection?: Record<string, boolean>): boolean {
    if (selection == null) return false
    for (let key in selection) {
        if (set[key] && selection[key]) return true
    }

    return false
}
