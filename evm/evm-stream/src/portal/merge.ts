import type {evm} from '@subsquid/portal-client'

export const LOG_FILTER_KEYS: (keyof evm.LogRequest)[] = ['address', 'topic0', 'topic1', 'topic2', 'topic3']
export const TX_FILTER_KEYS: (keyof evm.TransactionRequest)[] = ['to', 'from', 'sighash', 'type']
export const TRACE_FILTER_KEYS: (keyof evm.TraceRequest)[] = [
    'type',
    'createFrom',
    'callTo',
    'callFrom',
    'callSighash',
    'suicideRefundAddress',
    'rewardAuthor',
]
export const STATE_DIFF_FILTER_KEYS: (keyof evm.StateDiffRequest)[] = ['address', 'key', 'kind']

/**
 * Merge flat portal request items that share the same relation flags and
 * differ in at most one filter field.  The differing field gets its value
 * arrays unioned; when one side is `undefined` (= match-all) the result
 * is `undefined` (the wider filter subsumes the narrower one).
 *
 * Runs multiple passes until no more merges are possible.
 */
export function mergeItems<R>(items: R[], filterKeys: readonly string[]): R[] {
    if (items.length <= 1) return items

    let result = items.slice()
    let changed = true
    while (changed) {
        changed = false
        let next: R[] = []
        let consumed = new Set<number>()
        for (let i = 0; i < result.length; i++) {
            if (consumed.has(i)) continue
            let current = result[i]
            for (let j = i + 1; j < result.length; j++) {
                if (consumed.has(j)) continue
                let merged = tryMerge(current, result[j], filterKeys)
                if (merged != null) {
                    current = merged
                    consumed.add(j)
                    changed = true
                }
            }
            next.push(current)
        }
        result = next
    }
    return result
}

function tryMerge<R>(a: R, b: R, filterKeys: readonly string[]): R | null {
    let ao = a as any
    let bo = b as any
    if (!relationsEqual(ao, bo, filterKeys)) return null

    let diffKey: string | null = null
    for (let key of filterKeys) {
        if (!arraysEqual(ao[key], bo[key])) {
            if (diffKey != null) return null
            diffKey = key
        }
    }

    if (diffKey == null) return a

    let merged = {...ao}
    let union = mergeArrays(ao[diffKey], bo[diffKey])
    if (union != null) {
        merged[diffKey] = union
    } else {
        delete merged[diffKey]
    }
    return merged as R
}

function relationsEqual(
    a: Record<string, any>,
    b: Record<string, any>,
    filterKeys: readonly string[],
): boolean {
    let filterSet = new Set<string>(filterKeys)
    let keys = new Set([...Object.keys(a), ...Object.keys(b)])
    for (let key of keys) {
        if (filterSet.has(key)) continue
        if (!!a[key] !== !!b[key]) return false
    }
    return true
}

function arraysEqual(a?: unknown[], b?: unknown[]): boolean {
    if (a == null && b == null) return true
    if (a == null || b == null) return false
    if (a.length !== b.length) return false
    let sa = [...a].sort()
    let sb = [...b].sort()
    return sa.every((v, i) => v === sb[i])
}

function mergeArrays(a?: unknown[], b?: unknown[]): unknown[] | undefined {
    if (a == null || b == null) return undefined
    let set = new Set([...a, ...b])
    return [...set]
}
