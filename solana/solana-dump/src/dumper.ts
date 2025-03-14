import {Block, ingestFinalizedBlocks, Rpc} from '@subsquid/solana-rpc'
import {def} from '@subsquid/util-internal'
import {Command, Dumper, DumperOptions, positiveInt, Range, removeOption} from '@subsquid/util-internal-dump-cli'
import assert from 'assert'


interface Options extends DumperOptions {
    strideConcurrency: number
    strideSize: number
}


export class SolanaDumper extends Dumper<Block, Options> {
    protected setUpProgram(program: Command): void {
        program.description('Data archiving tool for Solana')
        removeOption(program, 'endpointMaxBatchCallSize')
        removeOption(program, 'endpointCapacity')
        program.option('--stride-size <N>', 'Maximum size of getBlock batch call', positiveInt, 5)
        program.option('--stride-concurrency <N>', 'Maximum number of pending getBlock batch calls', positiveInt, 5)
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

    protected getPrevBlockHash(block: Block): string {
        return block.block.previousBlockhash
    }

    @def
    private solanaRpc(): Rpc {
        return new Rpc(this.rpc())
    }

    protected async* getBlocks(range: Range): AsyncIterable<Block[]> {
        let blockStream = ingestFinalizedBlocks({
            rpc: this.solanaRpc(),
            requests: [{
                range,
                request: {
                    rewards: true,
                    transactions: true
                }
            }],
            headPollInterval: 10_000,
            strideSize: this.options().strideSize,
            strideConcurrency: this.options().strideConcurrency,
            concurrentFetchThreshold: 100
        })

        let prev: Block | undefined

        for await (let batch of blockStream) {
            for (let block of batch) {
                if (prev) {
                    assert(block.block.parentSlot === prev.slot)
                    assert(block.block.previousBlockhash === prev.block.blockhash)
                    assert(block.height === prev.height + 1)
                }
                prev = block
                checkLogMessages(block)
            }
            yield batch
        }
    }

    protected getFinalizedHeight(): Promise<number> {
        return this.solanaRpc().getFinalizedHeight()
    }
}


function checkLogMessages(block: Block): void {
    // Seems there were issues with logging during the ancient times
    if (block.height < 130000000) return

    for (let tx of block.block.transactions!) {
        if (tx.meta.logMessages == null) {
            throw new Error(`Log message recording was not enabled for transaction ${tx.transaction.signatures[0]} at slot ${block.slot}`)
        }
    }
}
