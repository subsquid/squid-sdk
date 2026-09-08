import {createLogger, Logger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {assertNotNull, def, last, runProgram, Throttler, wait, waitDrain} from '@subsquid/util-internal'
import {
    ArchiveLayout,
    checkShorHashMatch,
    getBlockNumber,
    getParentBlockNumber,
    RawBlock
} from '@subsquid/util-internal-archive-layout'
import {FileOrUrl, nat, positiveInt, positiveReal, Url} from '@subsquid/util-internal-commander'
import {printTimeInterval, Progress} from '@subsquid/util-internal-counters'
import {createFs, Fs} from '@subsquid/util-internal-fs'
import {assertRange, printRange, Range, rangeEnd} from '@subsquid/util-internal-range'
import {Command} from 'commander'
import {EventEmitter} from 'events'
import {PrometheusServer} from './prometheus'


export interface DumperOptions {
    endpoint: string
    endpointCapacity?: number
    endpointRateLimit?: number
    endpointMaxBatchCallSize?: number
    dest?: string
    firstBlock?: number
    lastBlock?: number
    chunkSize: number
    topDirSize: number
    metrics?: number
    maxCacheSize?: number
}


export abstract class Dumper<B extends RawBlock, O extends DumperOptions = DumperOptions> {
    
    private timestampCache = new Map<number, number>();

    private addToCache(block: B): void {
        const maxCacheSize = this.options().maxCacheSize ?? this.getDefaultCacheSize();
        if (this.timestampCache.size >= maxCacheSize) {
            const heights = Array.from(this.timestampCache.keys()).sort((a, b) => a - b);
            const removeCount = Math.ceil(maxCacheSize * 0.2);
            const keysToRemove = heights.slice(0, removeCount);
            for (const key of keysToRemove) {
                this.timestampCache.delete(key);
            }
            this.log().debug(`Cache cleanup: removed ${keysToRemove.length} oldest block timestamps`);
        }

        const blockHeight = getBlockNumber(block);
        this.timestampCache.set(blockHeight, this.getBlockTimestamp(block));
    }

    protected abstract getBlocks(range: Range): AsyncIterable<B[]>

    protected abstract getLastFinalizedBlockNumber(): Promise<number>

    protected abstract getParentBlockHash(block: B): string
    protected abstract getBlockTimestamp(block: B): number

    protected abstract getBlockTimestamp(block: B): number

    protected setUpProgram(program: Command): void {}

    protected getDefaultChunkSize(): number {
        return 64
    }

    protected getDefaultTopDirSize(): number {
        return 1024
    }

    protected getDefaultCacheSize(): number {
        return 10
    }

    protected getLoggingNamespace(): string {
        return 'sqd:dump'
    }

    @def
    protected program(): Command {
        let program = new Command()
        program.requiredOption('-e, --endpoint <url>', 'RPC endpoint', Url(['http:', 'https:', 'ws:', 'wss:']))
        program.option('-c, --endpoint-capacity <number>', 'Maximum number of pending RPC requests allowed', positiveInt, 10)
        program.option('-r, --endpoint-rate-limit <rps>', 'Maximum RPC rate in requests per second', positiveReal)
        program.option('-b, --endpoint-max-batch-call-size <number>', 'Maximum size of RPC batch call', positiveInt)
        program.option('--dest <archive>', 'Either local dir or s3:// url where to store the dumped data', FileOrUrl(['s3:']))
        program.option('--first-block <number>', 'First block to dump', nat)
        program.option('--last-block <number>', 'Last block to dump', nat)
        this.setUpProgram(program)
        program.option('--chunk-size <MB>', 'Data chunk size in megabytes', positiveInt, this.getDefaultChunkSize())
        program.option('--top-dir-size <number>', 'Number of items in a top level dir', positiveInt, this.getDefaultTopDirSize())
        program.option('--max-cache-size <number>', 'Maximum number of blocks to keep in memory cache', positiveInt, this.getDefaultCacheSize())
        program.option('--metrics <port>', 'Enable prometheus metrics server', nat)
        return program
    }

    @def
    protected options(): O {
        return this.program().parse().opts()
    }

    @def
    protected log(): Logger {
        return createLogger(this.getLoggingNamespace())
    }

    @def
    private range(): Range {
        let options = this.options()
        let range: Range = {from: 0}
        if (options.firstBlock) {
            range.from = options.firstBlock
        }
        if (options.lastBlock != null) {
            range.to = options.lastBlock
            if (range.from > range.to) {
                throw new ErrorMessage(`invalid requested block range ${printRange(range)} : first-block > last-block`)
            }
        }
        return range
    }

    @def
    protected destination(): Fs {
        let dest = assertNotNull(this.options().dest)
        return createFs(dest, this.eventEmitter())
    }

    @def
    protected rpc(): RpcClient {
        let options = this.options()
        return new RpcClient({
            url: options.endpoint,
            capacity: options.endpointCapacity || 10,
            maxBatchCallSize: options.endpointMaxBatchCallSize,
            rateLimit: options.endpointRateLimit,
            requestTimeout: 180_000,
            retryAttempts: Number.MAX_SAFE_INTEGER,
            fixUnsafeIntegers: this.fixUnsafeIntegers()
        })
    }

    protected fixUnsafeIntegers(): boolean {
        return false
    }

    protected validateChainContinuity(): boolean {
        return true
    }

    @def
    protected eventEmitter(): EventEmitter {
        return new EventEmitter()
    }

    @def
    protected prometheus() {
        let server = new PrometheusServer(
            this.options().metrics ?? 0,
            () => this.getLastFinalizedBlockNumber(),
            this.rpc(),
            this.log().child('prometheus')
        )
        this.eventEmitter().on('S3FsOperation', (op: string) => server.incS3Requests(op))
        return server
    }

    private async *ingest(from?: number, prevShortHash?: string): AsyncIterable<B[]> {
        let range = from == null ? this.range() : {
            from,
            to: this.range().to
        }
        assertRange(range)

        let head = new Throttler(() => this.getLastFinalizedBlockNumber(), 60_000)
        let headNumber = await head.get()

        let progress = new Progress({
            initialValue: this.range().from,
            targetValue: Math.min(headNumber, rangeEnd(range)),
            currentValue: range.from
        })

        let status = new Throttler(async () => {
            this.log().info(
                `last block: ${progress.getCurrentValue()}, ` +
                `rate: ${Math.round(progress.speed())} blocks/sec, ` +
                `eta: ${printTimeInterval(progress.eta())}`
            )
        }, 5000)

        for await (let blocks of this.getBlocks(range)) {
            if (from && prevShortHash != null && this.validateChainContinuity()) {
                let fst = blocks[0]
                if (
                    from === getParentBlockNumber(fst) + 1 &&
                    checkShorHashMatch(this.getParentBlockHash(fst), prevShortHash)
                ) {} else {
                    throw new ErrorMessage(
                        `Block ${getBlockNumber(fst)}#${fst.hash} `  +
                        `is not a child of already archived block ${prevShortHash}`
                    )
                }
            }

            const lastBlock = last(blocks)
            const mintedTimestamp = this.getBlockTimestamp(lastBlock)

            for (const block of blocks) {
                this.addToCache(block);
            }

            this.prometheus().setLatestBlockMetrics(getBlockNumber(lastBlock), mintedTimestamp)
            this.log().debug(`Received block ${getBlockNumber(lastBlock)} with minted timestamp ${mintedTimestamp}`)
            this.log().debug(`Cache size: ${this.timestampCache.size}`)

            yield blocks

            {
                let lst = last(blocks)
                from = getBlockNumber(lst) + 1
                prevShortHash = lst.hash
            }

            progress.setCurrentValue(getBlockNumber(last(blocks)))
            if (headNumber < rangeEnd(range)) {
                headNumber = Math.min(await head.get(), rangeEnd(range))
                progress.setTargetValue(headNumber)
            } else {
                progress.setTargetValue(rangeEnd(range))
            }

            await status.get()
        }
    }

    run(): void {
        runProgram(async () => {
            let {dest, chunkSize, metrics} = this.options()
            let prometheus = this.prometheus()

            if (metrics != null) {
                let server = await prometheus.serve()
                this.log().info(`prometheus metrics are available on port ${server.port}`)
            }

            if (dest == null) {
                for await (let bb of this.ingest()) {
                    await waitDrain(process.stdout)
                    for (let block of bb) {
                        process.stdout.write(JSON.stringify(block) + '\n')
                    }
                    const lastBlockHeight = getBlockNumber(last(bb));
                    prometheus.setLastWrittenBlock(lastBlockHeight);
                    const processedTimestamp = this.getBlockTimestamp(last(bb));
                    prometheus.setProcessedBlockMetrics(processedTimestamp);
                    this.log().debug(`Processed block ${lastBlockHeight} at ${processedTimestamp}`);
                }
            } else {
                let archive = new ArchiveLayout(this.destination(), {
                    topDirSize: this.options().topDirSize
                })

                // The finalized dump stream can throw a ForkException when the
                // upstream RPC serves inconsistent finalized data (e.g. a
                // load-balanced provider whose backend jumped to a recent
                // snapshot and now reports a gapped/forked view of an already
                // finalized slot range). Finalized blocks are immutable, so
                // this is never a real reorg — it's transient provider noise.
                // appendRawBlocks only persists complete chunks, so the
                // in-flight (unflushed) buffer is discarded on throw and the
                // resume point is re-derived from the last persisted chunk on
                // the next call: identical to a process restart, but without
                // crash-looping the dumper. We only give up (re-throw) when
                // retries stop making progress, so a genuine, persistent
                // archive/chain divergence still surfaces as a hard failure.
                let lastWrittenBlock = -1
                await appendWithForkRecovery(
                    () => archive.appendRawBlocks({
                        blocks: (nextBlock, prevHash) => this.ingest(nextBlock, prevHash),
                        range: this.range(),
                        chunkSize: chunkSize * 1024 * 1024,
                        onSuccessWrite: ctx => {
                            const blockHeight = ctx.blockRange.to.number;
                            lastWrittenBlock = blockHeight;
                            prometheus.setLastWrittenBlock(blockHeight);

                            const cachedTimestamp = this.timestampCache.get(blockHeight);
                            if (cachedTimestamp) {
                                prometheus.setProcessedBlockMetrics(cachedTimestamp);
                                this.log().debug(`Processed block ${blockHeight} at ${cachedTimestamp}`);
                            } else {
                                this.log().warn(`No cached timestamp available for height ${blockHeight}`);
                            }
                        }
                    }),
                    () => lastWrittenBlock,
                    async ({message, lastWrittenBlock, stuckRetries}) => {
                        this.log().warn(
                            {reason: message, lastWrittenBlock, attempt: stuckRetries},
                            'finalized dump stream hit a chain-continuity error. Finalized data ' +
                            'is immutable, so this is transient upstream/provider inconsistency ' +
                            'rather than a real reorg. Discarding the in-flight buffer and ' +
                            'retrying from the last persisted chunk.'
                        )
                        await wait(Math.min(30_000, 1000 * 2 ** stuckRetries))
                    }
                )
            }
        }, err => {
            if (err instanceof ErrorMessage) {
                this.log().fatal(err.message)
            } else {
                this.log().fatal(err)
            }
        })
    }
}


export class ErrorMessage extends Error {
    constructor(msg: string) {
        super(msg)
    }
}


/**
 * A ForkException raised by a data source (it carries the `isSqdForkException`
 * marker). Detected structurally so this package doesn't need to depend on the
 * data-source package that defines the class.
 */
export function isForkException(err: unknown): boolean {
    return err instanceof Error && (err as {isSqdForkException?: boolean}).isSqdForkException === true
}


/**
 * Run `append` (a finalized archive append loop), recovering from transient
 * ForkExceptions instead of crashing.
 *
 * On a ForkException the in-flight, not-yet-persisted buffer is dropped and
 * `append` is invoked again — it re-derives its resume point from the last
 * persisted chunk, so retrying is equivalent to a clean process restart.
 *
 * Recovery is bounded by progress, not a fixed attempt count: as long as a
 * retry manages to persist a higher block than before, the counter resets.
 * Only when `maxStuckRetries` consecutive retries fail to advance the last
 * written block do we re-throw — that signals a genuine, persistent divergence
 * (not transient provider noise) which must surface as a hard failure rather
 * than be silently retried forever.
 */
export async function appendWithForkRecovery(
    append: () => Promise<void>,
    getLastWrittenBlock: () => number,
    onForkRetry: (info: {message: string; lastWrittenBlock: number; stuckRetries: number}) => Promise<void>,
    maxStuckRetries = 10,
): Promise<void> {
    let lastProgress = -1
    let stuckRetries = 0
    while (true) {
        try {
            return await append()
        } catch (err: unknown) {
            if (!isForkException(err)) throw err
            let lastWrittenBlock = getLastWrittenBlock()
            if (lastWrittenBlock > lastProgress) {
                stuckRetries = 0
            } else {
                stuckRetries += 1
            }
            lastProgress = lastWrittenBlock
            if (stuckRetries > maxStuckRetries) throw err
            await onForkRetry({message: (err as Error).message, lastWrittenBlock, stuckRetries})
        }
    }
}
