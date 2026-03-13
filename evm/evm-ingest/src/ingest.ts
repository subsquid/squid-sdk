import {RawBlock, mapRawBlock} from '@subsquid/evm-normalization'
import {addErrorContext} from '@subsquid/util-internal'
import {Command, Ingest, Range, IngestOptions} from '@subsquid/util-internal-ingest-cli'
import {toJSON} from '@subsquid/util-internal-json'


interface Options extends IngestOptions {
    withTraces?: boolean
    withStatediffs?: boolean
    fixLogIndex?: boolean
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
        program.option('--fix-log-index', 'Renumber log indices sequentially (workaround for chains with broken logIndex)')
    }

    protected async *getBlocks(range: Range): AsyncIterable<object[]> {
        let withTraces = this.options().withTraces
        let withStateDiffs = this.options().withStatediffs
        let fixLogIndex = this.options().fixLogIndex

        for await (let batch of this.archive().getRawBlocks<RawBlock>(range)) {
            yield batch.map(raw => {
                try {
                    let block = mapRawBlock(raw, withTraces, withStateDiffs, fixLogIndex)
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

    protected getBlockHeight(block: any): number {
        return block.header.number
    }

    protected getBlockTimestamp(block: any): number {
        return block.header.timestamp
    }
}
