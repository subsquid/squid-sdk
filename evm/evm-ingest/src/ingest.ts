import {createLogger} from '@subsquid/logger'
import {addErrorContext, def} from '@subsquid/util-internal'
import {Command, Ingest, IngestOptions, Range} from '@subsquid/util-internal-ingest-cli'
import {toJSON} from '@subsquid/util-internal-json'
import {assertValidity, B58, NAT, object} from '@subsquid/util-internal-validation'


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

    // @def
    // private mapping(): (raw: unknown) => object {
    //     let RawBlock = object({
    //         hash: B58,
    //         number: NAT,
    //         parentNumber: NAT,
    //         block: GetBlock
    //     })

    //     let loggingJournal = createLogger('sqd:solana-normalization')

    //     return function mapRawBlock(raw: unknown): object {
    //         assertValidity(RawBlock, raw)

    //         let journal = relaxed ? loggingJournal.child({
    //             blockSlot: raw.number,
    //             blockHash: raw.hash
    //         }) : failingJournal

    //         let normalized = mapRpcBlock(raw.number, raw.block, journal)
    //         return archive.toArchiveBlock(normalized)
    //     }
    // }

    protected async *getBlocks(range: Range): AsyncIterable<object[]> {
        for await (let batch of this.archive().getRawBlocks(range)) {
            yield batch.map(raw => {
                try {
                    let block = raw
                    return toJSON(block)
                } catch(err: any) {
                    let block = raw as any ?? {}
                    throw addErrorContext(err, {
                        blockNumber: block.number,
                        blockHash: block.hash
                    })
                }
            })
        }
    }
}
