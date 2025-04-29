import {createLogger} from '@subsquid/logger'
import {archive, Journal, mapRpcBlock} from '@subsquid/solana-normalization'
import {GetBlock, removeVoteTransactions} from '@subsquid/solana-rpc-data'
import {addErrorContext, def} from '@subsquid/util-internal'
import {Command, Ingest, IngestOptions, Range} from '@subsquid/util-internal-ingest-cli'
import {toJSON} from '@subsquid/util-internal-json'
import {assertValidity, B58, NAT, object} from '@subsquid/util-internal-validation'


interface Options extends IngestOptions {
    votes: boolean
    relaxed?: boolean
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
        program.option('--relaxed', 'Do not crush on log parsing failure')
    }

    @def
    private mapping(): (raw: unknown) => object {
        let votes = this.options().votes
        let relaxed = this.options().relaxed

        let RawBlock = object({
            hash: B58,
            number: NAT,
            parentNumber: NAT,
            block: GetBlock
        })

        let loggingJournal = createLogger('sqd:solana-normalization')

        let failingJournal: Journal = {
            warn: function(props: any, msg: string): void {
                throw addErrorContext(new Error(msg), props)
            },
            error: function(props: any, msg: string): void {
                throw addErrorContext(new Error(msg), props)
            }
        }

        return function mapRawBlock(raw: unknown): object {
            assertValidity(RawBlock, raw)

            if (!votes) {
                removeVoteTransactions(raw.block)
            }

            let journal = relaxed ? loggingJournal.child({
                blockSlot: raw.number,
                blockHash: raw.hash
            }) : failingJournal

            let normalized = mapRpcBlock(raw.number, raw.block, journal)

            return archive.toArchiveBlock(normalized)
        }
    }

    protected async *getBlocks(range: Range): AsyncIterable<object[]> {
        let mapping = this.mapping()

        let stream = this.archive().getRawBlocks({
            ...range,
            chunksLimit: this.isService() ? 10 : Number.MAX_SAFE_INTEGER
        })

        for await (let batch of stream) {
            yield batch.map(raw => {
                try {
                    let block = mapping(raw)
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
