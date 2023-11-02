import {createLogger, Logger} from '@subsquid/logger'
import {HttpClient, RetryError} from '@subsquid/http-client'
import {assertNotNull, def, last, Throttler, concurrentMap} from '@subsquid/util-internal'
import {ArchiveLayout, getShortHash} from '@subsquid/util-internal-archive-layout'
import {printTimeInterval, Progress} from '@subsquid/util-internal-counters'
import {createFs, Fs} from '@subsquid/util-internal-fs'
import {assertRange, printRange, Range, rangeEnd, FiniteRange, splitRange} from '@subsquid/util-internal-range'
import {BlockData, TransactionInfo} from './interfaces'
import {HttpApi} from './http'


function getBlockHash(blockId: string) {
    return '0x' + blockId.slice(16)
}

export interface DumperOptions {
    endpoint: string
    dest?: string
    firstBlock?: number
    lastBlock?: number
    withTrace?: boolean
    chunkSize: number
    metrics?: number
}


export class Dumper {
    constructor(private options: DumperOptions) {}

    @def
    log(): Logger {
        return createLogger('sqd:tron-dump')
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
    http(): HttpClient {
        return new HttpClient({
            baseUrl: this.options.endpoint,
            retryAttempts: Number.MAX_SAFE_INTEGER
        })
    }

    @def
    api(): HttpApi {
        return new HttpApi(this.http(), {
            validateResult(result, req) {
                if (result.status == 403) {
                    throw new RetryError()
                }
            },
        })
    }

    private async *generateStrides(range: Range): AsyncIterable<FiniteRange> {
        let head = new Throttler(async () => {
            let block = await this.api().getNowBlock()
            return block.block_header.raw_data.number || 0 - 20
        }, 10_000)

        let beg = range.from
        let end = range.to ?? Infinity
        while (beg <= end) {
            let top = await head.call()
            if (top < beg) continue
            let to = Math.min(end, top)
            for (let range of splitRange(1, {from: beg, to})) {
                yield range
            }
            beg = to + 1
        }
    }

    private async *ingest(range: Range): AsyncIterable<BlockData> {
        let batches = concurrentMap(
            5,
            this.generateStrides(range),
            async s => {
                let block = await this.api().getBlock(s.from)
                let transactionsInfo = await this.api().getTransactionInfo(s.from)

                if (s.from != 0) { // info isn't presented for genesis block
                    let infoById: Record<string, TransactionInfo> = {}
                    for (let info of transactionsInfo) {
                        infoById[info.id] = info;
                    }
                    for (let tx of block.transactions || []) {
                        let info = infoById[tx.txID]
                        if (info) {
                            tx.info = info
                        }
                    }
                }

                return {
                    block,
                    height: block.block_header.raw_data.number || 0,
                    hash: getBlockHash(block.blockID),
                }
            }
        )

        for await (let block of batches) {
            yield block
        }
    }

    private async *process(from?: number, prevHash?: string): AsyncIterable<BlockData[]> {
        let range = from == null ? this.range() : {
            from,
            to: this.range().to
        }
        assertRange(range)

        let height = new Throttler(async () => {
            let block = await this.api().getNowBlock()
            return block.block_header.raw_data.number || 0 - 20
        }, 60_000)
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

        for await (let block of this.ingest(range)) {
            if (block.height === from && prevHash) {
                let parentHash = getShortHash(getBlockHash(block.block.block_header.raw_data.parentHash))
                if (parentHash !== prevHash) {
                    throw new ErrorMessage(
                        `Block ${block.height}#${getShortHash(block.hash)} ` +
                        `is not a child of already archived block ${from}#${parentHash}`
                    )
                }
            }

            yield [block]

            progress.setCurrentValue(block.height)
            if (chainHeight < rangeEnd(range)) {
                chainHeight = Math.min(await height.get(), rangeEnd(range))
                progress.setTargetValue(chainHeight)
            } else {
                progress.setTargetValue(rangeEnd(range))
            }

            await status.get()
        }
    }

    async dump(): Promise<void> {
        if (this.options.dest == null) {
            for await (let bb of this.process()) {
                for (let block of bb) {
                    process.stdout.write(JSON.stringify(block) + '\n')
                }
            }
        } else {
            let archive = new ArchiveLayout(this.fs())
            await archive.appendRawBlocks({
                blocks: (nextBlock, prevHash) => this.process(nextBlock, prevHash),
                range: this.range(),
                chunkSize: this.options.chunkSize * 1024 * 1024,
            })
        }
    }
}


export class ErrorMessage extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
