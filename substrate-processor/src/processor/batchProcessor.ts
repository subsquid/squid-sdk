import {createLogger, Logger} from "@subsquid/logger"
import {getOldTypesBundle, OldTypesBundle, readOldTypesBundle} from "@subsquid/substrate-metadata"
import {last, runProgram} from "@subsquid/util-internal"
import assert from "assert"
import {applyRangeBound, Batch, mergeBatches} from "../batch/generic"
import {PlainBatchRequest} from "../batch/request"
import {Chain} from "../chain"
import {BlockData} from "../ingest"
import type {BlockRangeOption, EvmLogOptions} from "../interfaces/dataHandlers"
import type {
    CallDataRequest,
    CallItem,
    DataSelection,
    EventDataRequest,
    EventItem,
    MayBeDataSelection,
    NoDataSelection
} from "../interfaces/dataSelection"
import type {Database} from "../interfaces/db"
import type {SubstrateBlock} from "../interfaces/substrate"
import {Range} from "../util/range"
import {DataSource} from "./handlerProcessor"
import {Config, Options, Runner} from "./runner"


/**
 * A helper to get the resulting type of block item
 *
 * @example
 * const processor = new SubstrateBatchProcessor()
 *  .addEvent('Balances.Transfer')
 *  .addEvent('Balances.Deposit')
 *
 * type BlockItem = BatchProcessorItem<typeof processor>
 */
export type BatchProcessorItem<T> = T extends SubstrateBatchProcessor<infer I> ? I : never
export type BatchProcessorEventItem<T> = Extract<BatchProcessorItem<T>, {kind: 'event'}>
export type BatchProcessorCallItem<T> = Extract<BatchProcessorItem<T>, {kind: 'call'}>


export interface BatchContext<Store, Item> {
    /**
     * Not yet public description of chain metadata
     * @internal
     */
    _chain: Chain
    log: Logger
    store: Store
    blocks: BatchBlock<Item>[]
}


export interface BatchBlock<Item> {
    /**
     * Block header
     */
    header: SubstrateBlock
    /**
     * A unified log of events and calls.
     *
     * All events deposited within a call are placed
     * before the call. All child calls are placed before the parent call.
     * List of block events is a subsequence of unified log.
     */
    items: Item[]
}


/**
 * Provides methods to configure and launch data processing.
 *
 * Unlike {@link SubstrateProcessor}, `SubstrateBatchProcessor` can have
 * only one data handler, which accepts a list of blocks.
 *
 * This gives mapping developers an opportunity to reduce the number of round-trips
 * both to database and chain nodes,
 * thus providing much better performance.
 *
 * All configuration methods return a new processor instance.
 */
export class SubstrateBatchProcessor<Item = EventItem<'*'> | CallItem<"*">> {
    private batches: Batch<PlainBatchRequest>[] = []
    private options: Options = {}
    private src?: DataSource
    private typesBundle?: OldTypesBundle

    private copy(): SubstrateBatchProcessor<Item> {
        let copy = new SubstrateBatchProcessor<Item>()
        copy.batches = this.batches
        copy.options = this.options
        copy.src = this.src
        copy.typesBundle = this.typesBundle
        return copy
    }

    private setOption<K extends keyof Options>(name: K, value: Options[K]): SubstrateBatchProcessor<Item> {
        let next = this.copy()
        next.options = {...this.options, [name]: value}
        return next
    }

    private add(request: PlainBatchRequest, range?: Range): SubstrateBatchProcessor<any> {
        let batch = {range: range || {from: 0}, request}
        let next = this.copy()
        next.batches = this.batches.concat([batch])
        return next
    }

    /**
     * Request the processor to fetch events of a given name.
     *
     * @example
     * // print all transfers
     * process.addEvent('Balances.Transfer').run(db, async ctx => {
     *     for (let block of ctx.blocks) {
     *         for (let item of block.items) {
     *             if (item.name == 'Balances.Transfer') {
     *                 console.log(item.event.id)
     *             }
     *         }
     *     }
     * })
     *
     * // same as above, but restrict the set of fetched fields
     * process.addEvent('Balances.Transfer', {data: {event: {}}}).run(db, async ctx => {
     *     for (let block of ctx.blocks) {
     *         for (let item of block.items) {
     *             if (item.name == 'Balances.Transfer') {
     *                 console.log(item.event.id)
     *             }
     *         }
     *     }
     * })
     *
     * // print transfers from blocks 0..1000
     * process.addEvent('Balances.Transfer', {range: {from: 0, to: 1000}}).run(db, async ctx => {
     *     for (let block of ctx.blocks) {
     *         if (block.header.height > 1000) return
     *         for (let item of block.items) {
     *             if (item.name == 'Balances.Transfer') {
     *                 console.log(item.event.id)
     *             }
     *         }
     *     }
     * })
     *
     * // print all events
     * process.addEvent('*').run(db, async ctx => {
     *     for (let block of ctx.blocks) {
     *         for (let item of block.items) {
     *             if (item.kind == 'event') {
     *                 console.log(item.event.id)
     *             }
     *         }
     *     }
     * })
     */
    addEvent<N extends string>(
        name: N,
        options?: BlockRangeOption & NoDataSelection
    ): SubstrateBatchProcessor<Item | EventItem<N, true>>

