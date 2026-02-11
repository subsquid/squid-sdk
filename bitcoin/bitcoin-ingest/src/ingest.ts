import { RawBlock, mapRawBlock } from '@subsquid/bitcoin-normalization'
import { addErrorContext } from '@subsquid/util-internal'
import { Command, Ingest, Range } from '@subsquid/util-internal-ingest-cli'
import { toJSON } from '@subsquid/util-internal-json'

export class BitcoinIngest extends Ingest {
    protected getLoggingNamespace(): string {
        return 'sqd:bitcoin-ingest'
    }

    protected hasRpc(): 'required' | boolean {
        return false
    }

    protected setUpProgram(program: Command) {
        program.description('Data ingestion tool for Bitcoin blockchain')
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
                } catch (err: any) {
                    throw addErrorContext(err, {
                        blockNumber: raw.height,
                        blockHash: raw.hash
                    })
                }
            })
        }
    }

    protected getBlockHeight(block: RawBlock): number {
        return Number(block.height)
    }

    protected getBlockTimestamp(block: RawBlock): number {
        return Number(block.time)
    }
}
