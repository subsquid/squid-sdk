import {RawBlock, mapRawBlock} from '@subsquid/evm-normalization'
import {addErrorContext} from '@subsquid/util-internal'
import {Command, Ingest, Range, IngestOptions} from '@subsquid/util-internal-ingest-cli'
import {toJSON} from '@subsquid/util-internal-json'


interface Options extends IngestOptions {
    withTraces?: boolean
    withStatediffs?: boolean
    assertLogIndex?: boolean
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
        program.option('--assert-log-index', 'Assert that log indices within a block are sequential')
    }

    protected async *getBlocks(range: Range): AsyncIterable<object[]> {
        for await (let batch of this.archive().getRawBlocks<RawBlock>(range)) {
            yield batch.map(raw => {
                try {
                    let block = mapRawBlock(raw, {
                        withTraces: this.options().withTraces,
                        withStateDiffs: this.options().withStatediffs,
                        assertLogIndex: this.options().assertLogIndex,
                    })
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
