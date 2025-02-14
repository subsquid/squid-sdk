import {Block, SolanaRpcDataSource, Rpc} from '@subsquid/solana-rpc'
import {assertNotNull, def} from '@subsquid/util-internal'
import {Command, Dumper, DumperOptions, positiveInt, Range, removeOption} from '@subsquid/util-internal-dump-cli'
import assert from 'assert'


interface BlockData extends Block {
    hash: string
    height: number
}


interface Options extends DumperOptions {
    strideConcurrency: number
    strideSize: number
}


export class SolanaDumper extends Dumper<BlockData, Options> {
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

    @def
    private dataSource(): SolanaRpcDataSource {
        return new SolanaRpcDataSource({
            rpc: this.solanaRpc(),
            req: {
                rewards: true,
                transactions: true
            },
            strideSize: this.options().strideSize,
            strideConcurrency: this.options().strideConcurrency
        })
    }

    protected async* getBlocks(range: Range): AsyncIterable<BlockData[]> {
        let blockStream = this.dataSource().getFinalizedStream({
            from: range.from,
            to: range.to
        })

        let prev: Block | undefined

        for await (let batch of blockStream) {
            for (let block of batch.blocks) {
                if (prev) {
                    let blockHeight = assertNotNull(block.block.blockHeight)
                    let prevBlockHeight = assertNotNull(prev.block.blockHeight)
                    assert(blockHeight === prevBlockHeight + 1)
                    assert(block.block.parentSlot === prev.slot)
                    assert(block.block.previousBlockhash === prev.block.blockhash)
                }
                prev = block
                checkLogMessages(block)
            }
            yield batch.blocks.map(b => {
                return {
                    ...b,
                    hash: b.block.blockhash,
                    height: b.slot,
                }
            })
        }
    }

    protected async getFinalizedHeight(): Promise<number> {
        let head = await this.dataSource().getFinalizedHead()
        return head.number
    }
}


function checkLogMessages(block: Block): void {
    // Seems there were issues with logging during the ancient times
    if (block.slot < 130000000) return

    for (let tx of block.block.transactions!) {
        if (tx.meta.logMessages == null) {
            throw new Error(`Log message recording was not enabled for transaction ${tx.transaction.signatures[0]} at slot ${block.slot}`)
        }
    }
}
