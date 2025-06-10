import {Rpc, EvmRpcDataSource, GetBlock, Log, TraceTransactionReplay} from '@subsquid/evm-rpc'
import {assertNotNull, def, groupBy} from '@subsquid/util-internal'
import {Command, Dumper, DumperOptions, Range} from '@subsquid/util-internal-dump-cli'
import assert from 'assert'


type Block = GetBlock & {
    logs_?: Log[]
    unknownTraceReplays_?: TraceTransactionReplay[]
}


interface Options extends DumperOptions {
    withReceipts: boolean
    withTraces: boolean
    withStatediffs: boolean
    useTraceApi: boolean
    useDebugApiForStatediffs: boolean
}


export class EvmDumper extends Dumper<Block, Options> {
    protected setUpProgram(program: Command): void {
        program.description('Data archiving tool for EVM-based chains')
        program.option('--with-receipts', 'Fetch transaction receipt data')
        program.option('--with-traces', 'Fetch EVM call traces')
        program.option('--with-statediffs', 'Fetch EVM state updates')
        program.option('--use-trace-api', 'Use trace_* API for statediffs and call traces')
        program.option('--use-debug-api-for-statediffs', 'Use debug prestateTracer to fetch statediffs (by default will use trace_* api)')
    }

    protected getLoggingNamespace(): string {
        return 'sqd:evm-dump'
    }

    protected getParentBlockHash(block: Block): string {
        return block.parentHash
    }

    @def
    private dataSource(): EvmRpcDataSource {
        return new EvmRpcDataSource({
            rpc: new Rpc(this.rpc()),
            req: {
                transactions: true,
                receipts: this.options().withReceipts,
                traces: this.options().withTraces,
                stateDiffs: this.options().withStatediffs,
            },
        })
    }

    protected async getLastFinalizedBlockNumber(): Promise<number> {
        let head = await this.dataSource().getFinalizedHead()
        return head.number
    }

    protected async* getBlocks(range: Range): AsyncIterable<Block[]> {
        for await (let batch of this.dataSource().getFinalizedStream(range)) {
            yield batch.blocks.map(block => {
                let transactions = block.block.transactions
                if (this.options().withReceipts) {
                    assert(block.receipts)
                    let byTx = groupBy(block.receipts, r => r.transactionHash)
                    for (let tx of transactions) {
                        assert(typeof tx == 'object');
                        (tx as any).receipt_ = assertNotNull(byTx.get(tx.hash))
                    }
                }
                if (this.options().withTraces) {
                    // trace_block isn't supported
                }
                if (this.options().withStatediffs) {
                    assert(block.stateDiffs)
                    let byTx = groupBy(block.stateDiffs, r => r.transactionHash)
                    assert(transactions.length == byTx.size)
                    for (let tx of transactions) {
                        assert(typeof tx == 'object');
                        (tx as any).traceReplay_ = assertNotNull(byTx.get(tx.hash))
                    }
                }
                return {
                    ...block.block,
                    transactions,
                }
            })
        }
    }
}
