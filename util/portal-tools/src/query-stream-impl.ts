import {ensureError, last, Semaphore, Timer, wait} from '@subsquid/util-internal'
import {
    DataValidationError,
    isValid,
    NAT,
    object,
    STRING,
    ValidationFailure,
    Validator
} from '@subsquid/util-internal-validation'
import assert from 'node:assert'
import {ForkException} from './fork-exception'
import {LineSplitter} from './line-splitter'
import type {PortalApi, PortalStreamHeaders} from './portal-api'
import type {BlockBase, BlockRef, DataBatch, QueryBase} from './types'


export interface StreamOptions {
    abortSignal?: AbortSignal
    highByteWaterMark?: number
    lowByteWaterMark?: number
    highItemWaterMark?: number
    lowItemWaterMark?: number
    queryStreamPauseThreshold?: number
    yieldPauseThreshold?: number
    retryAttempts?: number
    retrySchedule?: number[]
    onRetry?: (err: unknown, attempt: number, pause: number) => void
    onBatch?: (batch: DataBatch) => void
}


export function createQueryStream<B extends BlockBase>(
    api: PortalApi,
    query: QueryBase,
    blockSchema: Validator<B, any>,
    options: StreamOptions = {}
): AsyncIterable<DataBatch<B>>
{
    return new Processor(query, blockSchema, options).stream(proc => {
        return ingest(api, query, proc, options)
    })
}


async function ingest(
    api: PortalApi,
    query: QueryBase,
    processor: Processor<any>,
    options: StreamOptions
): Promise<void>
{
    query = {...query}

    let maxRetryAttempts = options.retryAttempts ?? 0
    let retrySchedule = options.retrySchedule ?? [10, 200, 500, 1000, 2000, 5000, 10000]
    let onRetry = options.onRetry
    let retryAttempt = 0
    let retryPause = 0

    while (processor.isRunning()) {
        if (retryPause) {
            let start = Date.now()
            await processor.drain()
            let pause = retryPause - (Date.now() - start)
            if (pause > 0) {
                await wait(pause, processor.abortSignal)
            }
        } else {
            await processor.drain()
        }

        query.fromBlock = processor.getLastBlockNumber() + 1
        query.parentBlockHash = processor.getLastBlockHash()
        try {
            let res = await api.stream(query, processor.abortSignal)
            switch(res.status) {
                case 200:
                    processor.startStream(res)
                    for await (let data of res.data) {
                        await processor.drain()
                        processor.writeStreamData(data)
                    }
                    processor.endStream()
                    break
                case 204:
                    processor.onHead(res)
                    break
                case 409:
                    processor.fork(res.previousBlocks)
                    break
            }
            retryAttempt = 0
            retryPause = 0
        } catch(err: any) {
            if (retryAttempt >= maxRetryAttempts) {
                throw err
            }
            if (api.isRetriableError?.(err)) {
                retryPause = api.getRetryPause?.(err) ?? retrySchedule[Math.max(retryAttempt, retrySchedule.length - 1)]
                retryAttempt += 1
                onRetry?.(err, retryAttempt, retryPause)
                processor.resetStream()
            } else {
                throw err
            }
        }
    }
}


type ProcessorState = 'idle' | 'streaming' | 'finished'


class Processor<B extends BlockBase> {
    private currentStream = 0
    private splitter = new LineSplitter(line => this.acceptNewLine(line))
    private blocks: B[] = []
    private byteSize = 0
    private itemSize = 0
    private batchStartStream?: number
    private batchEndStream?: number
    private batchStartTime = 0
    private batchEndTime?: number
    private batchFirstByteTime?: number
    private headNumber?: number
    private finalizedHeadNumber?: number
    private finalizedHeadHash?: string
    private highByteWaterMark: number
    private lowByteWaterMark: number
    private highItemWaterMark: number
    private lowItemWaterMark: number
    private onBatch?: (batch: DataBatch) => void
    private lastBlockNumber: number
    private lastBlockHash: string | undefined
    private streamStartBlock: number
    private fromBlock: number
    private fromParentBlockHash: string | undefined
    private toBlock: number | undefined
    private put = new Semaphore(true)
    private take = new Semaphore(false)
    private queryStreamPause?: Timer
    private yieldPause?: Timer
    private yieldTimedOut = false
    private abort = new AbortController()
    private externalAbort?: AbortSignal
    private state: ProcessorState = 'idle'
    private error?: Error
    private used = false

