import {Logger, createLogger} from '@subsquid/logger'
import {def, runProgram} from '@subsquid/util-internal'
import {Database} from '@subsquid/util-internal-processor-tools'
import {BatchHandlerContext, LogOptions, TransactionOptions} from './interfaces/dataHandlers'
import {
    AddLogItem,
    AddTransactionItem,
    DataSelection,
    LogDataRequest,
    LogItem,
    MayBeDataSelection,
    NoDataSelection,
    TransactionDataRequest,
    TransactionItem,
} from './interfaces/dataSelection'


export interface DataSource {
    /**
     * Subsquid substrate archive endpoint URL
     */
    archive: string
    /**
     * Chain node RPC endpoint URL
     */
    chain?: string
}

/**
 * A helper to get the resulting type of block item
 */
export type BatchProcessorItem<T> = T extends EvmBatchProcessor<infer I> ? I : never
export type BatchProcessorLogItem<T> = Extract<BatchProcessorItem<T>, {kind: 'evmLog'}>
export type BatchProcessorTransactionItem<T> = Extract<BatchProcessorItem<T>, {kind: 'transaction'}>


/**
 * Provides methods to configure and launch data processing.
 */
export class EvmBatchProcessor<Item extends {kind: string; address: string} = LogItem | TransactionItem> {
    private batches: Batch<PlainBatchRequest>[] = []
    private options: any = {}
    private src?: DataSource
    private running = false

    private add(request: PlainBatchRequest, range?: Range): void {
        this.batches.push({
            range: range || {from: 0},
            request,
        })
    }

    addLog<A extends string | ReadonlyArray<string>>(
        contractAddress: A,
        options?: LogOptions & NoDataSelection
    ): EvmBatchProcessor<AddLogItem<Item, LogItem>>

    addLog<R extends LogDataRequest>(
        contractAddress: string | string[],
        options: LogOptions & DataSelection<R>
    ): EvmBatchProcessor<AddLogItem<Item, LogItem<R>>>

    addLog(
        contractAddress: string | string[],
        options?: LogOptions & MayBeDataSelection<LogDataRequest>
    ): EvmBatchProcessor<any> {
        this.assertNotRunning()
        let req = new PlainBatchRequest()
        if (!contractAddress || contractAddress === '*') contractAddress = []
        req.logs.push({
            address: Array.isArray(contractAddress) ? contractAddress : [contractAddress],
            topics: options?.filter,
            data: options?.data,
        })
        this.add(req, options?.range)
        return this
    }

    addTransaction<A extends string | ReadonlyArray<string>>(
        contractAddress: A,
        options?: TransactionOptions & NoDataSelection
    ): EvmBatchProcessor<AddTransactionItem<Item, TransactionItem>>

    addTransaction<R extends TransactionDataRequest>(
        contractAddress: string | string[],
        options: TransactionOptions & DataSelection<R>
    ): EvmBatchProcessor<AddTransactionItem<Item, TransactionItem<R>>>

    addTransaction(
        contractAddress: string | string[],
        options?: TransactionOptions & MayBeDataSelection<TransactionDataRequest>
    ): EvmBatchProcessor<any> {
        this.assertNotRunning()
        let req = new PlainBatchRequest()
        req.transactions.push({
            address: Array.isArray(contractAddress) ? contractAddress : [contractAddress],
            sighash: options?.sighash == null || Array.isArray(options?.sighash) ? options?.sighash : [options.sighash],
            data: options?.data,
        })
        this.add(req, options?.range)
        return this
    }

    /**
     * Sets the port for a built-in prometheus metrics server.
     *
     * By default, the value of `PROMETHEUS_PORT` environment
     * variable is used. When it is not set,
     * the processor will pick up an ephemeral port.
     */
    setPrometheusPort(port: number | string): this {
        this.assertNotRunning()
        this.options.prometheusPort = port
        return this
    }

    /**
     * By default, the processor will fetch only blocks
     * which contain requested items. This method
     * modifies such behaviour to fetch all chain blocks.
     *
     * Optionally a range of blocks can be specified
     * for which the setting should be effective.
     */
    includeAllBlocks(range?: Range): this {
        this.assertNotRunning()
        let req = new PlainBatchRequest()
        req.includeAllBlocks = true
        this.add(req)
        return this
    }

    /**
     * Limits the range of blocks to be processed.
     *
     * When the upper bound is specified,
     * the processor will terminate with exit code 0 once it reaches it.
     */
    setBlockRange(range?: Range): this {
        this.assertNotRunning()
        this.options.blockRange = range
        return this
    }

    /**
     * Sets blockchain data source.
     *
     * @example
     * processor.setDataSource({
     *     chain: 'wss://rpc.polkadot.io',
     *     archive: 'https://eth.archive.subsquid.io'
     * })
     */
    setDataSource(src: DataSource): this {
        this.assertNotRunning()
        this.src = src
        return this
    }

    private assertNotRunning(): void {
        if (this.running) {
            throw new Error('Settings modifications are not allowed after start of processing')
        }
    }

    private getArchiveEndpoint(): string {
        let url = this.src?.archive
        if (url == null) {
            throw new Error('use .setDataSource() to specify archive url')
        }
        return url
    }

    private getChainEndpoint(): string {
        let url = this.src?.chain
        if (url == null) {
            throw new Error(`use .setDataSource() to specify chain RPC endpoint`)
        }
        return url
    }

    @def
    private getLogger(): Logger {
        return createLogger('sqd:processor')
    }

    /**
     * Run data processing.
     *
     * This method assumes full control over the current OS process as
     * it terminates the entire program in case of error or
     * at the end of data processing.
     *
     * @param db - database is responsible for providing storage to data handlers
     * and persisting mapping progress and status.
     *
     * @param handler - The data handler, see {@link BatchContext} for an API available to the handler.
     */
    run<Store>(db: Database<Store>, handler: (ctx: BatchHandlerContext<Store, Item>) => Promise<void>): void {
        this.running = true
        runProgram(async () => {

        }, err => this.getLogger().fatal(err))
    }
}