    addEvent<N extends string, R extends EventDataRequest>(
        name: N,
        options: BlockRangeOption & DataSelection<R>
    ): SubstrateBatchProcessor<Item | EventItem<N, R>>

    addEvent(
        name: string,
        options?: BlockRangeOption & MayBeDataSelection<EventDataRequest>
    ): SubstrateBatchProcessor<any> {
        let req = new PlainBatchRequest()
        req.events.push({name, data: options?.data})
        return this.add(req, options?.range)
    }

    /**
     * Request the processor to fetch calls of a given name.
     *
     * @example
     * // print successful `Balances.transfer` calls
     * process.addCall('Balances.transfer').run(db, async ctx => {
     *     for (let block of ctx.blocks) {
     *         for (let item of block.items) {
     *             if (item.name == 'Balances.transfer' && item.call.successful) {
     *                 console.log(item.call.id)
     *             }
     *         }
     *     }
     * })
     *
     * // same as above, but restrict the set of fetched fields
     * process.addCall('Balances.Transfer', {data: {call: {successful: true}}}).run(db, async ctx => {
     *     for (let block of ctx.blocks) {
     *         for (let item of block.items) {
     *             if (item.name == 'Balances.transfer' && item.call.successful) {
     *                 console.log(item.call.id)
     *             }
     *         }
     *     }
     * })
     *
     * // print transfers from blocks 0..1000
     * process.addCall('Balances.transfer', {range: {from: 0, to: 1000}}).run(db, async ctx => {
     *     for (let block of ctx.blocks) {
     *         if (block.header.height > 1000) return
     *         for (let item of block.items) {
     *             if (item.name == 'Balances.transfer') {
     *                 console.log(item.call.id)
     *             }
     *         }
     *     }
     * })
     *
     * // print all calls
     * process.addCall('*').run(db, async ctx => {
     *     for (let block of ctx.blocks) {
     *         for (let item of block.items) {
     *             if (item.kind == 'call') {
     *                 console.log(item.call.id)
     *             }
     *         }
     *     }
     * })
     */
    addCall<N extends string>(
        name: N,
        options?: BlockRangeOption & NoDataSelection
    ): SubstrateBatchProcessor<Item | CallItem<N, true>>

    addCall<N extends string, R extends CallDataRequest>(
        name: N,
        options: BlockRangeOption & DataSelection<R>
    ): SubstrateBatchProcessor<Item | CallItem<N, R>>

    addCall<N extends string, R extends CallDataRequest>(
        name: N,
        options?: BlockRangeOption & MayBeDataSelection<CallDataRequest>
    ): SubstrateBatchProcessor<any> {
        let req = new PlainBatchRequest()
        req.calls.push({name, data: options?.data})
        return this.add(req, options?.range)
    }

    /**
     * Similar to {@link .addEvent},
     * but requests `EVM.Log` events belonging to particular contract
     * with an option to filter them by topic.
     *
     * @example
     * // request ERC721 transfers from Moonsama contract
     * processor.addEvmLog('0xb654611f84a8dc429ba3cb4fda9fad236c505a1a', {
     *     topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef']
     * })
     */
    addEvmLog(
        contractAddress: string,
        options?: EvmLogOptions & NoDataSelection
    ): SubstrateBatchProcessor<Item | EventItem<"EVM.Log", true>>

    addEvmLog<R extends EventDataRequest>(
        contractAddress: string,
        options: EvmLogOptions & DataSelection<R>
    ): SubstrateBatchProcessor<Item | EventItem<"EVM.Log", R>>

    addEvmLog(
        contractAddress: string,
        options?: EvmLogOptions & MayBeDataSelection<EventDataRequest>
    ): SubstrateBatchProcessor<any> {
        let req = new PlainBatchRequest()
        req.evmLogs.push({
            contract: contractAddress,
            filter: options?.filter,
            data: options?.data
        })
        return this.add(req, options?.range)
    }

    /**
     * Similar to {@link .addEvent},
     * but requests `Contracts.ContractEmitted` events belonging to particular contract.
     */
    addContractsContractEmitted(
        contractAddress: string,
        options?: BlockRangeOption & NoDataSelection
    ): SubstrateBatchProcessor<Item | EventItem<"Contracts.ContractEmitted", true>>

    addContractsContractEmitted<R extends EventDataRequest>(
        contractAddress: string,
        options: BlockRangeOption & DataSelection<R>
    ): SubstrateBatchProcessor<Item | EventItem<"Contracts.ContractEmitted", R>>

