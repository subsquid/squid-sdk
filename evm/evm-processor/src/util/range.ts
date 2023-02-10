/**
 * Closed range of numbers
 */
export interface Range {
    /**
     * Start of segment (inclusive)
     */
    from: number
    /**
     * End of segment (inclusive). Defaults to infinity.
     */
    to?: number
}

export function rangeIntersection(a: Range, b: Range): Range | undefined {
    let beg = Math.max(a.from, b.from)
    let end = Math.min(rangeEnd(a), rangeEnd(b))
    if (beg > end) return undefined
    if (end === Infinity) {
        return {from: beg}
    } else {
        return {from: beg, to: end}
    }
}

export function rangeDifference(a: Range, b: Range): Range[] {
    let i = rangeIntersection(a, b)
    if (i == null) return [a]
    let result: Range[] = []
    if (a.from < i.from) {
        result.push({from: a.from, to: i.from - 1})
    }
    if (i.to != null && i.to < rangeEnd(a)) {
        let from = i.to + 1
        if (a.to) {
            result.push({from, to: a.to})
        } else {
            result.push({from})
        }
    }
    return result
}

export function rangeEnd(range: Range): number {
    return range.to ?? Infinity
}

export function rangeContains(big: Range, small: Range): boolean {
    return big.from <= small.from && (big.to == null || big.to >= (small.to ?? Infinity))
}
