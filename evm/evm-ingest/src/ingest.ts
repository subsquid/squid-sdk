import {mapRpcBlock} from '@subsquid/evm-data/lib/normalization'
import {Block as RawBlock} from '@subsquid/evm-data/lib/rpc'
import {addErrorContext} from '@subsquid/util-internal'
import {Command, Ingest, Range} from '@subsquid/util-internal-ingest-cli'
import {toJSON} from '@subsquid/util-internal-json'


export class EvmIngest extends Ingest {
    protected getLoggingNamespace(): string {
        return 'sqd:evm-ingest'
    }

    protected setUpProgram(program: Command) {
        program.description('Data ingestion tool for EVM')
        program.options.forEach(option => {
            if (option.attributeName() == 'rawArchive') {
                option.required = true
            }
        })
    }

    protected async *getBlocks(range: Range): AsyncIterable<object[]> {
        for await (let blocks of this.archive().getRawBlocks<RawBlock>(range)) {
            yield blocks.map(raw => {
                try {
                    let block = mapRpcBlock(raw)
                    return toJSON(block)
                } catch(err: any) {
                    throw addErrorContext(err, {
                        blockHeight: raw.height,
                        blockHash: raw.hash
                    })
                }
            })
        }
    }
}
