import {mapRawBlock} from '@subsquid/fuel-normalization'
import {BlockData} from '@subsquid/fuel-data/lib/raw-data'
import {addErrorContext} from '@subsquid/util-internal'
import {Command, Ingest, IngestOptions, Range} from '@subsquid/util-internal-ingest-cli'
import {toJSON} from '@subsquid/util-internal-json'


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

    protected getBlockHeight(block: any): number {
        return Number(block.header.height) || 0
    }

    protected getBlockTimestamp(block: any): number {
        const TAI64_UNIX_OFFSET = BigInt("4611686018427387914");
        const taiTimestamp = BigInt(block.header.time);
        const unixTimeMs = taiTimestamp - TAI64_UNIX_OFFSET;
        return Number(unixTimeMs);
    }
}
