import {Block, mapRpcBlock} from '@subsquid/solana-data/lib/normalization'
import {Block as RawBlock} from '@subsquid/solana-data/lib/rpc'
import {addErrorContext} from '@subsquid/util-internal'
import {Command, Ingest, IngestOptions, Range} from '@subsquid/util-internal-ingest-cli'
import {toJSON} from '@subsquid/util-internal-json'


interface Options extends IngestOptions {
    votes: boolean
}


export class SolanaIngest extends Ingest<Options> {
    protected getLoggingNamespace(): string {
        return 'sqd:solana-ingest'
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

    protected async *getBlocks(range: Range): AsyncIterable<object[]> {
        let votes = this.options().votes
        for await (let blocks of this.archive().getRawBlocks<RawBlock>(range)) {
            yield blocks.map(raw => {
                try {
                    let block = mapRpcBlock(raw)
                    if (!votes) {
                        removeVotes(block)
                    }
                    return toJSON(block)
                } catch(err: any) {
                    throw addErrorContext(err, {
                        blockHeight: raw.height,
                        blockHash: raw.hash,
                        blockSlot: raw.slot
                    })
                }
            })
        }
    }
}


function removeVotes(block: Block): void {
    let removed = new Set<number>()

    for (let i of block.instructions) {
        if (i.programId == 'Vote111111111111111111111111111111111111111') {
            removed.add(i.transactionIndex)
        }
    }

    function kept(item: {transactionIndex: number}): boolean {
        return !removed.has(item.transactionIndex)
    }

    block.transactions = block.transactions.filter(kept)
    block.instructions = block.instructions.filter(kept)
    block.logs = block.logs.filter(kept)
    block.balances = block.balances.filter(kept)
    block.tokenBalances = block.tokenBalances.filter(kept)
}
