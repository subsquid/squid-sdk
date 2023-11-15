import {concurrentMap, Throttler} from '@subsquid/util-internal'
import {RangeRequestList, splitRange, SplitRequest} from '@subsquid/util-internal-range'
import assert from 'assert'
import {Batch} from './interfaces'


export interface ColdIngestOptions<R, B> {
    getFinalizedHeight: () => Promise<number>
    getSplit: (req: SplitRequest<R>) => Promise<B[]>
    requests: RangeRequestList<R>
    splitSize: number
    concurrency: number
    stopOnHead?: boolean
    headPollInterval?: number
}


export function coldIngest<R, B>(args: ColdIngestOptions<R, B>): AsyncIterable<Batch<B>> {
    let {
        getFinalizedHeight,
        getSplit,
        requests,
        splitSize,
        concurrency,
        stopOnHead,
        headPollInterval = 10_000
    } = args

    assert(splitSize >= 1)
    assert(concurrency >= 1)

    let height = new Throttler(getFinalizedHeight, headPollInterval)

    async function *strides(): AsyncIterable<{split: SplitRequest<R>, isHead: boolean}> {
        let top = await height.get()
        for (let req of requests) {
            let beg = req.range.from
            let end = req.range.to ?? Infinity
            while (beg <= end) {
                if (top < beg) {
                    top = await height.get()
                }
                while (top < beg) {
                    if (stopOnHead) return
                    top = await height.call()
                }
                for (let range of splitRange(splitSize, {
                    from: beg,
                    to: Math.min(top, end)
                })) {
                    let split = {
                        range,
                        request: req.request
                    }
                    beg = range.to + 1
                    if (beg > top) {
                        top = await height.get()
                    }
                    yield {
                        split,
                        isHead: beg > top
                    }
                }
            }
        }
    }

    return concurrentMap(
        concurrency,
        strides(),
        async ({split, isHead}) => {
            let blocks = await getSplit(split)
            return {blocks, isHead}
        }
    )
}
