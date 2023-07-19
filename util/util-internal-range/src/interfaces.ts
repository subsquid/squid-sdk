/**
 * A range of blocks with inclusive boundaries
 */
export interface Range {
    from: number
    to?: number
}


/**
 * A finite range of blocks with inclusive boundaries
 */
export interface FiniteRange {
    from: number
    to: number
}


export interface RangeRequest<R> {
    range: Range
    request: R
}


export interface SplitRequest<R> {
    range: FiniteRange
    request: R
}


/**
 * An ordered list of non-overlapping ranges
 */
export type RangeList = Range[]


/**
 * An ordered list of non-overlapping range requests
 */
export type RangeRequestList<R> = RangeRequest<R>[]
