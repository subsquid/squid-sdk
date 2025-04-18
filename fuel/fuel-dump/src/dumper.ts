import {BlockData} from '@subsquid/fuel-data/lib/raw-data'
import {HttpDataSource} from '@subsquid/fuel-data/lib/data-source'
import {def} from '@subsquid/util-internal'
import {HttpClient} from '@subsquid/http-client'
import {Command, Dumper, DumperOptions, positiveInt, Range, removeOption} from '@subsquid/util-internal-dump-cli'


interface Options extends DumperOptions {
    strideConcurrency: number
    strideSize: number
}


export class FuelDumper extends Dumper<BlockData, Options> {
    protected setUpProgram(program: Command): void {
        program.description('Data archiving tool for Fuel')
        removeOption(program, 'endpointMaxBatchCallSize')
        removeOption(program, 'endpointCapacity')
        program.option('--stride-size <N>', 'Maximum size of getBlock batch call', positiveInt, 10)
        program.option('--stride-concurrency <N>', 'Maximum number of pending getBlock batch calls', positiveInt, 5)
    }

    protected getLoggingNamespace(): string {
        return 'sqd:fuel-dump'
    }

    protected getPrevBlockHash(block: BlockData): string {
        return block.block.header.prevRoot
    }

    protected getBlockTimestamp(block: BlockData): number {
        const TAI64_UNIX_OFFSET = BigInt("4611686018427387914");
        const taiTimestamp = BigInt(block.block.header.time);
        const unixTimeMs = taiTimestamp - TAI64_UNIX_OFFSET;
        return Number(unixTimeMs);
    }

    protected async getLatestBlock(): Promise<BlockData> {
        const height = await this.getDataSource().getFinalizedHeight();
        const batches = this.getDataSource().getFinalizedBlocks([{
            range: { from: height, to: height },
            request: {
                transactions: true,
                inputs: true,
                outputs: true,
                receipts: true
            }
        }]);
        for await (const batch of batches) {
            if (batch.blocks.length > 0) {
                return batch.blocks[0];
            }
        }
        
        throw new Error(`Failed to get latest block at height ${height}`);
    }

    protected validateChainContinuity(): boolean {
        return false
    }

    @def
    protected http(): HttpClient {
        return new HttpClient({
            baseUrl: this.options().endpoint
        })
    }

    @def
    private getDataSource(): HttpDataSource {
        return new HttpDataSource({
            client: this.http(),
            headPollInterval: 10_000,
            strideSize: this.options().strideSize,
            strideConcurrency: this.options().strideConcurrency,
        })
    }

    protected async* getBlocks(range: Range): AsyncIterable<BlockData[]> {
        let batches = this.getDataSource().getFinalizedBlocks([{
            range,
            request: {
                transactions: true,
                inputs: true,
                outputs: true,
                receipts: true
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
