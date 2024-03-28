import {Block, RpcDataSource} from '@subsquid/solana-data/lib/rpc'
import {def} from '@subsquid/util-internal'
import {
    Command,
    Dumper,
    DumperOptions,
    ErrorMessage,
    positiveInt,
    Range,
    removeOption
} from '@subsquid/util-internal-dump-cli'


interface Options extends DumperOptions {
    strideConcurrency: number
    strideSize: number
    slotTip?: string[]
}


export class SolanaDumper extends Dumper<Block, Options> {
    protected setUpProgram(program: Command): void {
        program.description('Data archiving tool for Solana')
        removeOption(program, 'endpointMaxBatchCallSize')
        removeOption(program, 'endpointCapacity')
        program.option('--slot-tip <BLOCK:SLOT...>', 'BLOCK:SLOT pair to help to locate required blocks')
        program.option('--stride-size <N>', 'Maximum size of getBlock batch call', positiveInt, 10)
        program.option('--stride-concurrency <N>', 'Maximum number of pending getBlock batch calls', positiveInt, 5)
    }

    @def
    protected options(): Options {
        let options = this.program().parse().opts<Options>()
        options.endpointCapacity = options.strideConcurrency + 5
        return options
    }

    private getSlotTips(): {height: number, slot: number}[] {
        return this.options().slotTip?.map(tip => {
            let m = /^(\d+):(\d+)$/.exec(tip)
            if (!m) throw new ErrorMessage(`invalid slot tip: ${tip}`)
            return {
                height: parseInt(m[1]),
                slot: parseInt(m[2])
            }
        }) ?? []
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
    private getDataSource(): RpcDataSource {
        let src = new RpcDataSource({
            rpc: this.rpc(),
            headPollInterval: 10_000,
            strideSize: this.options().strideSize,
            strideConcurrency: this.options().strideConcurrency
        })
        this.getSlotTips().forEach(tip => src.addSlotTip(tip))
        return src
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
            for (let b of batch.blocks) {
                checkLogMessages(b)
            }
            yield batch.blocks
        }
    }

    protected getFinalizedHeight(): Promise<number> {
        return this.getDataSource().getFinalizedHeight()
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