    constructor(query: QueryBase, private schema: Validator<B>, options: StreamOptions) {
        this.fromBlock = query.fromBlock
        this.fromParentBlockHash = query.parentBlockHash
        this.toBlock = query.toBlock
        this.lastBlockNumber = this.fromBlock - 1
        this.lastBlockHash = this.fromParentBlockHash
        this.streamStartBlock = this.lastBlockNumber

        this.highByteWaterMark = options.highByteWaterMark ?? 32 * 1024 * 1024
        this.lowByteWaterMark = options.lowByteWaterMark ?? 0
        this.highItemWaterMark = options.highItemWaterMark ?? Infinity
        this.lowItemWaterMark = options.lowItemWaterMark ?? 0
        this.onBatch = options.onBatch

        let streamPause = options.queryStreamPauseThreshold ?? 50
        if (streamPause) {
            this.queryStreamPause = new Timer(streamPause, () => this.onQueryStreamTimeout())
        }

        let yieldPause = options.yieldPauseThreshold ?? 20_000
        if (yieldPause) {
            this.yieldPause = new Timer(yieldPause, () => this.onYieldTimeout())
        }

        if (options.abortSignal) {
            this.externalAbort = options.abortSignal
            if (this.externalAbort.aborted) {
                this.onExternalAbort(null)
            } else {
                this.externalAbort.addEventListener('abort', this.onExternalAbort)
            }
        }
    }

    private onExternalAbort = (_e: unknown) => {
        this.finish(new Error('stream was aborted'))
    }

    private acceptNewLine(line: string): void {
        let rawBlock: unknown = JSON.parse(line)

        let block = this.schema.cast(rawBlock)
        if (block instanceof ValidationFailure) {
            let err: any = new DataValidationError(block.toString())
            if (isValid(BlockRefSchema, rawBlock)) {
                err.blockNumber = rawBlock.header.number
                err.blockHash = rawBlock.header.hash
            }
            throw err
        }

        assert(block.header.parentNumber == null || block.header.parentNumber < block.header.number)
        assert(block.header.number > this.lastBlockNumber)
        assert(this.toBlock == null || this.toBlock >= block.header.number)

        this.blocks.push(block)
        this.byteSize += line.length
        this.itemSize += getItemSize(block)
        this.lastBlockNumber = block.header.number
        this.batchEndStream = this.currentStream
        if (this.blocks.length == 1) {
            this.batchStartStream = this.currentStream
        }
    }

    isRunning(): boolean {
        return this.state !== 'finished'
    }

    get abortSignal(): AbortSignal {
        return this.abort.signal
    }

    getLastBlockNumber(): number {
        return this.lastBlockNumber
    }

    getLastBlockHash(): string | undefined {
        return this.lastBlockHash
    }

    drain(): Promise<void> | void {
        this.assertRunning()
        return this.put.wait()
    }

    startStream(headers: PortalStreamHeaders): void {
        this.assertState('idle')
        this.state = 'streaming'
        this.headNumber = headers.headNumber
        this.finalizedHeadNumber = headers.finalizedHeadNumber
        this.finalizedHeadHash = headers.finalizedHeadHash
        this.streamStartBlock = this.lastBlockNumber
        this.currentStream += 1
    }

