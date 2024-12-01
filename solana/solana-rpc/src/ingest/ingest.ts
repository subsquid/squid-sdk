import {concurrentMap, last, Throttler, wait} from '@subsquid/util-internal'
import {Range, splitRange} from '@subsquid/util-internal-range'
import {Commitment, Rpc} from '../rpc'
import {Block, DataRequest} from '../types'
import {getBlocks} from './get-blocks'
import {PollStream} from './poll-stream'


export interface IngestOptions {
    rpc: Rpc
    commitment: Commitment
    req: DataRequest
    range: Range
    strideSize?: number
    concurrency?: number
}


export function ingest(args: IngestOptions): AsyncIterable<Block[]> {
    let {rpc, commitment, req} = args
    let concurrency = Math.max(1, Math.min(args.concurrency ?? 5, rpc.getConcurrency()))
    let strideSize = Math.max(1, args.strideSize ?? 5)

    let head = new Throttler(
        () => rpc.getLatestBlockhash('finalized').then(res => res.context.slot),
        5000
    ).enablePrefetch()

    let poll = new PollStream({
        rpc,
        commitment,
        req,
        from: args.range.from,
        strideSize
    })

    interface Job {
        promise: Promise<Block[]>
    }

    async function* jobs(): AsyncIterable<Job> {
        let beg = args.range.from
        let end = args.range.to ?? Infinity
        while (beg <= end) {
            let top = Math.min(await head.get(), end)
            if (top - beg > strideSize) {
                for (let range of splitRange(strideSize, {from: beg, to: top})) {
                    yield {
                        promise: getBlocks(rpc, commitment, req, range).then(markFinal)
                    }
                }
                beg = top + 1
            } else {
                if (poll.position() != beg) {
                    poll.reset(beg)
                }

                let batch = await poll.next()
                beg = poll.position()

                if (batch.length == 0) {
                    await wait(100)
                    continue
                }

                if (commitment == 'finalized') {
                    markFinal(batch)
                }

                if (last(batch).slot > end) {
                    batch = batch.filter(b => b.slot <= end)
                }

                yield {
                    promise: Promise.resolve(batch)
                }
            }
        }
    }

    return concurrentMap(
        concurrency,
        cleanup(jobs(), () => head.disablePrefetch()),
        job => job.promise
    )
}


function markFinal(blocks: Block[]): Block[] {
    for (let block of blocks) {
        block.isFinal = true
    }
    return blocks
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
