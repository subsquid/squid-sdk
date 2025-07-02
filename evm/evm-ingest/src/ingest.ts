import {RawBlock, mapRawBlock} from '@subsquid/evm-normalization'
import {addErrorContext} from '@subsquid/util-internal'
import {Command, Ingest, Range} from '@subsquid/util-internal-ingest-cli'
import {toJSON} from '@subsquid/util-internal-json'


export class EvmIngest extends Ingest {
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
    }

    protected async *getBlocks(range: Range): AsyncIterable<object[]> {
        for await (let batch of this.archive().getRawBlocks<RawBlock>(range)) {
            yield batch.map(raw => {
                try {
                    let block = mapRawBlock(raw)
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
}
