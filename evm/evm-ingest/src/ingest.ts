import {RawBlock, mapRawBlock} from '@subsquid/evm-normalization'
import {addErrorContext} from '@subsquid/util-internal'
import {Command, Ingest, Range, IngestOptions} from '@subsquid/util-internal-ingest-cli'
import {toJSON} from '@subsquid/util-internal-json'


interface Options extends IngestOptions {
    withTraces?: boolean
    withStatediffs?: boolean
}


export class EvmIngest extends Ingest<Options> {
    protected getLoggingNamespace(): string {
        return 'sqd:evm-ingest'
    }

    protected hasRpc(): 'required' | boolean {
        return false
    }

    protected setUpProgram(program: Command) {
        program.description('Data ingestion tool for EVM-based chains')
        program.options.forEach(option => {
            if (option.attributeName() == 'rawArchive') {
                option.required = true
            }
        })
        program.option('--with-traces', 'Include EVM call traces')
        program.option('--with-statediffs', 'Include EVM state updates')
    }

    protected async *getBlocks(range: Range): AsyncIterable<object[]> {
        let withTraces = this.options().withTraces
        let withStateDiffs = this.options().withStatediffs

        for await (let batch of this.archive().getRawBlocks<RawBlock>(range)) {
            yield batch.map(raw => {
                try {
                    let block = mapRawBlock(raw, withTraces, withStateDiffs)
                    return toJSON(block)
                } catch(err: any) {
                    throw addErrorContext(err, {
                        blockNumber: raw.number,
                        blockHash: raw.hash
                    })
                }
            })
        }
    }

    protected getBlockHeight(block: RawBlock): number {
        return Number(block.number)
    }

    protected getBlockTimestamp(block: RawBlock): number {
        return Number(block.timestamp)
    }
}
