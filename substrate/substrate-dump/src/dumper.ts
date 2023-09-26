import {createLogger, Logger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {
    BlockBatch,
    BlockData,
    DataRequest,
    RpcDataSource,
    runtimeVersionEquals,
    RuntimeVersionId
} from '@subsquid/substrate-data-raw'
import {assertNotNull, def, last, Throttler} from '@subsquid/util-internal'
import {ArchiveLayout, getShortHash} from '@subsquid/util-internal-archive-layout'
import {printTimeInterval, Progress} from '@subsquid/util-internal-counters'
import {createFs, Fs} from '@subsquid/util-internal-fs'
import {assertRange, printRange, Range, rangeEnd} from '@subsquid/util-internal-range'
import {MetadataWriter} from './metadata'
import { PrometheusServer } from './prometheus'


export interface DumperOptions {
    endpoint: string
    endpointCapacity?: number
    endpointRateLimit?: number
    endpointMaxBatchCallSize?: number
    dest?: string
    firstBlock?: number
    lastBlock?: number
    withTrace?: boolean | string
    chunkSize: number
    metricsPort?: number
}


export class Dumper {
    constructor(private options: DumperOptions) {}

    @def
    log(): Logger {
        return createLogger('sqd:substrate-dump')
    }

    @def
    range(): Range {
        let range: Range = {from: 0}
        if (this.options.firstBlock) {
            range.from = this.options.firstBlock
        }
        if (this.options.lastBlock != null) {
            range.to = this.options.lastBlock
            if (range.from > range.to) {
                throw new ErrorMessage(`invalid requested block range ${printRange(range)} : first-block > last-block`)
            }
        }
        return range
    }

    @def
    fs(): Fs {
        let dest = assertNotNull(this.options.dest)
        return createFs(dest)
    }

    @def
    rpc(): RpcClient {
        return new RpcClient({
            url: this.options.endpoint,
            capacity: this.getEndpointCapacity(),
            maxBatchCallSize: this.options.endpointMaxBatchCallSize,
            rateLimit: this.options.endpointRateLimit,
            retryAttempts: Number.MAX_SAFE_INTEGER
        })
    }

    getEndpointCapacity(): number {
        return this.options.endpointCapacity || 10
    }

    @def
    src(): RpcDataSource {
        return new RpcDataSource({
            rpc: this.rpc(),
            pollInterval: 10_000,
            strides: Math.max(2, this.getEndpointCapacity() - 2)
        })
    }

    @def
    prometheus() {
        return new PrometheusServer(this.options.metricsPort ?? 3000);
    }

    ingest(range: Range): AsyncIterable<BlockBatch> {
        let request: DataRequest = {
            runtimeVersion: true,
            extrinsics: true,
            events: true,
            trace: typeof this.options.withTrace == 'string'
                ? this.options.withTrace
                : this.options.withTrace ? '' : undefined
        }

        const blocks = this.src().getFinalizedBlocks([{
            range,
            request
        }])
        return blocks;
    }

    private async *process(from?: number, prevHash?: string): AsyncIterable<BlockData[]> {
        let range = from == null ? this.range() : {
            from,
            to: this.range().to
        }
        assertRange(range)

        let height = new Throttler(() => this.src().getFinalizedHeight(), 300_000)
        let chainHeight = await height.get()
        this.prometheus().setChainHeight(chainHeight);

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

        for await (let batch of this.ingest(range)) {
            if (batch.blocks[0].height === from && prevHash) {
                let parentHash = getShortHash(batch.blocks[0].block.block.header.parentHash)
                if (parentHash !== prevHash) {
                    throw new ErrorMessage(
                        `Block ${batch.blocks[0].height}#${getShortHash(batch.blocks[0].hash)} ` +
                        `is not a child of already archived block ${from}#${parentHash}`
                    )
                }
            }
            const metrics = this.rpc().getMetrics();
            this.prometheus().setSuccesfulRequestCount(metrics.requestsServed);
            this.prometheus().setFailedRequestCount(metrics.connectionErrors);

            yield batch.blocks

            progress.setCurrentValue(last(batch.blocks).height)
            if (chainHeight < rangeEnd(range)) {
                chainHeight = await height.get()
                progress.setTargetValue(Math.min(chainHeight, rangeEnd(range)))
            }
            await status.get()
        }
    }

    private async *addMetadata(batches: AsyncIterable<BlockData[]>): AsyncIterable<BlockData[]> {
        let prevRuntimeVersion: RuntimeVersionId | undefined
        for await (let batch of batches) {
            for (let block of batch) {
                if (prevRuntimeVersion && runtimeVersionEquals(prevRuntimeVersion, assertNotNull(block.runtimeVersion))) {

                } else {
                    block.metadata = await this.src().rpc.getMetadata(block.hash)
                    prevRuntimeVersion = block.runtimeVersion
                }
            }
            yield batch
        }
    }

    private async *saveMetadata(batches: AsyncIterable<BlockData[]>): AsyncIterable<BlockData[]> {
        let writer = new MetadataWriter(this.fs().cd('metadata'))
        let prevRuntimeVersion: RuntimeVersionId | undefined
        for await (let batch of batches) {
            for (let block of batch) {
                let v = assertNotNull(block.runtimeVersion)
                if (prevRuntimeVersion && runtimeVersionEquals(prevRuntimeVersion, v)) {

                } else {
                    await writer.save({
                        specName: v.specName,
                        specVersion: v.specVersion,
                        implName: v.implName,
                        implVersion: v.implVersion,
                        blockHeight: block.height,
                        blockHash: getShortHash(block.hash)
                    }, () => {
                        return this.src().rpc.getMetadata(block.hash)
                    })
                    prevRuntimeVersion = v
                }
            }
            yield batch
        }
    }

    async dump(): Promise<void> {
        if (this.options.dest == null) {
            for await (let bb of this.addMetadata(this.process())) {
                for (let block of bb) {
                    process.stdout.write(JSON.stringify(block) + '\n')
                }
            }
        } else {
            const archive = new ArchiveLayout(this.fs())
            const prometheus = this.prometheus();
            if (this.options.metricsPort) {
                await prometheus.serve();
                this.log().info(`prometheus metrics are available on port ${this.options.metricsPort}`)
            }
            await archive.appendRawBlocks({
                blocks: (nextBlock, prevHash) => this.saveMetadata(this.process(nextBlock, prevHash)),
                range: this.range(),
                chunkSize: this.options.chunkSize * 1024 * 1024,
                onSuccessWrite: ({ blockRange: { to } }) => { prometheus.setLastWrittenBlock(to.height); }
            })
        }
    }
}


export class ErrorMessage extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
