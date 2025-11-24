import {Block as RpcBlock, RemoteRpcPool, SolanaRpcDataSource} from '@subsquid/solana-rpc'
import {addErrorContext, assertNotNull, def} from '@subsquid/util-internal'
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
    assertLogMessagesNotNull: boolean
    validateChainContinuity: boolean
}


export class SolanaDumper extends Dumper<Block, Options> {
    protected setUpProgram(program: Command): void {
        program.description('Data archiving tool for Solana')
        removeOption(program, 'endpointMaxBatchCallSize')
        removeOption(program, 'endpointCapacity')
        removeOption(program, 'rateLimit')
        program.option('--stride-size <N>', 'Maximum size of getBlock batch call', positiveInt, 5)
        program.option('--stride-concurrency <N>', 'Maximum number of pending getBlock batch calls', positiveInt, 5)
        program.option('--max-confirmation-attempts <N>', 'Maximum number of confirmation attempts', positiveInt, 10)
        program.option('--assert-log-messages-not-null', 'Check if tx.meta.logMessages is not null', true)
        program.option('--validate-chain-continuity', 'Check if block parent hash matches previous block hash', true)
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

    protected getBlockTimestamp(block: Block): number {
        return Number(block.block.blockTime) || 0
    }

    protected validateChainContinuity(): boolean {
        return this.options().validateChainContinuity
    }

    @def
    private dataSource(): SolanaRpcDataSource {
        let options = this.options()

        let rpc = new RemoteRpcPool(options.strideConcurrency, {
            url: options.endpoint,
            capacity: Number.MAX_SAFE_INTEGER,
            retryAttempts: Number.MAX_SAFE_INTEGER,
            requestTimeout: 30_000
        })

        return new SolanaRpcDataSource({
            rpc,
            req: {transactions: true, rewards: true},
            strideSize: this.options().strideSize,
            strideConcurrency: this.options().strideConcurrency,
            maxConfirmationAttempts: this.options().maxConfirmationAttempts,
            validateChainContinuity: this.options().validateChainContinuity,
        })
    }

    protected async getLastFinalizedBlockNumber(): Promise<number> {
        let head = await this.dataSource().getFinalizedHead()
        return head.number
    }

    protected async* getBlocks(range: Range): AsyncIterable<Block[]> {
        let options = this.options()

        for await (let batch of this.dataSource().getFinalizedStream(range)) {
            yield batch.blocks.map(block => {
                if (options.assertLogMessagesNotNull) {
                    let transactions = assertNotNull(block.block.transactions)
                    for (let tx of transactions) {
                        if (tx.meta.err == null && tx.meta.logMessages == null) {
                            throw addErrorContext(new Error('tx.meta.logMessages is null'), {
                                blockNumber: block.slot,
                                blockHash: block.block.blockhash,
                                transactionHash: tx.transaction.signatures[0]
                            })
                        }
                    }
                }
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
