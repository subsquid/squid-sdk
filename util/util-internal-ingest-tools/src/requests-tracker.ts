import {RangeRequest} from '@subsquid/util-internal-range'


export class RequestsTracker<R> {
    constructor(private requests: RangeRequest<R>[]) {}

    getRequestAt(height: number): R | undefined {
        for (let req of this.requests) {
            let from = req.range.from
            let to = req.range.to ?? Infinity
            if (from <= height && height <= to) return req.request
        }
    }

    hasRequestsAfter(height: number): boolean {
        for (let req of this.requests) {
            let to = req.range.to ?? Infinity
            if (height < to) return true
        }
        return false
    }

    *splitBlocksByRequest<B>(blocks: B[], getBlockHeight: (b: B) => number): Iterable<{blocks: B[], request?: R}> {
        let pack: B[] = []
        let packRequest: R | undefined = undefined
        for (let b of blocks) {
            let req = this.getRequestAt(getBlockHeight(b))
            if (req === packRequest) {
                pack.push(b)
            } else {
                if (pack.length) {
                    yield {blocks: pack, request: packRequest}
                }
                pack = [b]
                packRequest = req
            }
        }
        if (pack.length) {
            yield {blocks: pack, request: packRequest}
        }
    }
}
