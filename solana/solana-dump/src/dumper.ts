import {Block as RpcBlock, Rpc, SolanaRpcDataSource} from '@subsquid/solana-rpc'
import {def} from '@subsquid/util-internal'
import {Command, Dumper, DumperOptions, positiveInt, Range, removeOption} from '@subsquid/util-internal-dump-cli'


interface Block {
    hash: string
    number: number
    parentNumber: number
    block: RpcBlock['block']
}


interface Options extends DumperOptions {
    strideConcurrency: number
    strideSize: number
    maxConfirmationAttempts: number
}


export class SolanaDumper extends Dumper<Block, Options> {
    protected setUpProgram(program: Command): void {
        program.description('Data archiving tool for Solana')
        removeOption(program, 'endpointMaxBatchCallSize')
        removeOption(program, 'endpointCapacity')
        program.option('--stride-size <N>', 'Maximum size of getBlock batch call', positiveInt, 5)
        program.option('--stride-concurrency <N>', 'Maximum number of pending getBlock batch calls', positiveInt, 5)
        program.option('--max-confirmation-attempts <N>', 'Maximum number of confirmation attempts', positiveInt, 10)
    }

    @def
    protected options(): Options {
        let options = this.program().parse().opts<Options>()
        options.endpointCapacity = options.strideConcurrency + 5
        return options
    }

    protected fixUnsafeIntegers(): boolean {
        return true
    }

    protected getLoggingNamespace(): string {
        return 'sqd:solana-dump'
    }

    protected getDefaultChunkSize(): number {
        return 128
    }

    protected getDefaultTopDirSize(): number {
        return 8192
    }

    protected getParentBlockHash(block: Block): string {
        return block.block.previousBlockhash
    }

    @def
    private dataSource(): SolanaRpcDataSource {
        return new SolanaRpcDataSource({
            rpc: new Rpc(this.rpc()),
            req: {transactions: true, rewards: true},
            strideSize: this.options().strideSize,
            strideConcurrency: this.options().strideConcurrency,
            maxConfirmationAttempts: this.options().maxConfirmationAttempts,
        })
    }

    protected async getLastFinalizedBlockNumber(): Promise<number> {
        let head = await this.dataSource().getFinalizedHead()
        return head.number
    }

    protected async* getBlocks(range: Range): AsyncIterable<Block[]> {
        for await (let batch of this.dataSource().getFinalizedStream(range)) {
            yield batch.blocks.map(block => {
                return {
                    hash: block.block.blockhash,
                    number: block.slot,
                    parentNumber: block.block.parentSlot,
                    block: block.block
                }
            })
        }
    }
}
