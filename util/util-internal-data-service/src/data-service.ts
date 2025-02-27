import {createLogger} from '@subsquid/logger'
import {createFuture, Future, last, removeArrayItem, wait} from '@subsquid/util-internal'
import {BlockBatch, DataSource, isForkException} from '@subsquid/util-internal-data-source'
import assert from 'assert'
import {Chain} from './chain'
import {Block, BlockHeader, BlockRef, DataResponse, InvalidBaseBlock} from './types'
import {isChain} from './util'


interface BlockWaiter {
    number: number
    future: Future<void>
}


export class DataService {
    private listeners: BlockWaiter[] = []
    private stopped = false
    #chain?: Chain

    constructor(
        private source: DataSource<Block>,
        private bufferSize: number,
        readonly log = createLogger('sqd:data-service'),
        private responseLimit = 100
    ) {}

    private get chain(): Chain {
        assert(this.#chain, 'chain is not yet initialized')
        return this.#chain
    }

    getFinalizedHead(): BlockRef {
        return this.chain.getFinalizedHead()
    }

    getHead(): BlockRef {
        return this.chain.getHead()
    }

    async query(from: number, parentHash?: string): Promise<DataResponse | InvalidBaseBlock> {
        if (from <= this.chain.firstBlock().parentNumber) {
            return this.belowQuery(from, parentHash)
        } else {
            let res = this.chain.query(this.responseLimit, from, parentHash)
            if (res instanceof InvalidBaseBlock) return res
            if (res.tail) return res
            await this.waitForBlock(from)
            return this.chain.query(this.responseLimit, from, parentHash)
        }
    }

    private async belowQuery(from: number, parentHash?: string): Promise<DataResponse | InvalidBaseBlock> {
        let log = this.log
        let missing = this.chain.firstBlock().parentNumber - from + 1
        assert(missing > 0, 'no blocks are missing')

        log.info({
            fromBlock: from,
            missing
        }, 'below query')

        // read all necessary `this.chain` properties know for consistency
        let responseLimit = this.responseLimit
        let existing = Math.max(0, responseLimit - missing)
        let tail = this.chain.first(existing)
        let finalizedHead = this.chain.getFinalizedHead()

        // Now setup streaming of missing blocks
        let stream = this.source.getFinalizedStream({
            from,
            to: from + missing - 1,
            parentHash: parentHash
        })

        let it = stream[Symbol.asyncIterator]()

        let firstBatch: BlockBatch<Block>
        try {
            let item = await it.next()
            assert(!item.done, 'at least one block was expected')
            firstBatch = item.value
        } catch(err: any) {
            await it.return?.().catch(err => log.error(err))
            if (isForkException(err)) {
                return new InvalidBaseBlock(err.prev)
            } else {
                throw err
            }
        }

        async function* head(): AsyncIterable<Block> {
            let blocksServed = 0
            let prev: Block | undefined

            for (let block of firstBatch.blocks) {
                assertChainContinuity(parentHash, prev, block)
                yield block
                prev = block
                blocksServed += 1
            }

            try {
                while (blocksServed < responseLimit) {
                    let item = await it.next()
                    if (item.done) break
                    for (let block of item.value.blocks) {
                        assertChainContinuity(parentHash, prev, block)
                        yield block
                        prev = block
                        blocksServed += 1
                    }
                }
            } finally {
                await it.return?.().catch(err => log.error(err))
            }

            assert(prev, 'at least one block was expected')
            if (tail.length > 0) {
                assertChainContinuity(parentHash, prev, tail[0])
            }
        }

        return {
            finalizedHead,
            head: head(),
            tail
        }
    }

    async init(): Promise<void> {
        let head = await this.source.getFinalizedHead()

        for await (let batch of this.source.getFinalizedStream({
            from: head.number,
            to: head.number
        })) {
            assert(batch.blocks.length === 1)
            this.#chain = new Chain(batch.blocks[0], this.bufferSize)
            this.notifyListeners()
        }
    }

    async run(): Promise<void> {
        let base: BlockRef = this.chain.getHeader()
        let stacked = 0
        while (!this.stopped) {
            try {
                if (stacked > 1) {
                    await this.init()
                    base = this.chain.getHeader()
                    this.log.info(`restarted data ingestion at ${base.number}#${base.hash}`)
                }
                return await this.ingestSession(base)
            } catch(err: any) {
                if (isForkException(err)) {
                    stacked = 0
                    base = this.chain.getForkBase(err.prev)
                } else {
                    this.log.error(err, 'data ingestion terminated, will resume in 1 minute')
                    await wait(60 * 1000)
                    let head = this.chain.getHeader()
                    if (head.number === base.number) {
                        stacked += 1
                    } else {
                        stacked = 0
                    }
                    base = head
                }
            }
        }
    }

    stop(): void {
        this.stopped = true
    }

    private async ingestSession(base: BlockRef): Promise<void> {
        let finalizedHead: BlockRef | undefined

        for await (let batch of this.source.getStream({
            from: base.number + 1,
            parentHash: base.hash
        })) {
            if (this.stopped) return

            for (let block of batch.blocks) {
                this.chain.push(block)
            }

            if (batch.blocks.length > 0) {
                this.logBlockInfo(
                    this.chain.getHeader(),
                    'new head'
                )
            }

            finalizedHead = (finalizedHead?.number ?? 0) > (batch.finalizedHead?.number ?? 0)
                ? finalizedHead
                : batch.finalizedHead

            if (finalizedHead && this.chain.finalize(finalizedHead)) {
                this.logBlockInfo(
                    this.chain.getFinalizedHeader(),
                    'new finalized head'
                )
            }

            if (!this.chain.compact()) {
                this.log.error('block finalization lags behind and prevents cache purging')
            }

            this.notifyListeners()
        }
    }

    private logBlockInfo(block: BlockHeader, msg: string): void {
        this.log.info({
            blockNumber: block.number,
            blockHash: block.hash,
            blockAge: block.timestamp && Date.now() - block.timestamp,
        }, msg)
    }

    private waitForBlock(number: number): Promise<void> {
        let future = createFuture<void>()
        let listener = {number, future}
        this.listeners.push(listener)

        let timer: any = setTimeout(() => {
            removeArrayItem(this.listeners, listener)
            future.resolve()
            timer = undefined
        }, 5000)

        return future.promise().finally(() => {
            if (timer != null) {
                clearTimeout(timer)
            }
        })
    }

    private notifyListeners(): void {
        this.listeners.sort((a, b) => b.number - a.number)
        while (
            this.listeners.length > 0 &&
            last(this.listeners).number <= this.chain.lastBlockNumber()
        ) {
            let future = this.listeners.pop()!.future
            future.resolve()
        }
    }
}


function assertChainContinuity(parentHash: string | undefined, prev: Block | undefined, next: Block) {
    assert(
        prev && isChain(prev, next) || parentHash == null || parentHash === next.parentHash,
        'chain continuity was violated by the data source'
    )
}
