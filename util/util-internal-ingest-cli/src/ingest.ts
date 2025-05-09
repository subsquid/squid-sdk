import {createLogger, Logger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {assertNotNull, def, runProgram, waitDrain} from '@subsquid/util-internal'
import {ArchiveLayout} from '@subsquid/util-internal-archive-layout'
import {FileOrUrl, nat, positiveInt, Url} from '@subsquid/util-internal-commander'
import {createFs} from '@subsquid/util-internal-fs'
import {HttpApp, HttpContext, HttpError, waitForInterruption} from '@subsquid/util-internal-http-server'
import {assertRange, isRange, Range} from '@subsquid/util-internal-range'
import {Command} from 'commander'
import {Writable} from 'stream'
import {PrometheusServer} from './prometheus'
import {EventEmitter} from 'events'


export interface IngestOptions {
    rawArchive?: string
    firstBlock: number
    lastBlock?: number
    service?: number
    endpoint?: string
    endpointCapacity?: number
    endpointRateLimit?: number
    endpointMaxBatchCallSize?: number
    metrics?: number
}


export class Ingest<O extends IngestOptions = IngestOptions> {
    protected hasRpc(): 'required' | boolean {
        return true
    }

    protected setUpProgram(program: Command): void {}

    protected getBlocks(range: Range): AsyncIterable<object[]> {
        return this.archive().getRawBlocks(range)
    }

    protected getLoggingNamespace(): string {
        return 'sqd:ingest'
    }

    protected isRetryableError(err: Error): boolean {
        return !!this.options().endpoint && this.rpc().isConnectionError(err)
    }

    protected getBlockTimestamp(block: any): number {
        return 0
    }

    protected getBlockHeight(block: any): number {
        return 0
    }

    @def
    protected log(): Logger {
        return createLogger(this.getLoggingNamespace())
    }

    @def
    private program(): Command {
        let program = new Command()
        program.option('-a, --raw-archive <url>', 'Either local dir or s3:// url with pre-ingested RPC data', FileOrUrl(['s3:']))
        this.setUpRpc(program)
        this.setUpProgram(program)
        program.option('--first-block <number>', 'Height of the first block to ingest', nat)
        program.option('--last-block <number>', 'Height of the last block to ingest', nat)
        program.option('--service <port>', 'Run as HTTP data service', nat)
        program.option('--metrics <port>', 'Enable prometheus metrics server', nat)
        return program
    }

    private setUpRpc(program: Command): void {
        if (!this.hasRpc()) return
        let required = this.hasRpc() === 'required'
        program[required ? 'requiredOption' : 'option']('-e, --endpoint <url>', 'RPC endpoint', Url(['http:', 'https:', 'ws:', 'wss:']))
        program.option('-c, --endpoint-capacity <number>', 'Maximum number of pending RPC requests allowed', positiveInt, 10)
        program.option('-r, --endpoint-rate-limit <rps>', 'Maximum RPC rate in requests per second', nat)
        program.option('-b, --endpoint-max-batch-call-size <number>', 'Maximum size of RPC batch call', positiveInt)
    }

    @def
    protected options(): O {
        return this.program().parse().opts()
    }

    @def
    protected rpc(): RpcClient {
        let options = this.options()
        return new RpcClient({
            url: assertNotNull(options.endpoint, 'RPC endpoint is not specified'),
            capacity: options.endpointCapacity,
            rateLimit: options.endpointRateLimit,
            maxBatchCallSize: options.endpointMaxBatchCallSize,
            retryAttempts: this.isService() ? 5 : Number.MAX_SAFE_INTEGER
        })
    }

    protected isService(): boolean {
        return this.options().service != null
    }

    protected hasArchive(): boolean {
        return this.options().rawArchive != null
    }

    @def
    protected archive(): ArchiveLayout {
        let url = assertNotNull(this.options().rawArchive, 'archive is not specified')
        let fs = createFs(url, this.eventEmitter())
        return new ArchiveLayout(fs)
    }

    @def
    protected eventEmitter(): EventEmitter {
        return new EventEmitter()
    }

    @def
    protected prometheus() {
        let server = new PrometheusServer(
            this.options().metrics ?? 0
        )
        this.eventEmitter().on('S3FsOperation', (op: string) => server.incS3Requests(op))
        return server
    }

    private async ingest(range: Range, writable: Writable): Promise<void> {
        const prometheus = this.prometheus()
        
        for await (let blocks of this.getBlocks(range)) {
            await waitDrain(writable)
            
            if (blocks.length > 0) {
                const lastBlock = blocks[blocks.length - 1]

                //console.log(lastBlock)

                const lastBlockHeight = this.getBlockHeight(lastBlock)
                const lastBlockTimestamp = this.getBlockTimestamp(lastBlock)
                
                prometheus.setLastReceivedBlock(lastBlockHeight, lastBlockTimestamp)
                //change to debug later
                this.log().info(`Received block ${lastBlockHeight} at ${lastBlockTimestamp}`)

                for (let block of blocks) {
                    await new Promise(resolve => setTimeout(resolve, 100))
                    //uncomment this later
                    //writable.write(JSON.stringify(block) + '\n')
                }

                prometheus.setProcessedBlockMetrics(lastBlockHeight, lastBlockTimestamp)
                
                //change to debug later
                this.log().info(`Processed block ${lastBlockHeight} at ${lastBlockTimestamp}`)
            }
        }
    }

    private async runService(): Promise<void> {
        let port = this.options().service ?? 0
        let log = this.log().child('service')
        let app = new HttpApp()
        let self = this
        let prometheus = this.prometheus()

        app.setMaxRequestBody(1024)
        app.setLogger(log)
        app.setSocketTimeout(120_000)

        app.add('/', {
            async GET(ctx: HttpContext) {
                ctx.send(200, 'POST block range to receive data')
            },
            async POST(ctx: HttpContext) {
                let body = await ctx.getJson()
                if (!isRange(body)) return ctx.send(400, `invalid block range - ${JSON.stringify(body)}`)
                ctx.response.setHeader('content-type', 'text/plain')
                await self.ingest(body, ctx.response).catch(err => {
                    if (self.isRetryableError(err) && !ctx.response.headersSent) {
                        log.error(err)
                        throw new HttpError(502, err.toString())
                    } else {
                        throw err
                    }
                })
                ctx.response.end()
            }
        })

        if (this.options().metrics != null) {
            let server = await prometheus.serve()
            this.log().info(`prometheus metrics are available on port ${server.port}`)
        }

        let server = await app.listen(port)
        log.info(
            `Data service is listening on port ${server.port}. ` +
            `Note, that this service is dumb and not supposed to be public.`
        )
        return waitForInterruption(server)
    }

    run(): void {
        runProgram(async () => {
            if (this.isService()) {
                return this.runService()
            } else {
                let range = {
                    from: this.options().firstBlock ?? 0,
                    to: this.options().lastBlock
                }
                assertRange(range)
                
                const prometheus = this.prometheus()
                if (this.options().metrics != null) {
                    let server = await prometheus.serve()
                    this.log().info(`prometheus metrics are available on port ${server.port}`)
                }
                
                return this.ingest(range, process.stdout)
            }
        }, err => {
            this.log().fatal(err)
        })
    }
}
