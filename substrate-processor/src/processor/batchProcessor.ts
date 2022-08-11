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
    AddCallItem,
    AddEventItem,
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
 */
export class SubstrateBatchProcessor<Item extends {kind: string, name: string} = EventItem<'*'> | CallItem<"*">> {
    private batches: Batch<PlainBatchRequest>[] = []
    private options: Options = {}
    private src?: DataSource
    private typesBundle?: OldTypesBundle
    private running = false

    private add(request: PlainBatchRequest, range?: Range): void {
        this.batches.push({
            range: range || {from: 0},
            request
        })
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
    ): SubstrateBatchProcessor<AddEventItem<Item, EventItem<N, true>>>

    addEvent<N extends string, R extends EventDataRequest>(
        name: N,
        options: BlockRangeOption & DataSelection<R>
    ): SubstrateBatchProcessor<AddEventItem<Item, EventItem<N, R>>>

    addEvent(
        name: string,
        options?: BlockRangeOption & MayBeDataSelection<EventDataRequest>
    ): SubstrateBatchProcessor<any> {
        this.assertNotRunning()
        let req = new PlainBatchRequest()
        req.events.push({name, data: options?.data})
        this.add(req, options?.range)
        return this
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
    ): SubstrateBatchProcessor<AddCallItem<Item, CallItem<N, true>>>

    addCall<N extends string, R extends CallDataRequest>(
        name: N,
        options: BlockRangeOption & DataSelection<R>
    ): SubstrateBatchProcessor<AddCallItem<Item, CallItem<N, R>>>

    addCall<N extends string, R extends CallDataRequest>(
        name: N,
        options?: BlockRangeOption & MayBeDataSelection<CallDataRequest>
    ): SubstrateBatchProcessor<any> {
        this.assertNotRunning()
        let req = new PlainBatchRequest()
        req.calls.push({name, data: options?.data})
        this.add(req, options?.range)
        return this
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
    ): SubstrateBatchProcessor<AddEventItem<Item, EventItem<"EVM.Log", true>>>

    addEvmLog<R extends EventDataRequest>(
        contractAddress: string,
        options: EvmLogOptions & DataSelection<R>
    ): SubstrateBatchProcessor<AddEventItem<Item, EventItem<"EVM.Log", R>>>

    addEvmLog(
        contractAddress: string,
        options?: EvmLogOptions & MayBeDataSelection<EventDataRequest>
    ): SubstrateBatchProcessor<any> {
        this.assertNotRunning()
        let req = new PlainBatchRequest()
        req.evmLogs.push({
            contract: contractAddress.toLowerCase(),
            filter: options?.filter,
            data: options?.data
        })
        this.add(req, options?.range)
        return this
    }

    addEthereumTransaction(
        contractAddress: string,
        options?: BlockRangeOption & NoDataSelection
    ): SubstrateBatchProcessor<AddCallItem<Item, CallItem<"Ethereum.transact", true>>>

    addEthereumTransaction<R extends CallDataRequest>(
        contractAddress: string,
        options: BlockRangeOption & DataSelection<R>
    ): SubstrateBatchProcessor<AddCallItem<Item, CallItem<"Ethereum.transact", R>>>

    addEthereumTransaction(
        contractAddress: string,
        options?: BlockRangeOption & MayBeDataSelection<CallDataRequest>
    ): SubstrateBatchProcessor<any> {
        this.assertNotRunning()
        let req = new PlainBatchRequest()
        req.ethereumTransactions.push({
            contract: contractAddress.toLowerCase(),
            data: options?.data
        })
        this.add(req, options?.range)
        return this
    }

    /**
     * Similar to {@link .addEvent},
     * but requests `Contracts.ContractEmitted` events belonging to particular contract.
     */
    addContractsContractEmitted(
        contractAddress: string,
        options?: BlockRangeOption & NoDataSelection
    ): SubstrateBatchProcessor<AddEventItem<Item, EventItem<"Contracts.ContractEmitted", true>>>

    addContractsContractEmitted<R extends EventDataRequest>(
        contractAddress: string,
        options: BlockRangeOption & DataSelection<R>
    ): SubstrateBatchProcessor<AddEventItem<Item, EventItem<"Contracts.ContractEmitted", R>>>

    addContractsContractEmitted(
        contractAddress: string,
        options?: BlockRangeOption & MayBeDataSelection<EventDataRequest>
    ): SubstrateBatchProcessor<any> {
        this.assertNotRunning()
        let req = new PlainBatchRequest()
        req.contractsEvents.push({
            contract: contractAddress.toLowerCase(),
            data: options?.data
        })
        this.add(req, options?.range)
        return this
    }

    /**
     * Similar to {@link .addEvent},
     * but requests `Gear.MessageEnqueued` events belonging to particular program.
     */
    addGearMessageEnqueued(
        programId: string,
        options?: BlockRangeOption & NoDataSelection
    ): SubstrateBatchProcessor<AddEventItem<Item, EventItem<"Gear.MessageEnqueued", true>>>

    addGearMessageEnqueued<R extends EventDataRequest>(
        programId: string,
        options: BlockRangeOption & DataSelection<R>
    ): SubstrateBatchProcessor<AddEventItem<Item, EventItem<"Gear.MessageEnqueued", R>>>

    addGearMessageEnqueued(
        programId: string,
        options?: BlockRangeOption & MayBeDataSelection<EventDataRequest>
    ): SubstrateBatchProcessor<any> {
        this.assertNotRunning()
        let req = new PlainBatchRequest()
        req.gearMessagesEnqueued.push({
            program: programId,
            data: options?.data
        })
        this.add(req, options?.range)
        return this
    }

    /**
     * Similar to {@link .addEvent},
     * but requests `Gear.UserMessageSent` events belonging to particular program.
     */
    addGearUserMessageSent(
        programId: string,
        options?: BlockRangeOption & NoDataSelection
    ): SubstrateBatchProcessor<AddEventItem<Item, EventItem<"Gear.UserMessageSent", true>>>

    addGearUserMessageSent<R extends EventDataRequest>(
        programId: string,
        options: BlockRangeOption & DataSelection<R>
    ): SubstrateBatchProcessor<AddEventItem<Item, EventItem<"Gear.UserMessageSent", R>>>

    addGearUserMessageSent(
        programId: string,
        options?: BlockRangeOption & MayBeDataSelection<EventDataRequest>
    ): SubstrateBatchProcessor<any> {
        this.assertNotRunning()
        let req = new PlainBatchRequest()
        req.gearUserMessagesSent.push({
            program: programId,
            data: options?.data
        })
        this.add(req, options?.range)
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
     * Sets the maximum number of blocks which can be fetched
     * from the data source in a single request.
     *
     * The default is 100.
     */
    setBatchSize(size: number): this {
        assert(size > 0)
        this.assertNotRunning()
        this.options.batchSize = size
        return this
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
    setDataSource(src: DataSource): this {
        this.assertNotRunning()
        this.src = src
        return this
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
    setTypesBundle(bundle: string | OldTypesBundle): this {
        this.assertNotRunning()
        if (typeof bundle == 'string') {
            this.typesBundle = getOldTypesBundle(bundle) || readOldTypesBundle(bundle)
        } else {
            this.typesBundle = bundle
        }
        return this
    }

    private assertNotRunning(): void {
        if (this.running) {
            throw new Error('Settings modifications are not allowed after start of processing')
        }
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
        this.running = true
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
