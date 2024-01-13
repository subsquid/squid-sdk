import {Block, RpcDataSource} from '@subsquid/solana-data/lib/rpc'
import {def} from '@subsquid/util-internal'
import {Command, Dumper, DumperOptions, positiveInt, Range, removeOption} from '@subsquid/util-internal-dump-cli'


interface Options extends DumperOptions {
    strideConcurrency: number
    strideSize: number
}


export class SolanaDumper extends Dumper<Block, Options> {
    protected setUpProgram(program: Command): void {
        program.description('Data archiving tool for Solana')
        removeOption(program, 'endpointMaxBatchCallSize')
        removeOption(program, 'endpointCapacity')
        program.option('--stride-size <N>', 'Maximum size of getBlock batch call', positiveInt, 10)
        program.option('--stride-concurrency <N>', 'Maximum number of pending getBlock batch calls', positiveInt, 5)
    }

    @def
    protected options(): Options {
        let options = this.program().parse().opts<Options>()
        options.endpointCapacity = options.strideConcurrency
        return options
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

    protected getPrevBlockHash(block: Block): string {
        return block.block.previousBlockhash
    }

    @def
    private getDataSource(): RpcDataSource {
        return new RpcDataSource({
            rpc: this.rpc(),
            headPollInterval: 10_000,
            strideSize: this.options().strideSize,
            strideConcurrency: this.options().strideConcurrency
        })
    }

    protected async* getBlocks(range: Range): AsyncIterable<Block[]> {
        let batches = this.getDataSource().getFinalizedBlocks([{
            range,
            request: {
                rewards: true,
                transactions: true
            }
        }])
        for await (let batch of batches) {
            yield batch.blocks
        }
    }

    protected getFinalizedHeight(): Promise<number> {
        return this.getDataSource().getFinalizedHeight()
    }
}
