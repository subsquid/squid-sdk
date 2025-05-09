import {BlockData, HttpApi, HttpDataSource, TronHttpClient} from '@subsquid/tron-data'
import {def} from '@subsquid/util-internal'
import {Command, Dumper, DumperOptions, positiveInt, Range, removeOption} from '@subsquid/util-internal-dump-cli'


interface Options extends DumperOptions {
    strideConcurrency: number
    strideSize: number
}


export class TronDumper extends Dumper<BlockData, Options> {
    protected setUpProgram(program: Command): void {
        program.description('Data archiving tool for Tron')
        removeOption(program, 'endpointMaxBatchCallSize')
        removeOption(program, 'endpointCapacity')
        program.option('--stride-size <N>', 'Maximum size of concurrent block requests in a stride', positiveInt, 10)
        program.option('--stride-concurrency <N>', 'Maximum number of pending strides', positiveInt, 2)
    }

    protected getLoggingNamespace(): string {
        return 'sqd:tron-dump'
    }

    protected getPrevBlockHash(block: BlockData): string {
        return block.block.block_header.raw_data.parentHash
    }

    protected getBlockTimestamp(block: BlockData): number {
        return block.block.block_header.raw_data.timestamp ?? 0
    }

    @def
    httpApi(): HttpApi {
        let client = new TronHttpClient({
            baseUrl: this.options().endpoint,
            retryAttempts: Number.MAX_SAFE_INTEGER
        })
        return new HttpApi(client)
    }

    @def
    private getDataSource(): HttpDataSource {
        return new HttpDataSource({
            httpApi: this.httpApi(),
            headPollInterval: 10_000,
            strideSize: this.options().strideSize,
            strideConcurrency: this.options().strideConcurrency,
        })
    }

    protected async* getBlocks(range: Range): AsyncIterable<BlockData[]> {
        let blockStream = this.getDataSource().getFinalizedBlocks([{
            range,
            request: {
                transactions: true,
                transactionsInfo: true
            }
        }])
        for await (let batch of blockStream) {
            yield batch.blocks
        }
    }

    protected getFinalizedHeight(): Promise<number> {
        return this.getDataSource().getFinalizedHeight()
    }
}
