import {concurrentMap, last, wait} from '@subsquid/util-internal'
import {RangeRequest, splitRange, SplitRequest} from '@subsquid/util-internal-range'
import assert from 'assert'
import {HashAndHeight, HotDatabaseState} from './database'
import {Batch, Block, BlockHeader, HotUpdate} from './datasource'


export interface HeightTracker {
    getHeight(): Promise<number>
    getLastHeight(): number
    wait(height: number): Promise<number>
}


export class PollingHeightTracker implements HeightTracker {
    private lastAccess = 0
    private lastHeight = 0

    constructor(
        private height: () => Promise<number>,
        public readonly pollInterval: number
    ) {
    }

    async getHeight(): Promise<number> {
        let height = await this.height()
        this.lastAccess = Date.now()
        this.lastHeight = height
        return height
    }

    getLastHeight(): number {
        return this.lastHeight
    }

    async wait(height: number): Promise<number> {
        let current = this.lastHeight
        while (current < height) {
            let pause = this.pollInterval - Math.min(Date.now() - this.lastAccess, this.pollInterval)
            if (pause) {
                await wait(pause)
            }
            current = await this.getHeight()
        }
        return current
    }
}


export async function* getHeightUpdates(heightTracker: HeightTracker, from: number): AsyncIterable<number> {
    while (true) {
        yield from = await heightTracker.wait(from)
        from += 1
    }
}


export async function* generateSplitRequests<R>(
    args: {
        requests: RangeRequest<R>[]
        heightTracker: HeightTracker
        stopOnHead?: boolean
    }
): AsyncIterable<SplitRequest<R>> {
    let top = args.heightTracker.getLastHeight()
    for (let req of args.requests) {
        let from = req.range.from
        let end = req.range.to ?? Infinity
        while (from <= end) {
            if (top < from) {
                top = await args.heightTracker.getHeight()
                if (top < from) {
                    if (args.stopOnHead) return
                    top = await args.heightTracker.wait(from)
                }
            }
            let to = Math.min(end, top)
            yield {
                range: {from, to},
                request: req.request
            }
            from = to + 1
        }
    }
}


export async function* generateFetchStrides<R>(
    args: {
        requests: RangeRequest<R>[]
        heightTracker: HeightTracker
        strideSize?: number
        stopOnHead?: boolean
    }
): AsyncIterable<SplitRequest<R>> {
    let {strideSize = 10, ...params} = args
    for await (let s of generateSplitRequests(params)) {
        for (let range of splitRange(strideSize, s.range)) {
            yield {
                range,
                request: s.request
            }
        }
    }
}


export function archiveIngest<R, B extends Block>(
    args: {
        requests: RangeRequest<R>[]
        heightTracker: HeightTracker
        query: (s: SplitRequest<R>) => Promise<B[]>
        stopOnHead?: boolean
    }
): AsyncIterable<Batch<B>> {
    let {query, ...params} = args

    async function* ingest(): AsyncIterable<Batch<B>> {
        for await (let s of generateSplitRequests(params)) {
            let from = s.range.from
            let to = s.range.to
            while (from <= to) {
                let blocks = await query({
                    range: {from, to},
                    request: s.request
                })
                assert(blocks.length > 0, 'boundary blocks are expected to be included')
                let top = last(blocks).header.height
                yield {blocks, isHead: top >= args.heightTracker.getLastHeight()}
                from = top + 1
            }
        }
    }

    return concurrentMap(
        2,
        ingest(),
        b => Promise.resolve(b)
    )
}


export interface ChainHeads {
    best?: HashAndHeight | number | string
    finalized?: HashAndHeight | number | string
}


export class ForkNavigator<B> {
    private chain: HashAndHeight[]

    constructor(
        state: HotDatabaseState,
        private getBlock: (ref: Partial<HashAndHeight>) => Promise<B>,
        private getHeader: (block: B) => BlockHeader
    ) {
        this.chain = [state, ...state.top]
        this.assertInvariants()
    }

