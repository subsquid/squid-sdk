import {S3Client} from '@aws-sdk/client-s3'
import {addErrorContext} from '@subsquid/util-internal'
import {Command, FileOrUrl, Ingest, IngestOptions, Range} from '@subsquid/util-internal-ingest-cli'
import {positiveInt} from '@subsquid/util-internal-commander'
import {toJSON} from '@subsquid/util-internal-json'
import {def} from '@subsquid/util-internal'
import {S3Fs} from '@subsquid/util-internal-fs'
import {mapRawBlock, Block} from '@subsquid/hyperliquid-replica-cmds-normalization'
import {HyperliquidArchive} from './archive'
import {ParallelDownloader} from './download'


interface HyperliquidIngestOptions extends IngestOptions {
    hlArchive: string
    downloadConcurrency: number
}


const PART_SIZE = 16 * 1024 * 1024


export class HyperliquidIngest extends Ingest<HyperliquidIngestOptions> {
    protected getLoggingNamespace(): string {
        return 'sqd:hyperliquid-ingest'
    }

    protected getSocketTimeout() {
        return 600_000
    }

    protected setUpProgram(program: Command) {
        program.description('Data ingestion tool for Hyperliquid')
            .requiredOption('--hl-archive <url>', 'Hyperliquid archive url', FileOrUrl(['s3:']))
            .option('--download-concurrency <n>', 'byte ranges of one archive file fetched at once', positiveInt, 8)
    }

    @def
    protected hlArchive(): HyperliquidArchive {
        let log = this.log().child('archive')
        let client = new S3Client({
            endpoint: process.env.AWS_S3_ENDPOINT
        })
        let fs = new S3Fs({
            root: this.options().hlArchive.slice('s3://'.length),
            client,
            requestPayer: 'requester'
        })
        let downloader = new ParallelDownloader({
            client,
            requestPayer: 'requester',
            concurrency: this.options().downloadConcurrency,
            partSize: PART_SIZE,
            partTimeoutMs: 120_000,
            partAttempts: 5,
            log
        })
        let readStream = (path: string) => {
            let [bucket, ...key] = fs.abs(path).slice('s3://'.length).split('/')
            return downloader.readStream(bucket, key.join('/'))
        }
        return new HyperliquidArchive(fs, log, readStream)
    }

    protected async *getBlocks(range: Range): AsyncIterable<object[]> {
        for await (let blocks of this.hlArchive().getRawBlocks(range)) {
            yield blocks.map(raw => {
                try {
                    let block = mapRawBlock(raw)
                    return toJSON(block)
                } catch(err: any) {
                    throw addErrorContext(err, {
                        blockHeight: raw.height
                    })
                }
            })
        }
    }

    protected getBlockTimestamp(block: Block): number {
        return Math.floor(block.header.timestamp / 1000)
    }

    protected getBlockHeight(block: Block): number {
        return block.header.height
    }
}

