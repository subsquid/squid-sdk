import {concurrentMap, Throttler} from '@subsquid/util-internal'
import {RangeRequestList, splitRange, SplitRequest} from '@subsquid/util-internal-range'
import assert from 'assert'
import {Batch} from './interfaces'


interface RpcApi<R, B> {
    getFinalizedHeight(): Promise<number>
    getSplit(req: SplitRequest<R>): Promise<B[]>
}


export interface RpcIngestOptions<R, B> {
    api: RpcApi<R, B>
    requests: RangeRequestList<R>
    strideSize: number
    concurrency: number
    stopOnHead?: boolean
    heightPollInterval?: number
}


export function rpcIngest<R, B>(args: RpcIngestOptions<R, B>): AsyncIterable<Batch<B>> {
    let {
        api,
        requests,
        strideSize,
        concurrency,
        stopOnHead,
        heightPollInterval = 10_000
    } = args

    assert(strideSize >= 1)
    assert(concurrency >= 1)

    let height = new Throttler(() => api.getFinalizedHeight(), heightPollInterval)

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
                for (let range of splitRange(strideSize, {
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
            let blocks = await api.getSplit(split)
            return {blocks, isHead}
        }
    )
}
