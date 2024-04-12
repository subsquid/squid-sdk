import {Block, GetBlock} from '@subsquid/solana-rpc-data'
import {concurrentMap, last, maybeLast, Throttler, wait} from '@subsquid/util-internal'
import {assertRangeList, FiniteRange, getRequestAt, RangeRequest, splitRange} from '@subsquid/util-internal-range'
import assert from 'assert'
import {DataRequest} from '../base'
import {Rpc} from '../rpc'
import {AsyncJobTracker, AsyncProbe, isConsistentChain, toBlock} from '../util'
import {PollStream} from './poll'
import {findSlot, HeightAndSlot} from './slot-search'


export interface IngestFinalizedBlocksOptions {
    requests: RangeRequest<DataRequest>[]
    stopOnHead?: boolean
    rpc: Rpc
    strideSize: number
    strideConcurrency: number
    headPollInterval: number
}


export async function* ingestFinalizedBlocks(options: IngestFinalizedBlocksOptions): AsyncIterable<Block[]> {
    let requests = options.requests

    assertRangeList(requests.map(req => req.range))

    let blockStream = concurrentMap(
        options.strideConcurrency,
        new ColdIngest(options).jobs(),
        job => job.promise
    )

    let prev: Block | undefined

    for await (let batch of blockStream) {
        if (batch.length == 0) continue

        if (getRequestAt(requests, batch[0].height - 1)) {
            if (prev == null) throw new ChainConsistencyError(batch[0])
        } else if (prev) {
            assert(prev.height + 1 < batch[0].height)
            prev = undefined
        }

        for (let block of batch) {
            if (prev && !isConsistentChain(prev, block)) {
                throw new ChainConsistencyError(batch[0])
            }
            prev = block
        }

        yield batch
    }
}


class ChainConsistencyError extends Error {
    constructor(top: Block) {
        super(
            `Chain consistency was violated around slot ${top.block.parentSlot}. ` +
            `Perhaps you should increase concurrent fetch threshold`
        )
    }
}


interface FetchJob {
    promise: Promise<Block[]>
}


class ColdIngest {
    private rpc: Rpc
    private head: Throttler<number>
    private bottom: HeightAndSlot
    private top?: HeightAndSlot

    constructor(private options: IngestFinalizedBlocksOptions) {
        this.rpc = options.rpc
        this.head = new Throttler(
            () => this.rpc.getTopSlot('finalized'),
            this.options.headPollInterval
        )
        this.bottom = {
            height: 0,
            slot: 0
        }
    }

    private async getSlot(height: number): Promise<number | undefined> {
        if (this.top == null) {
            let slot = await this.head.get()
            this.top = {
                slot,
                height: await this.rpc.getFinalizedBlockHeight(slot)
            }
        }
        while (this.top.height < height) {
            let slot = await this.waitForSlot(this.top.slot + height - this.top.height)
            if (slot == null) return
            this.top = {
                slot,
                height: await this.rpc.getFinalizedBlockHeight(slot)
            }
        }
        return findSlot(this.rpc, height, this.bottom, this.top)
    }

    private async waitForSlot(slot: number): Promise<number | undefined> {
        let head = await this.head.get()
        while (head < slot) {
            if (this.options.stopOnHead) return
            head = await this.head.call()
        }
        return head
    }

    async *jobs(): AsyncIterable<FetchJob> {
        let requests = this.options.requests
        if (requests.length == 0) return

        for (let req of requests) {
            let beg = req.range.from
            let end = req.range.to ?? Infinity

            let begSlot = await this.getSlot(beg)
            if (begSlot == null) return

            while (beg <= end) {
                let headSlot = await this.head.get()
                if (this.options.stopOnHead && headSlot < begSlot) return
                if (!this.options.stopOnHead && headSlot - begSlot < this.options.strideSize) {
                    yield* this.serialFetch(req.request, begSlot, end)
                } else {
                    let endSlot = Math.min(headSlot, begSlot + end - beg)
                    yield* this.concurrentFetch(req.request, begSlot, endSlot)
                }
                beg = this.bottom.height + 1
                begSlot = this.bottom.slot + 1
            }
        }
    }

    private async *serialFetch(req: DataRequest, fromSlot: number, endBlock: number): AsyncIterable<FetchJob> {
        let headProbe = new AsyncProbe(await this.head.get(), () => this.head.call())

        let stream = new PollStream(
            this.rpc,
            this.options.strideSize,
            'finalized',
            req,
            fromSlot
        )

        let retrySchedule = [0, 100, 200, 400, 1000, 2000]
        let retryAttempts = 0

        while (stream.isOnHead() || headProbe.get() - stream.getHeadSlot() < this.options.strideSize * 2) {
            let blocks = await stream.next()
            if (blocks.length == 0) {
                let pause = retrySchedule[Math.max(retryAttempts, retrySchedule.length - 1)]
                await wait(pause)
                retryAttempts += 1
            } else {
                retryAttempts = 0
                while (last(blocks).height > endBlock) {
                    blocks.pop()
                }
                this.setBottom(last(blocks))
                yield {promise: Promise.resolve(blocks)}
                if (this.bottom.height == endBlock) return
            }
        }
    }

    private async *concurrentFetch(req: DataRequest, fromSlot: number, toSlot: number): AsyncIterable<FetchJob> {
        let jobs = new AsyncJobTracker()
        for (let range of splitRange(this.options.strideSize, {from: fromSlot, to: toSlot})) {
            let promise = getColdBlocks(
                this.rpc.withPriority(range.from),
                range,
                req
            ).then(blocks => {
                this.setBottom({
                    height: Math.max(this.bottom.height, maybeLast(blocks)?.height ?? 0),
                    slot: Math.max(this.bottom.slot, range.to)
                })
                return blocks
            })
            jobs.register(promise)
            yield {promise}
        }
        await jobs.done()
    }

    private setBottom(block: HeightAndSlot): void {
        assert(block.height >= this.bottom.height && block.slot >= this.bottom.slot)
        this.bottom = {
            height: block.height,
            slot: block.slot
        }
    }
}


async function getColdBlocks(
    rpc: Rpc,
    slots: FiniteRange | number[],
    req: DataRequest
): Promise<Block[]> {
    if (!Array.isArray(slots)) {
        let range = slots
        slots = []
        for (let slot = range.from; slot <= range.to ; slot++) {
            slots.push(slot)
        }
    }

    let result = await getColdSlots(rpc, slots, req, 1)

    let blocks: Block[] = []

    for (let i = 0; i < result.length; i++) {
        let block = result[i]
        if (block) {
            blocks.push(
                toBlock(slots[i], block)
            )
        }
    }

    return blocks
}


async function getColdSlots(
    rpc: Rpc,
    slots: number[],
    req: DataRequest,
    depth: number
): Promise<(GetBlock | undefined)[]> {
    let result = await rpc.getBlockBatch(slots, {
        commitment: 'finalized',
        maxSupportedTransactionVersion: 0,
        rewards: !!req.rewards,
        transactionDetails: req.transactions ? 'full' : 'none'
    })

    let missing: number[] = []

    for (let i = 0; i < result.length; i++) {
        if (result[i] === null) {
            missing.push(i)
        }
    }

    if (missing.length == 0) return result as (GetBlock | undefined)[]

    if (depth > 10) {
        throw new Error(`Block at slot ${slots[missing[0]]} is not conformed with finalized commitment`)
    }

    let filled = await getColdSlots(rpc, missing.map(i => slots[i]), req, depth + 1)

    for (let i = 0; i < missing.length; i++) {
        result[missing[i]] = filled[i]
    }

    return result as (GetBlock | undefined)[]
}
