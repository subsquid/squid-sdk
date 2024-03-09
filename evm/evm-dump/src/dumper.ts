import {Block, DataRequest} from '@subsquid/evm-data/lib/rpc/rpc-data'
import {Rpc} from '@subsquid/evm-data/lib/rpc/rpc'
import {def} from '@subsquid/util-internal'
import {coldIngest} from '@subsquid/util-internal-ingest-tools'
import {Command, Dumper, DumperOptions, positiveInt, Range} from '@subsquid/util-internal-dump-cli'


interface Options extends DumperOptions {
    bestBlockOffset: number
    withReceipts: boolean
    withTraces: boolean
    withStatediffs: boolean
    useTraceApi: boolean
    useDebugApiForStatediffs: boolean
}


export class EvmDumper extends Dumper<Block, Options> {
    protected setUpProgram(program: Command): void {
        program.description('Data archiving tool for EVM')
        program.option('--best-block-offset <N>', 'Finality offset from the head of chain', positiveInt, 30)
        program.option('--with-receipts', 'Fetch transaction receipt data')
        program.option('--with-traces', 'Fetch EVM call traces')
        program.option('--with-statediffs', 'Fetch EVM state updates')
        program.option('--use-trace-api', 'Use trace_* API for statediffs and call traces')
        program.option('--use-debug-api-for-statediffs', 'Use debug prestateTracer to fetch statediffs (by default will use trace_* api)')
    }

    protected getLoggingNamespace(): string {
        return 'sqd:evm-dump'
    }

    protected getPrevBlockHash(block: Block): string {
        return block.block.parentHash
    }

    protected getDefaultTopDirSize(): number {
        return 500
    }

    @def
    private getDataSource(): Rpc {
        return new Rpc(this.rpc())
    }

    protected async* getBlocks(range: Range): AsyncIterable<Block[]> {
        let request: DataRequest = {
            logs: true,
            transactions: true,
            receipts: this.options().withReceipts,
            traces: this.options().withTraces,
            stateDiffs: this.options().withStatediffs,
            preferTraceApi: this.options().useTraceApi,
            useDebugApiForStateDiffs: this.options().useDebugApiForStatediffs
        }
        let batches = coldIngest({
            getFinalizedHeight: () => this.getFinalizedHeight(),
            getSplit: req => this.getDataSource().getColdSplit(req),
            requests: [{range, request}],
            concurrency: Math.min(5, this.getDataSource().client.getConcurrency()),
            splitSize: 10,
            stopOnHead: false,
            headPollInterval: 10_000
        })
        for await (let batch of batches) {
            yield batch.blocks
        }
    }

    protected async getFinalizedHeight(): Promise<number> {
        let height = await this.getDataSource().getHeight()
        return Math.max(0, height - this.options().bestBlockOffset)
    }
}
