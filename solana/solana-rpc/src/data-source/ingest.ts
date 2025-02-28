import {concurrentMap, last, Throttler, wait} from '@subsquid/util-internal'
import {BlockRef} from '@subsquid/util-internal-data-source'
import {Range, splitRange} from '@subsquid/util-internal-range'
import {Commitment, Rpc} from '../rpc'
import {Block, DataRequest} from '../types'
import {getBlockRef} from '../util'
import {getBlocks} from './get-blocks'
import {PollStream} from './poll-stream'


export interface IngestBatch {
    blocks: Block[]
    /**
     * This property is set, when all blocks in the batch are finalized.
     *
     * It will contain head of the batch or (higher) head of the chain.
     */
    finalized?: BlockRef
}


export interface IngestOptions {
    rpc: Rpc
    commitment: Commitment
    req: DataRequest
    range: Range
    strideSize: number
    strideConcurrency: number
    maxConfirmationAttempts: number
}


/**
 * Ingest all blocks from `args.range`, but without chain continuity guarantee.
 *
 * Empty batches are allowed.
 */
export function ingest(args: IngestOptions): AsyncIterable<IngestBatch> {
    let {
        rpc,
        commitment,
        req,
        strideConcurrency,
        strideSize,
        maxConfirmationAttempts
    } = args

    let finalizedHeadTracker = new Throttler(
        () => rpc.getLatestBlockhash('finalized').then(res => ({
            number: res.context.slot,
            hash: res.value.blockhash
        })),
        5000
    ).enablePrefetch()

    let poll = new PollStream({
        rpc,
        commitment,
        req,
        from: args.range.from,
        strideSize,
        maxConfirmationAttempts
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
                        promise: getBlocks(
                            rpc,
                            'finalized',
                            req,
                            range,
                            maxConfirmationAttempts
                        ).then(async blocks => {
                            let finalized = await finalizedHeadTracker.get()
                            if (finalized.number < fh.number) {
                                finalized = fh
                            }
                            return {
                                blocks,
                                finalized
                            }
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

                if (last(blocks).slot > end) {
                    blocks = blocks.filter(b => b.slot <= end)
                }

                yield {
                    promise: Promise.resolve({
                        blocks,
                        finalized: commitment == 'finalized' ? getBlockRef(last(blocks)) : undefined
                    })
                }
            }
        }
    }

    return concurrentMap(
        strideConcurrency,
        cleanup(jobs(), () => finalizedHeadTracker.disablePrefetch()),
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
