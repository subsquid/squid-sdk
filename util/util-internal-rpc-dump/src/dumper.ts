import {createLogger, Logger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {assertNotNull, def, last, runProgram, Throttler} from '@subsquid/util-internal'
import {ArchiveLayout, getShortHash} from '@subsquid/util-internal-archive-layout'
import {FileOrUrl, nat, positiveInt, Url} from '@subsquid/util-internal-commander'
import {printTimeInterval, Progress} from '@subsquid/util-internal-counters'
import {createFs, Fs} from '@subsquid/util-internal-fs'
import {assertRange, printRange, Range, rangeEnd, RangeRequestList} from '@subsquid/util-internal-range'
import {Command} from 'commander'
import {PrometheusServer} from './prometheus'


export interface DataSource<B, R> {
    getFinalizedBlocks(requests: RangeRequestList<R>, stopOnHead?: boolean): AsyncIterable<{blocks: B[]}>
    getFinalizedHeight(): Promise<number>
}


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
}


export abstract class Dumper<B extends {hash: string, height: number}, R, O extends DumperOptions = DumperOptions> {
    abstract getDataSource(): DataSource<B, R>

    abstract getDataRequest(): R

    abstract getPrevBlockHash(block: B): string

    setUpProgram(program: Command): void {}

    process(batches: AsyncIterable<B[]>): AsyncIterable<{hash: string, height: number}[]> {
        return batches
    }

    @def
    program(): Command {
        let program = new Command()
        program.requiredOption('-e, --endpoint <url>', 'RPC endpoint', Url(['http:', 'https:', 'ws:', 'wss:']))
        program.option('-c, --endpoint-capacity <number>', 'Maximum number of pending RPC requests allowed', positiveInt, 10)
        program.option('-r, --endpoint-rate-limit <rps>', 'Maximum RPC rate in requests per second', nat)
        program.option('-b, --endpoint-max-batch-call-size <number>', 'Maximum size of RPC batch call', positiveInt)
        program.option('--dest <archive>', 'Either local dir or s3:// url where to store the dumped data', FileOrUrl(['s3:']))
        program.option('--first-block <number>', 'Height of the first block to dump', nat)
        program.option('--last-block <number>', 'Height of the last block to dump', nat)
        this.setUpProgram(program)
        program.option('--chunk-size <MB>', 'Data chunk size in megabytes', positiveInt, this.getDefaultChunkSize())
        program.option('--top-dir-size <number>', 'Number of items in a top level dir', positiveInt, this.getDefaultTopDirSize())
        program.option('--metrics <port>', 'Enable prometheus metrics server', nat)
        return program
    }

    getDefaultChunkSize(): number {
        return 64
    }

    getDefaultTopDirSize(): number {
        return 1024
    }

    @def
    options(): O {
        return this.program().parse().opts()
    }

    @def
    log(): Logger {
        return createLogger('sqd:dump')
    }

    @def
    range(): Range {
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
    destination(): Fs {
        let dest = assertNotNull(this.options().dest)
        return createFs(dest)
    }

    @def
    rpc(): RpcClient {
        let options = this.options()
        return new RpcClient({
            url: options.endpoint,
            capacity: options.endpointCapacity || 10,
            maxBatchCallSize: options.endpointMaxBatchCallSize,
            rateLimit: options.endpointRateLimit,
            retryAttempts: Number.MAX_SAFE_INTEGER
        })
    }

    @def
    prometheus() {
        let src = this.getDataSource()
        return new PrometheusServer(
            this.options().metrics ?? 0,
            () => src.getFinalizedHeight(),
            this.rpc(),
            this.log().child('prometheus')
        )
    }

    private async *ingest(from?: number, prevHash?: string): AsyncIterable<B[]> {
        let range = from == null ? this.range() : {
            from,
            to: this.range().to
        }
        assertRange(range)

        let height = new Throttler(() => this.getDataSource().getFinalizedHeight(), 60_000)
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

        let batchStream = this.getDataSource().getFinalizedBlocks([{
            range,
            request: this.getDataRequest()
        }])

        for await (let batch of batchStream) {
            if (batch.blocks[0].height === from && prevHash) {
                let parentHash = getShortHash(this.getPrevBlockHash(batch.blocks[0]))
                if (parentHash !== prevHash) {
                    throw new ErrorMessage(
                        `Block ${batch.blocks[0].height}#${getShortHash(batch.blocks[0].hash)} `  +
                        `is not a child of already archived block ${parentHash}`
                    )
                }
            }

            yield batch.blocks

            progress.setCurrentValue(last(batch.blocks).height)
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
                for await (let bb of this.process(this.ingest())) {
                    for (let block of bb) {
                        process.stdout.write(JSON.stringify(block) + '\n')
                    }
                    prometheus.setLastWrittenBlock(last(bb).height)
                }
            } else {
                let archive = new ArchiveLayout(this.destination(), {
                    topDirSize: this.options().topDirSize
                })
                await archive.appendRawBlocks({
                    blocks: (nextBlock, prevHash) => this.process(this.ingest(nextBlock, prevHash)),
                    range: this.range(),
                    chunkSize: chunkSize * 1024 * 1024,
                    onSuccessWrite: ctx => prometheus.setLastWrittenBlock(ctx.blockRange.to.height)
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
