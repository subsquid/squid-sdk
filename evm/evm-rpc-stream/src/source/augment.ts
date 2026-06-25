import {FieldSelection} from '@subsquid/evm-stream'

import {FlatDataRequest} from '../filter/request'

/**
 * Augment a field selection with the fields the request's `where` clauses need to be
 * *evaluated*, even when they aren't selected for output (plan §11). The decoder must fetch
 * e.g. `log.address` to filter on it; otherwise the filter predicate sees `undefined`.
 *
 * Trace `where` keys (`createFrom`/`callTo`/…) are identical to the trace field-selection
 * keys, so they map across directly. StateDiff `address`/`key`/`kind` are always-present
 * required fields and need no augmentation.
 *
 * The result is a superset of the input. When it adds fields, `EvmRpcStreamDataSource` projects
 * them back out after filtering (re-decoding at exactly `fields`), so the augmentation stays
 * internal to filter evaluation and never leaks into the yielded block.
 */
export function augmentFields(fields: FieldSelection, requests: FlatDataRequest[]): FieldSelection {
    let log = {...fields.log}
    let transaction = {...fields.transaction}
    let trace = {...fields.trace}

    for (let req of requests) {
        for (let it of req.logs ?? []) {
            if (it.address) log.address = true
            if (it.topic0 || it.topic1 || it.topic2 || it.topic3) log.topics = true
        }
        for (let it of req.transactions ?? []) {
            if (it.to) transaction.to = true
            if (it.from) transaction.from = true
            if (it.sighash) transaction.sighash = true
            if (it.type) transaction.type = true
        }
        for (let it of req.traces ?? []) {
            if (it.createFrom) (trace as any).createFrom = true
            if (it.callTo) (trace as any).callTo = true
            if (it.callFrom) (trace as any).callFrom = true
            if (it.callSighash) (trace as any).callSighash = true
            if (it.suicideRefundAddress) (trace as any).suicideRefundAddress = true
            if (it.rewardAuthor) (trace as any).rewardAuthor = true
        }
    }

    return {...fields, log, transaction, trace}
}