    addContractsContractEmitted(
        contractAddress: string,
        options?: BlockRangeOption & MayBeDataSelection<EventDataRequest>
    ): SubstrateBatchProcessor<any> {
        let req = new PlainBatchRequest()
        req.contractsEvents.push({
            contract: contractAddress,
            data: options?.data
        })
        return this.add(req, options?.range)
    }

    /**
     * By default, the processor will fetch only blocks
     * which contain requested items. This method
     * modifies such behaviour to fetch all chain blocks.
     *
     * Optionally a range of blocks can be specified
     * for which the setting should be effective.
     */
    includeAllBlocks(range?: Range): SubstrateBatchProcessor<Item> {
        let req = new PlainBatchRequest()
        req.includeAllBlocks = true
        return this.add(req)
    }

    /**
     * Sets the port for a built-in prometheus metrics server.
     *
     * By default, the value of `PROMETHEUS_PORT` environment
     * variable is used. When it is not set,
     * the processor will pick up an ephemeral port.
     */
    setPrometheusPort(port: number | string): SubstrateBatchProcessor<Item> {
        return this.setOption('prometheusPort', port)
    }

    /**
     * Limits the range of blocks to be processed.
     *
     * When the upper bound is specified,
     * the processor will terminate with exit code 0 once it reaches it.
     */
    setBlockRange(range?: Range): SubstrateBatchProcessor<Item> {
        return this.setOption('blockRange', range)
    }

    /**
     * Sets the maximum number of blocks which can be fetched
     * from the data source in a single request.
     *
     * The default is 100.
     */
    setBatchSize(size: number): SubstrateBatchProcessor<Item> {
        assert(size > 0)
        return this.setOption('batchSize', size)
    }

    /**
     * Sets blockchain data source.
     *
     * @example
     * processor.setDataSource({
     *     chain: 'wss://rpc.polkadot.io',
     *     archive: 'https://polkadot.archive.subsquid.io/graphql'
     * })
     */
    setDataSource(src: DataSource): SubstrateBatchProcessor<Item> {
        let next = this.copy()
        next.src = src
        return next
    }

    /**
     * Sets types bundle.
     *
     * Types bundle is only required for blocks which have
     * metadata version below 14 and only if we don't have built-in
     * support for the chain in question.
     *
     * Don't confuse this setting with types bundle from polkadot.js.
     * Although those two are similar in purpose and structure,
     * they are not compatible.
     *
     * Types bundle can be specified in 3 different ways:
     *
     * 1. as a name of a known chain
     * 2. as a name of a JSON file structured as {@link OldTypesBundle}
     * 3. as an {@link OldTypesBundle} object
     *
     * @example
     * // known chain
     * processor.setTypesBundle('kusama')
     *
     * // A path to a JSON file resolved relative to `cwd`.
     * processor.setTypesBundle('typesBundle.json')
     *
     * // OldTypesBundle object
     * processor.setTypesBundle({
     *     types: {
     *         Foo: 'u8'
     *     }
     * })
     */
    setTypesBundle(bundle: string | OldTypesBundle): SubstrateBatchProcessor<Item> {
        let next = this.copy()
        if (typeof bundle == 'string') {
            next.typesBundle = getOldTypesBundle(bundle) || readOldTypesBundle(bundle)
        } else {
            next.typesBundle = bundle
        }
        return next
    }

    private getTypesBundle(specName: string, specVersion: number): OldTypesBundle {
        let bundle = this.typesBundle || getOldTypesBundle(specName)
        if (bundle) return bundle
        throw new Error(`Types bundle is required for ${specName}@${specVersion}. Provide it via .setTypesBundle()`)
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
    run<Store>(db: Database<Store>, handler: (ctx: BatchContext<Store, Item>) => Promise<void>): void {
        let logger = createLogger('sqd:processor')

        runProgram(async () => {
            let batches = mergeBatches(this.batches, (a, b) => a.merge(b))

            let config: Config<Store, PlainBatchRequest> = {
                getDatabase: () => db,
                getArchiveEndpoint: () => this.getArchiveEndpoint(),
                getChainEndpoint: () => this.getChainEndpoint(),
                getTypesBundle: this.getTypesBundle.bind(this),
                getLogger: () => logger,
                getOptions: () => this.options,
                createBatches(blockRange: Range): Batch<PlainBatchRequest>[] {
                    return applyRangeBound(batches, blockRange)
                }
            }

            let runner = new Runner(config)

            runner.processBatch = async function(request: PlainBatchRequest, chain: Chain, blocks: BlockData[]) {
                if (blocks.length == 0) return
                let from = blocks[0].header.height
                let to = last(blocks).header.height
                return db.transact(from, to, store => {
                    return handler({
                        _chain: chain,
                        log: logger.child('mapping'),
                        store,
                        blocks: blocks as any,
                    })
                })
            }

            return runner.run()
        }, err => logger.fatal(err))
    }
}