    private assertInvariants(): void {
        for (let i = 1; i < this.chain.length; i++) {
            assert(this.chain[i].height == this.chain[i-1].height + 1)
        }
    }

    getHeight(): number {
        return last(this.chain).height
    }

    async move(heads: ChainHeads): Promise<HotUpdate<B>> {
        let chain = this.chain.slice()
        let newBlocks: B[] = []
        let bestHead: HashAndHeight | undefined

        if (typeof heads.best == 'number') {
            if (heads.best > last(chain).height) {
                let newBlock = await this.getBlock({height: heads.best})
                newBlocks.push(newBlock)
                bestHead = getParent(this.getHeader(newBlock))
            }
        } else if (typeof heads.best == 'string') {
            bestHead = chain.find(ref => ref.hash === heads.best)
            bestHead = bestHead || await this.getBlock({hash: heads.best}).then(b => this.getHeader(b))
        } else {
            bestHead = heads.best
        }

        if (bestHead) {
            assert(bestHead.height >= chain[0].height)

            if (last(chain).height > bestHead.height) {
                let bestPos = bestHead.height - chain[0].height
                if (chain[bestPos].hash === bestHead.hash) {
                    // no fork
                } else {
                    // we have a proper fork
                    chain = chain.slice(0, bestPos)
                }
            }

            while (last(chain).height < bestHead.height) {
                let block = await this.getBlock(bestHead)
                newBlocks.push(block)
                bestHead = getParent(this.getHeader(block))
            }

            while (last(chain).hash !== bestHead.hash) {
                let block = await this.getBlock(bestHead)
                newBlocks.push(block)
                bestHead = getParent(this.getHeader(block))
                chain.pop()
            }
        }

        newBlocks = newBlocks.reverse()
        for (let block of newBlocks) {
            chain.push(this.getHeader(block))
        }

        let finalizedHead: HashAndHeight | undefined
        if (typeof heads.finalized == 'number') {
            assert(heads.finalized <= last(chain).height)
            if (heads.finalized > chain[0].height) {
                finalizedHead = chain[heads.finalized - chain[0].height]
                assert(finalizedHead.height == heads.finalized)
            }
        } else if (typeof heads.finalized == 'string') {
            finalizedHead = chain.find(ref => ref.hash === heads.finalized)
            finalizedHead = finalizedHead || await this.getBlock({hash: heads.finalized}).then(b => this.getHeader(b))
        } else {
            finalizedHead = heads.finalized
        }

        if (finalizedHead && finalizedHead.height >= chain[0].height) {
            assert(finalizedHead.height <= last(chain).height)
            let finalizedHeadPos = finalizedHead.height - chain[0].height
            assert(chain[finalizedHeadPos].hash === finalizedHead.hash)
            chain = chain.slice(finalizedHeadPos)
        }

        // don't change the state until no error is guaranteed to occur
        this.chain = chain

        return {
            blocks: newBlocks,
            baseHead: newBlocks.length ? getParent(this.getHeader(newBlocks[0])) : last(this.chain),
            finalizedHead: this.chain[0]
        }
    }

    async transact<R>(cb: () => Promise<R>): Promise<R> {
        let chain = this.chain
        try {
            return await cb()
        } catch(err: any) {
            this.chain = chain
            throw err
        }
    }
}


function getParent(hdr: BlockHeader): HashAndHeight {
    return {
        hash: hdr.parentHash,
        height: hdr.height - 1
    }
}


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

    async processBlocks<I, O>(
        blocks: I[],
        getBlockHeight: (b: I) => number,
        process: (blocks: I[], req?: R) => Promise<O[]>
    ): Promise<O[]> {
        let result: O[] = []
        for (let pack of this.splitBlocksByRequest(blocks, getBlockHeight)) {
            result.push(...await process(pack.blocks, pack.request))
        }
        return result
    }
}
