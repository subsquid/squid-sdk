import {createLogger, Logger} from '@subsquid/logger'
import {assertNotNull, def} from '@subsquid/util-internal'
import {ArchiveLayout} from '@subsquid/util-internal-archive-layout'
import {FileOrUrl, nat, positiveInt, Url} from '@subsquid/util-internal-commander'
import {createFs} from '@subsquid/util-internal-fs'
import {Range} from '@subsquid/util-internal-range'
import {Command} from 'commander'


export interface IngestOptions {
    rawArchive?: string
    firstBlock: number
    lastBlock?: number
    service?: number
}


export class Ingest<B, O extends IngestOptions = IngestOptions> {
    setUpProgram(program: Command): void {}

    @def
    private program(): Command {
        let program = new Command()
        program.option('-a, --raw-archive <url>', 'Either local dir or s3:// url with pre-ingested RPC data', FileOrUrl(['s3:']))
        this.setUpProgram(program)
        program.option('--first-block <number>', 'Height of the first block to ingest', nat)
        program.option('--last-block <number>', 'Height of the last block to ingest', nat)
        program.option('--service <port>', 'Run as HTTP data service')
        return program
    }

    @def
    options(): O {
        return this.program().parse().opts()
    }

    isService(): boolean {
        return this.options().service != null
    }

    @def
    log(): Logger {
        return createLogger(this.getLoggingNamespace())
    }

    getLoggingNamespace(): string {
        return 'sqd:ingest'
    }

    getBlocks(range: Range): AsyncIterable<B[]> {
        throw new Error('data ingestion is not implemented')
    }

    process(blocks: AsyncIterable<B[]>): AsyncIterable<any[]> {
        return blocks
    }

    @def
    private archive(): ArchiveLayout {
        let url = assertNotNull(this.options().rawArchive, 'archive is not specified')
        let fs = createFs(url)
        return new ArchiveLayout(fs)
    }
}
