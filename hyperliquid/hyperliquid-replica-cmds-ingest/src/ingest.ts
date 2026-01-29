import {S3Client} from '@aws-sdk/client-s3'
import {addErrorContext} from '@subsquid/util-internal'
import {Command, FileOrUrl, Ingest, IngestOptions, Range} from '@subsquid/util-internal-ingest-cli'
import {toJSON} from '@subsquid/util-internal-json'
import {def} from '@subsquid/util-internal'
import {S3Fs} from '@subsquid/util-internal-fs'
import {mapRawBlock, Block} from '@subsquid/hyperliquid-replica-cmds-normalization'
import {HyperliquidArchive} from './archive'


interface HyperliquidIngestOptions extends IngestOptions {
    hlArchive: string
}


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
        return new HyperliquidArchive(fs, log)
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
