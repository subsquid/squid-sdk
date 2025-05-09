import {Rpc, EvmRpcDataSource, RawBlock, Log, TraceTransactionReplay} from '@subsquid/evm-rpc'
import {def} from '@subsquid/util-internal'
import {Command, Dumper, Range} from '@subsquid/util-internal-dump-cli'


type Block = RawBlock & {
    logs_?: Log[]
    unknownTraceReplays_?: TraceTransactionReplay[]
}


export class EvmDumper extends Dumper<Block> {
    protected setUpProgram(program: Command): void {
        program.description('Data archiving tool for EVM-based chains')
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
            req: {transactions: true},
        })
    }

    protected async getLastFinalizedBlockNumber(): Promise<number> {
        let head = await this.dataSource().getFinalizedHead()
        return head.number
    }

    protected async* getBlocks(range: Range): AsyncIterable<Block[]> {
        for await (let batch of this.dataSource().getFinalizedStream(range)) {
            yield batch.blocks.map(block => {
                let {receipts, traces, stateDiffs, ...props} = block.block
                return {
                    ...props
                }
            })
        }
    }
}
