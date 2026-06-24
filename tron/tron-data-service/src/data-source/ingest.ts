import {concurrentMap, last, Throttler, wait} from '@subsquid/util-internal'
import {BlockRef} from '@subsquid/util-internal-data-source'
import {Range, splitRange} from '@subsquid/util-internal-range'
import {BlockData, HttpApi} from '@subsquid/tron-data'
import {getBlockRef, getBlocks, getChainHead, getSolidifiedHead} from './get-blocks'
import {PollStream} from './poll-stream'


export type Commitment = 'latest' | 'finalized'


export interface IngestBatch {
    blocks: BlockData[]
    /**
     * Set when all blocks in the batch are known to be finalized.
     *
     * Contains the head of the chain finalized region at the moment the batch
     * was produced (which can be higher than the last block of the batch).
     */
    finalized?: BlockRef
}


export interface IngestOptions {
    httpApi: HttpApi
    commitment: Commitment
    range: Range
    strideSize: number
    strideConcurrency: number
    headPollInterval: number
}


/**
 * Ingest all blocks from `args.range` without a chain continuity guarantee.
 *
 * Blocks below the finalized head are fetched in parallel strides,
 * the rest is read sequentially by polling the head. Empty batches are allowed.
 *
 * Finality is taken from TRON's own solidified (irreversible) block, so the
 * finalized head is reported directly on every batch and, unlike the EVM
 * implementation, no separate finalization-probing loop is required.
 */
export function ingest(args: IngestOptions): AsyncIterable<IngestBatch> {
    let {httpApi, commitment, strideSize, strideConcurrency, headPollInterval} = args

    let headTracker = new Throttler(() => getChainHead(httpApi), headPollInterval).enablePrefetch()

    let finalizedHeadTracker = new Throttler(() => getSolidifiedHead(httpApi), 5000).enablePrefetch()

    let poll = new PollStream({
        httpApi,
        from: args.range.from,
        strideSize,
        getHead: commitment == 'finalized'
            ? () => finalizedHeadTracker.get().then(ref => ref.number)
            : () => headTracker.get().then(ref => ref.number)
    })

    interface Job {
        promise: Promise<IngestBatch>
    }

    async function* jobs(): AsyncIterable<Job> {
        let beg = args.range.from
        let end = args.range.to ?? Infinity
        while (beg <= end) {
            let finalizedHead = await finalizedHeadTracker.get()
            let top = Math.min(finalizedHead.number, end)
            if (top - beg > strideSize) {
                for (let range of splitRange(strideSize, {from: beg, to: top})) {
                    let fh = finalizedHead
                    yield {
                        promise: getBlocks(httpApi, range).then(async blocks => {
                            let finalized = await finalizedHeadTracker.get()
                            if (finalized.number < fh.number) {
                                finalized = fh
                            }
                            return {blocks, finalized}
                        })
                    }
                }
                beg = top + 1
            } else {
                if (poll.position() != beg) {
                    poll.reset(beg)
                }

                let blocks = await poll.next()
                beg = poll.position()

                if (blocks.length == 0) {
                    await wait(100)
                    continue
                }

                if (last(blocks).height > end) {
                    blocks = blocks.filter(b => b.height <= end)
                }

                let finalized = commitment == 'finalized'
                    ? getBlockRef(last(blocks))
                    : await finalizedHeadTracker.get()

                yield {
                    promise: Promise.resolve({blocks, finalized})
                }
            }
        }
    }

    return concurrentMap(
        strideConcurrency,
        cleanup(jobs(), () => {
            headTracker.disablePrefetch()
            finalizedHeadTracker.disablePrefetch()
        }),
        job => job.promise
    )
}


async function* cleanup<T>(it: AsyncIterable<T>, cb: () => void): AsyncIterable<T> {
    try {
        for await (let i of it) {
            yield i
        }
    } finally {
        cb()
    }
}
