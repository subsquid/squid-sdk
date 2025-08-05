import {Rpc, EvmRpcDataSource} from '@subsquid/evm-rpc'
import {RawBlock, toRawBlock} from '@subsquid/evm-normalization'
import {def} from '@subsquid/util-internal'
import {Command, Dumper, DumperOptions, Range, positiveInt} from '@subsquid/util-internal-dump-cli'


interface Options extends DumperOptions {
    finalityConfirmation?: number
    withReceipts?: boolean
    withTraces?: boolean
    withStatediffs?: boolean
    useTraceApi?: boolean
    useDebugApiForStatediffs?: boolean
    verifyBlockHash?: boolean
    verifyTxSender?: boolean
    verifyTxRoot?: boolean
    verifyReceiptsRoot?: boolean
    verifyLogsBloom?: boolean
}


export class EvmDumper extends Dumper<RawBlock, Options> {
    protected setUpProgram(program: Command): void {
        program.description('Data archiving tool for EVM-based chains')
        program.option('--finality-confirmation <number>', 'Finality offset from the head of a chain', positiveInt)
        program.option('--with-receipts', 'Fetch transaction receipt data')
        program.option('--with-traces', 'Fetch EVM call traces')
        program.option('--with-statediffs', 'Fetch EVM state updates')
        program.option('--use-trace-api', 'Use trace_* API for statediffs and call traces')
        program.option('--use-debug-api-for-statediffs', 'Use debug prestateTracer to fetch statediffs (by default will use trace_* api)')
        program.option('--verify-block-hash', 'Verify block header against block hash')
        program.option('--verify-tx-sender', 'Check if transaction sender matches sender recovered from signature')
        program.option('--verify-tx-root', 'Verify block transactions against transactions root')
        program.option('--verify-receipts-root', 'Verify block receipts against receipts root')
        program.option('--verify-logs-bloom', 'Verify block logs against logs bloom')
    }

    protected getLoggingNamespace(): string {
        return 'sqd:evm-dump'
    }

    protected getParentBlockHash(block: RawBlock): string {
        return block.parentHash
    }

    @def
    private dataSource(): EvmRpcDataSource {
        return new EvmRpcDataSource({
            rpc: new Rpc({
                client: this.rpc(),
                finalityConfirmation: this.options().finalityConfirmation,
                verifyBlockHash: this.options().verifyBlockHash,
                verifyTxSender: this.options().verifyTxSender,
                verifyTxRoot: this.options().verifyTxRoot,
                verifyReceiptsRoot: this.options().verifyReceiptsRoot,
                verifyLogsBloom: this.options().verifyLogsBloom
            }),
            req: {
                transactions: true,
                logs: !this.options().withReceipts,
                receipts: this.options().withReceipts,
                traces: this.options().withTraces,
                stateDiffs: this.options().withStatediffs,
                useDebugApiForStateDiffs: this.options().useDebugApiForStatediffs,
                useTraceApi: this.options().useTraceApi,
            },
        })
    }

    protected async getLastFinalizedBlockNumber(): Promise<number> {
        let head = await this.dataSource().getFinalizedHead()
        return head.number
    }

    protected async* getBlocks(range: Range): AsyncIterable<RawBlock[]> {
        for await (let batch of this.dataSource().getFinalizedStream(range)) {
            yield batch.blocks.map(toRawBlock)
        }
    }
}
