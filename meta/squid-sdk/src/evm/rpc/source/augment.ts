import {FieldSelection} from '@subsquid/evm-stream'

import {FlatDataRequest} from '../filter/request'

/**
 * Augment a field selection with the fields the request's `where` clauses need to be
 * *evaluated*, even when they aren't selected for output (plan §11). The decoder must fetch
 * e.g. `log.address` to filter on it; otherwise the filter predicate sees `undefined`.
 *
 * Trace `where` keys (`createFrom`/`callTo`/…) are identical to the trace field-selection
 * keys, so they map across directly.
 *
 * Trace `type` and stateDiff `kind` are deliberately *not* augmented: the Portal decoder's
 * `patchQueryFields` force-enables both regardless of selection (and the trace/stateDiff schemas
 * are `taggedUnion`s keyed on them), so they are always decoded and the filter can always read
 * them. StateDiff `address`/`key` are likewise force-selected by `mapFieldSelection`.
 *
 * The result is a superset of the input. `grew` reports whether any field was actually added — the
 * only reason to project: when `grew`, `EvmRpcStreamDataSource` re-decodes at exactly `fields` after
 * filtering, so the augmentation stays internal to filter evaluation and never leaks into the
 * yielded block. `grew` is tracked here rather than re-derived by a second structural diff of the
 * result against the input, since this is the only place a field is ever added.
 */
export function augmentFields(
    fields: FieldSelection,
    requests: FlatDataRequest[],
): {fields: FieldSelection; grew: boolean} {
    let log = {...fields.log}
    let transaction = {...fields.transaction}
    let trace: Record<string, boolean> = {...fields.trace}
    let grew = false

    // Set `key` on `sel` if the `where` clause needs it and it isn't already selected, recording the
    // growth. `sel` is `any` only because trace's `where` keys aren't in its field-selection type.
    let need = (sel: any, key: string, wanted: unknown): void => {
        if (wanted && !sel[key]) {
            sel[key] = true
            grew = true
        }
    }

    for (let req of requests) {
        for (let it of req.logs ?? []) {
            need(log, 'address', it.address)
            need(log, 'topics', it.topic0 || it.topic1 || it.topic2 || it.topic3)
        }
        for (let it of req.transactions ?? []) {
            need(transaction, 'to', it.to)
            need(transaction, 'from', it.from)
            need(transaction, 'sighash', it.sighash)
            need(transaction, 'type', it.type)
        }
        for (let it of req.traces ?? []) {
            need(trace, 'createFrom', it.createFrom)
            need(trace, 'callTo', it.callTo)
            need(trace, 'callFrom', it.callFrom)
            need(trace, 'callSighash', it.callSighash)
            need(trace, 'suicideRefundAddress', it.suicideRefundAddress)
            need(trace, 'rewardAuthor', it.rewardAuthor)
        }
    }

    return {fields: {...fields, log, transaction, trace}, grew}
}
