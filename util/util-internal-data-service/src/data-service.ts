import {createLogger} from '@subsquid/logger'
import {createFuture, Future, last, removeArrayItem} from '@subsquid/util-internal'
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
        private log = createLogger('sqd:data-service'),
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

    private async belowQuery(from: number, baseBlockHash?: string): Promise<DataResponse | InvalidBaseBlock> {
        let log = this.log
        let missing = this.chain.firstBlock().parentNumber - from + 1
        let existing = Math.max(0, this.responseLimit - missing)
        let tail = this.chain.first(existing)

        assert(missing > 0, 'no blocks are missing')

        let stream = this.source.getFinalizedStream({
            from,
            to: from + Math.min(missing, this.responseLimit),
            parentHash: baseBlockHash
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
            let prev: Block | undefined

            for (let block of firstBatch.blocks) {
                assertChainContinuity(baseBlockHash, prev, block)
                yield block
                prev = block
            }

            try {
                while (true) {
                    let item = await it.next()
                    if (item.done) break
                    for (let block of item.value.blocks) {
                        assertChainContinuity(baseBlockHash, prev, block)
                        yield block
                        prev = block
                    }
                }
            } finally {
                await it.return?.().catch(err => log.error(err))
            }

            assert(prev, 'at least one block was expected')
            if (tail.length > 0) {
                assertChainContinuity(baseBlockHash, prev, tail[0])
            }
        }

        return {
            finalizedHead: this.chain.getFinalizedHead(),
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
        }
    }

    async run(): Promise<void> {
        let base: BlockRef = this.chain.getHead()
        while (true) {
            let rollback = await this.ingestSession(base).catch(err => {
                if (isForkException(err)) {
                    return err
                } else {
                    throw err
                }
            })
            if (rollback == null) return
            base = this.chain.getForkBase(rollback.prev)
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
                    this.chain.getHead(),
                    'new head'
                )
            }

            finalizedHead = (finalizedHead?.number ?? 0) > (batch.finalizedHead?.number ?? 0)
                ? finalizedHead
                : batch.finalizedHead

            if (finalizedHead && this.chain.finalize(finalizedHead)) {
                this.logBlockInfo(
                    this.chain.getFinalizedHead(),
                    'new finalized head'
                )
            }

            if (!this.chain.compact()) {
                this.log.error('block finalization lags behind and prevents buffer compaction')
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
