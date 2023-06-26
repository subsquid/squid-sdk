import {createLogger, Logger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {BlockBatch, BlockData, Bytes, DataRequest, RpcDataSource} from '@subsquid/substrate-raw-data'
import {assertNotNull, def, last, Throttler} from '@subsquid/util-internal'
import {ArchiveLayout, getShortHash} from '@subsquid/util-internal-archive-layout'
import {printTimeInterval, Progress} from '@subsquid/util-internal-counters'
import {createFs, Fs} from '@subsquid/util-internal-fs'
import {assertRange, printRange, Range, rangeEnd} from '@subsquid/util-internal-range'
import {MetadataWriter} from './metadata-archive'


export interface Options {
    endpoint: string
    endpointCapacity?: number
    endpointRateLimit?: number
    dest?: string
    firstBlock?: number
    lastBlock?: number
}


export class Dumper {
    constructor(private options: Options) {}

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

    ingest(range: Range): AsyncIterable<BlockBatch> {
        let request: DataRequest = {
            runtimeVersion: true,
            metadata: true,
            extrinsics: true,
            events: true
        }

        return this.src().getFinalizedBlocks([{
            range,
            request
        }])
    }

    private async *process(from?: number, prevHash?: string): AsyncIterable<BlockData[]> {
        let range = from == null ? this.range() : {
            from,
            to: this.range().to
        }
        assertRange(range)

        let height = new Throttler(() => this.src().getFinalizedHeight(), 300_000)
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

            yield batch.blocks

            progress.setCurrentValue(last(batch.blocks).height)
            if (chainHeight < rangeEnd(range)) {
                chainHeight = await height.get()
                progress.setTargetValue(Math.min(chainHeight, rangeEnd(range)))
            }
            await status.get()
        }
    }

    private async *stripMetadata(batches: AsyncIterable<BlockData[]>): AsyncIterable<BlockData[]> {
        let prevMetadata: Bytes | undefined
        for await (let batch of batches) {
            for (let block of batch) {
                if (block.metadata === prevMetadata) {
                    block.metadata = undefined
                } else {
                    prevMetadata = block.metadata
                }
            }
            yield batch
        }
    }

    private async *stripAndSaveMetadata(batches: AsyncIterable<BlockData[]>): AsyncIterable<BlockData[]> {
        let writer = new MetadataWriter(this.fs().cd('metadata'))
        for await (let batch of batches) {
            await writer.stripAndSaveMetadata(batch)
            yield batch
        }
    }

    async dump(): Promise<void> {
        if (this.options.dest == null) {
            for await (let bb of this.stripMetadata(this.process())) {
                for (let block of bb) {
                    process.stdout.write(JSON.stringify(block) + '\n')
                }
            }
        } else {
            let archive = new ArchiveLayout(this.fs())
            await archive.appendRawBlocks({
                blocks: (nextBlock, prevHash) => this.stripAndSaveMetadata(this.process(nextBlock, prevHash)),
                range: this.range()
            })
        }
    }
}


export class ErrorMessage extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