    writeStreamData(data: Uint8Array): void {
        this.assertState('streaming')
        if (data.length == 0) return
        if (this.batchFirstByteTime == null) {
            this.batchFirstByteTime = Date.now()
        }
        this.queryStreamPause?.stop()
        this.take.unready()
        this.splitter.push(data)
        if (this.highWaterMarkExceeded()) {
            this.put.unready()
            this.finishCurrentBatch()
        } else if (this.shouldYield()) {
            this.queryStreamPause?.start()
        }
    }

    endStream(): void {
        this.assertState('streaming')
        this.state = 'idle'
        this.queryStreamPause?.stop()
        this.splitter.end()
        if (this.toBlock === this.lastBlockNumber) {
            this.finish()
        } else if (this.streamStartBlock === this.lastBlockNumber) {
            // Skipped Solana block range
            assert(this.toBlock != null)
            this.finish()
        } else if (this.highWaterMarkExceeded()) {
            this.put.unready()
            this.finishCurrentBatch()
        } else if (this.shouldYield()) {
            this.take.ready()
        }
    }

    resetStream(): void {
        this.assertRunning()
        this.state = 'idle'
        this.queryStreamPause?.stop()
        this.splitter.reset()
    }

    private finishCurrentBatch(): void {
        this.batchEndTime = Date.now()
        this.take.ready()
    }

    private shouldYield(): boolean {
        return this.yieldTimedOut && this.blocks.length > 0 || this.lowWaterMarkExceeded()
    }

    private onQueryStreamTimeout(): void {
        this.assertState('streaming')
        if (this.shouldYield()) {
            this.take.ready()
        }
    }

    private onYieldTimeout(): void {
        this.assertRunning()
        this.yieldTimedOut = true
        if (this.blocks.length > 0) {
            this.take.ready()
        }
    }

    onHead(res: PortalStreamHeaders): void {
        this.assertState('idle')
        this.currentStream += 1

        if (res.finalizedHeadNumber != null) {
            if (this.finalizedHeadNumber == null || this.finalizedHeadNumber < res.finalizedHeadNumber) {
                this.finalizedHeadNumber = res.finalizedHeadNumber
                this.finalizedHeadHash = res.finalizedHeadHash
                this.take.ready()
            }
        }

        if (res.headNumber != null) {
            if (this.headNumber == null || this.headNumber < res.headNumber) {
                this.headNumber = res.headNumber
                this.take.ready()
            }
        }

        if (this.blocks.length > 0) {
            this.take.ready()
        }
    }

    fork(prev: BlockRef[]): void {
        this.assertState('idle')
        this.currentStream += 1

        assert(
            this.lastBlockHash != null,
            'portal protocol: got base block conflict while no parent hash was provided'
        )

        assert(prev.length > 0, 'portal protocol: no previous blocks where provided')

        for (let i = 1; i < prev.length; i++) {
            assert(
                prev[i-1].number < prev[i].number,
                'portal protocol: list of previous blocks does not have ascending order'
            )
        }

        assert(
            last(prev).number <= this.lastBlockNumber,
            'portal protocol: some of the previous blocks lie above the requested base'
        )

        let hadBlocks = this.blocks.length > 0

        while (this.blocks.length > 0 && prev.length > 0) {
            let p = last(prev)
            if (p.number > this.lastBlockNumber) {
                prev.pop()
                continue
            }
            if (p.number === this.lastBlockNumber && p.hash === this.lastBlockHash) {
                return
            }
            this.popLastBlock()
        }

        while (prev.length > 0 && last(prev).number > this.lastBlockNumber) {
            prev.pop()
        }

        if (prev.length == 0 || this.lastBlockHash == null) return

        // This condition accounts for possibility of gaps in the list of previous blocks
        if (hadBlocks && last(prev).number < this.lastBlockNumber) return

        this.finish(new ForkException(
            this.lastBlockNumber + 1,
            this.lastBlockHash!,
            prev
        ))
    }

