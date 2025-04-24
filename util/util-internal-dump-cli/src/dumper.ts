import {createLogger, Logger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {assertNotNull, def, last, runProgram, Throttler, waitDrain} from '@subsquid/util-internal'
import {ArchiveLayout, getShortHash} from '@subsquid/util-internal-archive-layout'
import {FileOrUrl, nat, positiveInt, positiveReal, Url} from '@subsquid/util-internal-commander'
import {printTimeInterval, Progress} from '@subsquid/util-internal-counters'
import {createFs, Fs} from '@subsquid/util-internal-fs'
import {assertRange, printRange, Range, rangeEnd} from '@subsquid/util-internal-range'
import {Command} from 'commander'
import {PrometheusServer} from './prometheus'
import {EventEmitter} from 'events'


export interface DumperOptions {
    endpoint: string
    endpointCapacity?: number
    endpointRateLimit?: number
    endpointMaxBatchCallSize?: number
    dest?: string
    firstBlock?: number
    lastBlock?: number
    chunkSize: number
    writeBatchSize: number
    topDirSize: number
    metrics?: number
    maxCacheSize?: number
}


export abstract class Dumper<B extends {hash: string, height: number}, O extends DumperOptions = DumperOptions> {
    
    private blockCache = new Map<number, B>();
    
    private addToCache(block: B): void {
        const maxCacheSize = this.options().maxCacheSize ?? this.getDefaultCacheSize();
        if (this.blockCache.size >= maxCacheSize) {
            const heights = Array.from(this.blockCache.keys()).sort((a, b) => a - b);
            const removeCount = Math.ceil(maxCacheSize * 0.2);
            const keysToRemove = heights.slice(0, removeCount);
            for (const key of keysToRemove) {
                this.blockCache.delete(key);
            }
            this.log().debug(`Cache cleanup: removed ${keysToRemove.length} oldest blocks`);
        }
        
        this.blockCache.set(block.height, block);
    }
    
    protected abstract getBlocks(range: Range): AsyncIterable<B[]>

    protected abstract getFinalizedHeight(): Promise<number>

    protected abstract getPrevBlockHash(block: B): string

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
        program.option('--first-block <number>', 'Height of the first block to dump', nat)
        program.option('--last-block <number>', 'Height of the last block to dump', nat)
        this.setUpProgram(program)
        program.option('--chunk-size <MB>', 'Data chunk size in megabytes', positiveInt, this.getDefaultChunkSize())
        program.option('--write-batch-size <number>', 'Number of blocks to write at a time', positiveInt, 10)
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
            () => this.getFinalizedHeight(),
            this.rpc(),
            this.log().child('prometheus')
        )
        this.eventEmitter().on('S3FsOperation', (op: string) => server.incS3Requests(op))
        return server
    }

    private async *ingest(from?: number, prevHash?: string): AsyncIterable<B[]> {
        let range = from == null ? this.range() : {
            from,
            to: this.range().to
        }
        assertRange(range)

        let height = new Throttler(() => this.getFinalizedHeight(), 60_000)
        let chainHeight = await height.get()

        let progress = new Progress({
            initialValue: this.range().from,
            targetValue: Math.min(chainHeight, rangeEnd(range)),
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
            if (this.validateChainContinuity()) {
                if (blocks[0].height === from && prevHash) {
                    let parentHash = getShortHash(this.getPrevBlockHash(blocks[0]))
                    if (parentHash !== prevHash) {
                        let fallbackHash = getShortHashFallback(this.getPrevBlockHash(blocks[0]))
                        if (fallbackHash !== prevHash) {
                            throw new ErrorMessage(
                                `Block ${blocks[0].height}#${getShortHash(blocks[0].hash)} `  +
                                `is not a child of already archived block ${parentHash}`
                            )
                        }
                    }
                }
            }

            const lastBlock = last(blocks)
            const mintedTimestamp = this.getBlockTimestamp(lastBlock)
            
            for (const block of blocks) {
                this.addToCache(block);
            }
            
            this.prometheus().setLatestBlockMetrics(lastBlock.height, mintedTimestamp)
            this.log().debug(`Received block ${lastBlock.height} with minted timestamp ${mintedTimestamp}`)
            this.log().debug(`Cache size: ${this.blockCache.size}`)

            yield blocks

            progress.setCurrentValue(last(blocks).height)
            if (chainHeight < rangeEnd(range)) {
                chainHeight = Math.min(await height.get(), rangeEnd(range))
                progress.setTargetValue(chainHeight)
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
                    const lastBlockHeight = last(bb).height;
                    prometheus.setLastWrittenBlock(lastBlockHeight);
                    const processedTimestamp = this.getBlockTimestamp(last(bb));
                    const processingTime = Math.floor(Date.now() / 1000) - processedTimestamp;
                    prometheus.setProcessedBlockMetrics(processedTimestamp, processingTime);
                    this.log().debug(`Processed block ${lastBlockHeight} at ${processedTimestamp} with processing time ${processingTime}`);
                }
            } else {
                let archive = new ArchiveLayout(this.destination(), {
                    topDirSize: this.options().topDirSize
                })
                await archive.appendRawBlocks({
                    blocks: (nextBlock, prevHash) => this.ingest(nextBlock, prevHash),
                    range: this.range(),
                    chunkSize: chunkSize * 1024 * 1024,
                    writeBatchSize: this.options().writeBatchSize,
                    onSuccessWrite: ctx => {
                        const blockHeight = ctx.blockRange.to.height;
                        prometheus.setLastWrittenBlock(blockHeight);
                        
                        const cachedBlock = this.blockCache.get(blockHeight);
                        if (cachedBlock) {
                            const processedTimestamp = this.getBlockTimestamp(cachedBlock);
                            const processingTime = Math.floor(Date.now() / 1000) - processedTimestamp;
                            prometheus.setProcessedBlockMetrics(processedTimestamp, processingTime);
                            this.log().debug(`Processed block ${blockHeight} at ${processedTimestamp} with processing time ${processingTime}`);
                        } else {
                            this.log().warn(`No cached block available for height ${blockHeight}`);
                        }
                    }
                })
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


function getShortHashFallback(hash: string) {
    if (hash.startsWith('0x')) {
        return hash.slice(2, 8)
    } else {
        return hash.slice(0, 5)
    }
}
