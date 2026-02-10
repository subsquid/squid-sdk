import { Rpc, BitcoinRpcDataSource, GetBlock, DEFAULT_FINALITY_CONFIRMATION } from '@subsquid/bitcoin-rpc'
import { def } from '@subsquid/util-internal'
import { Command, Dumper, DumperOptions, Range, positiveInt } from '@subsquid/util-internal-dump-cli'


interface Options extends DumperOptions {
    finalityConfirmation: number
    verifyBlockHash?: boolean
    verifyTxRoot?: boolean
    verifyWitnessCommitment?: boolean
}


export class BitcoinDumper extends Dumper<GetBlock, Options> {
    protected setUpProgram(program: Command): void {
        program.description('Data archiving tool for Bitcoin blockchain')
        program.option('--finality-confirmation <number>', 'Finality offset from the head of a chain', positiveInt, DEFAULT_FINALITY_CONFIRMATION)
        program.option('--verify-block-hash', 'Verify block header against block hash')
        program.option('--verify-tx-root', 'Verify block transactions against transactions root')
        program.option('--verify-witness-commitment', 'Verify witness commitment in coinbase transaction')
    }

    protected getLoggingNamespace(): string {
        return 'sqd:bitcoin-dump'
    }

    protected getParentBlockHash(block: GetBlock): string {
        return block.previousblockhash || ''
    }

    protected getBlockTimestamp(block: GetBlock): number {
        return Number(block.time) || 0
    }

    @def
    private dataSource(): BitcoinRpcDataSource {
        return new BitcoinRpcDataSource({
            rpc: new Rpc({
                client: this.rpc(),
                finalityConfirmation: this.options().finalityConfirmation,
                verifyBlockHash: this.options().verifyBlockHash,
                verifyTxRoot: this.options().verifyTxRoot,
                verifyWitnessCommitment: this.options().verifyWitnessCommitment
            }),
            req: {
                transactions: true
            },
        })
    }

    protected async getLastFinalizedBlockNumber(): Promise<number> {
        let head = await this.dataSource().getFinalizedHead()
        return head.number
    }

    protected async* getBlocks(range: Range): AsyncIterable<GetBlock[]> {
        return this.dataSource().getFinalizedStream(range)
    }
}