    private popLastBlock(): void {
        assert(this.blocks.length > 0)
        let block = this.blocks.pop()!.header
        if (block.parentNumber == null) {
            this.lastBlockNumber = block.number - 1
        } else {
            this.lastBlockNumber = block.parentNumber
        }
        this.lastBlockHash = block.parentHash
        if (this.lastBlockNumber < this.fromBlock) {
            this.lastBlockNumber = this.fromBlock - 1
            this.lastBlockHash = this.fromParentBlockHash
        }
    }

    private assertRunning(): void {
        if (this.state == 'finished') throw new Error('data stream was already terminated')
    }

    private assertState(state: ProcessorState): void {
        assert.strictEqual(this.state, state)
    }

    private highWaterMarkExceeded(): boolean {
        return this.byteSize >= this.highByteWaterMark || this.itemSize >= this.highItemWaterMark
    }

    private lowWaterMarkExceeded(): boolean {
        return this.byteSize > this.lowByteWaterMark && this.itemSize > this.lowItemWaterMark
    }

    private finish(err?: Error): void {
        if (this.state == 'finished') return
        this.state = 'finished'
        this.error = err
        this.finishCurrentBatch()
        this.cleanup()
    }

    private cleanup(): void {
        this.queryStreamPause?.stop()
        this.yieldPause?.stop()
        this.externalAbort?.removeEventListener('abort', this.onExternalAbort)
        this.abort.abort()
    }

    async *stream(run: (proc: this) => Promise<void>): AsyncIterable<DataBatch<B>> {
        assert(!this.used)
        this.used = true
        this.batchStartTime = Date.now()
        try {
            run(this)
                .then(() => this.assertState('finished'))
                .catch(err => this.finish(ensureError(err)))

            this.yieldPause?.start()
            while (true) {
                await this.take.wait()
                if (this.state == 'finished') break
                this.take.unready()
                this.put.ready()
                this.yieldPause?.reset()
                this.yieldTimedOut = false
                yield this.takeBatch()
            }
            if (this.blocks.length > 0) {
                // We'll maintain "No more blocks after abort" invariant
                if (this.externalAbort?.aborted) {
                    // We prevented validly ingested blocks from being yielded
                    // Hence, no matter what the state of this.error is,
                    // 'stream was aborted' is logically the most right thing to throw
                    throw new Error('stream was aborted')
                } else {
                    yield this.takeBatch()
                }
            }
            if (this.error) {
                throw this.error
            }
        } finally {
            this.cleanup()
        }
    }

    private takeBatch(): DataBatch<B> {
        let now = Date.now()
        let endTime = this.batchEndTime ?? now

        let batch: DataBatch<B> = {
            blocks: this.blocks,
            byteSize: this.byteSize,
            itemSize: this.itemSize,
            startStream: this.batchStartStream ?? this.currentStream,
            endStream: this.batchEndStream ?? this.currentStream,
            startTime: this.batchStartTime,
            endTime,
            firstByteTime: this.batchFirstByteTime ?? endTime
        }

        if (this.headNumber != null) {
            batch.headNumber = this.headNumber
        }

        if (this.finalizedHeadNumber != null) {
            batch.finalizedHeadNumber = this.finalizedHeadNumber
        }

        if (this.finalizedHeadHash != null) {
            batch.finalizedHeadHash = this.finalizedHeadHash
        }

        this.onBatch?.(batch)

        // reset batch state
        this.blocks = []
        this.byteSize = 0
        this.itemSize = 0
        this.batchStartTime = now
        this.batchFirstByteTime = undefined
        this.batchEndTime = undefined
        this.batchStartStream = undefined
        this.batchEndStream = undefined
        return batch
    }
}


const BlockRefSchema = object({
    header: object({
        number: NAT,
        hash: STRING
    })
})


function getItemSize(block: any): number {
    let size = 1
    for (let key in block) {
        let val = block[key]
        if (Array.isArray(val)) {
            size += val.length
        }
    }
    return size
}
