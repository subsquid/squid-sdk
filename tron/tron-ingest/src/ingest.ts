import {addErrorContext} from '@subsquid/util-internal'
import {Command, Ingest, IngestOptions, Range} from '@subsquid/util-internal-ingest-cli'
import {toJSON} from '@subsquid/util-internal-json'
import {BlockData} from '@subsquid/tron-data'
import {mapBlock} from '@subsquid/tron-normalization'


export class TronIngest extends Ingest<IngestOptions> {
    protected getLoggingNamespace(): string {
        return 'sqd:tron-ingest'
    }

    protected setUpProgram(program: Command) {
        program.description('Data ingestion tool for Tron')
    }

    protected async *getBlocks(range: Range): AsyncIterable<object[]> {
        for await (let blocks of this.archive().getRawBlocks<BlockData>(range)) {
            yield blocks.map(raw => {
                try {
                    let block = mapBlock(raw)
                    return toJSON(block)
                } catch(err: any) {
                    throw addErrorContext(err, {
                        blockHeight: raw.height,
                        blockHash: raw.hash,
                    })
                }
            })
        }
    }
}
