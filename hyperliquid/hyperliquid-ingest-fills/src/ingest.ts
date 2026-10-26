import {addErrorContext} from '@subsquid/util-internal'
import {Command, FileOrUrl, Ingest, IngestOptions, Range} from '@subsquid/util-internal-ingest-cli'
import {toJSON} from '@subsquid/util-internal-json'
import {def} from '@subsquid/util-internal'
import {createFs} from '@subsquid/util-internal-fs'
import {mapRawBlock} from './mapping'
import {HyperliquidArchive} from './archive'


interface HyperliquidIngestOptions extends IngestOptions {
    hlArchive: string
}


export class HyperliquidIngest extends Ingest<HyperliquidIngestOptions> {
    protected getLoggingNamespace(): string {
        return 'sqd:hyperliquid-ingest'
    }

    protected setUpProgram(program: Command) {
        program.description('Data ingestion tool for Hyperliquid')
            .requiredOption('--hl-archive <url>', 'Hyperliquid archive url', FileOrUrl(['s3:']))
    }

    @def
    protected hlArchive(): HyperliquidArchive {
        let log = this.log().child('archive')
        let fs = createFs(this.options().hlArchive)
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
                        blockHeight: raw.block_number
                    })
                }
            })
        }
    }
}
