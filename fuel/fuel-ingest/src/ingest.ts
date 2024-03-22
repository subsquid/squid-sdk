import {mapRawBlock} from '@subsquid/fuel-data/lib/mapping'
import {BlockData} from '@subsquid/fuel-data/lib/raw-data'
import {addErrorContext} from '@subsquid/util-internal'
import {Command, Ingest, IngestOptions, Range} from '@subsquid/util-internal-ingest-cli'


export class FuelIngest extends Ingest<IngestOptions> {
    protected getLoggingNamespace(): string {
        return 'sqd:fuel-ingest'
    }

    protected setUpProgram(program: Command) {
        program.description('Data ingestion tool for Fuel')
    }

    protected async *getBlocks(range: Range): AsyncIterable<object[]> {
        for await (let blocks of this.archive().getRawBlocks<BlockData>(range)) {
            yield blocks.map(raw => {
                try {
                    let block = mapRawBlock(raw)
                    return block
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
