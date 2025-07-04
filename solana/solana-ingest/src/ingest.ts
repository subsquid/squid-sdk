import {addErrorContext, def} from '@subsquid/util-internal'
import {Command, Ingest, IngestOptions, Range} from '@subsquid/util-internal-ingest-cli'
import {toJSON} from '@subsquid/util-internal-json'
import {RawBlock, removeVoteTransactions} from './mapping'
import {assertValidity} from '@subsquid/util-internal-validation'
import {mapRpcBlock} from '@subsquid/solana-normalization'


interface Options extends IngestOptions {
    votes: boolean
}


export class SolanaIngest extends Ingest<Options> {
    protected getLoggingNamespace(): string {
        return 'sqd:solana-ingest'
    }

    protected hasRpc(): 'required' | boolean {
        return false
    }

    protected setUpProgram(program: Command) {
        program.description('Data ingestion tool for Solana')
        program.options.forEach(option => {
            if (option.attributeName() == 'rawArchive') {
                option.required = true
            }
        })
        program.option('--no-votes', 'Exclude vote transactions')
    }

    @def
    private mapping(): (raw: unknown) => object {
        let votes = this.options().votes

        return function mapRawBlock(raw: unknown): object {
            assertValidity(RawBlock, raw)

            if (!votes) {
                removeVoteTransactions(raw.block)
            }

            let normalized = mapRpcBlock(raw, {
                warn: function(props: any, msg: string): void {
                    throw addErrorContext(new Error(msg), props)
                },
                error: function(props: any, msg: string): void {
                    throw addErrorContext(new Error(msg), props)
                }
            })

            return normalized
        }
    }

    protected async *getBlocks(range: Range): AsyncIterable<object[]> {
        let mapping = this.mapping()

        for await (let blocks of this.archive().getRawBlocks<RawBlock>(range)) {
            yield blocks.map(raw => {
                try {
                    let block = mapping(raw)
                    return toJSON(block)
                } catch(err: any) {
                    throw addErrorContext(err, {
                        blockHash: raw.hash,
                        blockHeight: raw.height,
                        blockSlot: raw.slot
                    })
                }
            })
        }
    }

    protected getBlockHeight(block: any): number {
        return Number(block.header.height) || 0
    }

    protected getBlockTimestamp(block: any): number {
        return Number(block.header.timestamp) || 0
    }
}
