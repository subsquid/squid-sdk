import {HttpAgent, HttpClient} from '@subsquid/http-client'
import {createLogger, Logger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {
    getOldTypesBundle,
    OldSpecsBundle,
    OldTypes,
    OldTypesBundle,
    readOldTypesBundle
} from '@subsquid/substrate-metadata'
import {getTypesFromBundle} from '@subsquid/substrate-metadata/lib/old/typesBundle'
import {
    eliminatePolkadotjsTypesBundle,
    PolkadotjsTypesBundle
} from '@subsquid/substrate-metadata/lib/old/typesBundle-polkadotjs'
import {addErrorContext, def, last, runProgram} from '@subsquid/util-internal'
import {
    applyRangeBound,
    Batch,
    Database,
    getOrGenerateSquidId,
    mergeRangeRequests,
    PrometheusServer,
    Range,
    RangeRequest,
    Runner
} from '@subsquid/util-internal-processor-tools'
import {Chain, ChainManager} from './chain'
import {SubstrateArchive} from './ds-archive/client'
import {BlockData, DataRequest} from './interfaces/data'
import {
    AddCallItem,
    AddEventItem,
    CallDataRequest,
    CallItem,
    DataSelection,
    EventDataRequest,
    EventItem,
    MayBeDataSelection,
    NoDataSelection
} from './interfaces/data-selection'
import {AcalaEvmExecutedOptions, BlockRangeOption, DataSource, EvmLogOptions} from './interfaces/options'
import {mergeDataRequests} from './util/data-request-merge'


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


export interface DataHandlerContext<Store, Item> {
    /**
     * Not yet public description of chain metadata
     * @internal
     */
    _chain: Chain
    log: Logger
    store: Store
    blocks: BlockData<Item>[]
    /**
     * Signals, that the processor reached the head of a chain.
     *
     * The head block is always included in `.blocks`.
     */
    isHead: boolean
}


/**
 * Provides methods to configure and launch data processing.
 */
export class SubstrateBatchProcessor<Item extends {kind: string, name: string} = EventItem<'*'> | CallItem<"*">> {
    private requests: RangeRequest<DataRequest>[] = []
    private blockRange?: Range
    private src?: DataSource
    private typesBundle?: OldTypesBundle | OldSpecsBundle
    private prometheus = new PrometheusServer()
    private running = false

    private add(request: DataRequest, range?: Range): void {
        this.requests.push({
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
        this.add({events: [{name, data: options?.data}]}, options?.range)
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
        this.add({calls: [{name, data: options?.data}]}, options?.range)
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
     *
     * // request the same data from multiple contracts at once
     * processor.addEvmLog([
     *     '0xb654611f84a8dc429ba3cb4fda9fad236c505a1a',
     *     '0x6a2d262D56735DbA19Dd70682B39F6bE9a931D98'
     * ], {
     *     topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef']
     * })
     */
    addEvmLog(
        contractAddress: string | string[],
        options?: EvmLogOptions & NoDataSelection
    ): SubstrateBatchProcessor<AddEventItem<Item, EventItem<"EVM.Log", true>>>

    addEvmLog<R extends EventDataRequest>(
        contractAddress: string | string[],
        options: EvmLogOptions & DataSelection<R>
    ): SubstrateBatchProcessor<AddEventItem<Item, EventItem<"EVM.Log", R>>>

    addEvmLog(
        contractAddress: string | string[],
        options?: EvmLogOptions & MayBeDataSelection<EventDataRequest>
    ): SubstrateBatchProcessor<any> {
        this.assertNotRunning()
        let contractAddresses = Array.isArray(contractAddress) ? contractAddress : [contractAddress]
        this.add({
            evmLogs: contractAddresses.map(addr => {
                return {
                    contract: addr.toLowerCase(),
                    filter: options?.filter,
                    data: options?.data
                }
            })
        }, options?.range)
        return this
    }

    /**
     * Similar to {@link .addCall},
     * but requests `Ethereum.transact` calls holding an EVM call transaction
     * with an option to filter them by contract address and sighash.
     *
     * In addition, all `Ethereum.Executed` events emitted by found transactions will be included
     * into the resulting set.
     *
     * @example
     * // request all EVM calls to contract `0x6a2d262D56735DbA19Dd70682B39F6bE9a931D98`
     * processor.addEthereumTransaction('0x6a2d262D56735DbA19Dd70682B39F6bE9a931D98')
     *
     * // request all EVM calls with signature `transfer(address,uint256)`
     * processor.addEthereumTransaction('*', {sighash: '0xa9059cbb'})
     *
     * // request the same data from multiple contracts at once
     * processor.addEthereumTransaction([
     *     '0x6a2d262D56735DbA19Dd70682B39F6bE9a931D98',
     *     '0x3795C36e7D12A8c252A20C5a7B455f7c57b60283'
     * ], {
     *     sighash: '0xa9059cbb'
     * })
     */
    addEthereumTransaction(
        contractAddress: string | string[],
        options?: {range?: Range, sighash?: string} & NoDataSelection
    ): SubstrateBatchProcessor<AddCallItem<AddEventItem<Item, EventItem<"Ethereum.Executed", true>>, CallItem<"Ethereum.transact", true>>>

    addEthereumTransaction<R extends CallDataRequest>(
        contractAddress: string | string[],
        options: {range?: Range, sighash?: string} & DataSelection<R>
    ): SubstrateBatchProcessor<AddCallItem<AddEventItem<Item, EventItem<"Ethereum.Executed", true>>, CallItem<"Ethereum.transact", R>>>

    addEthereumTransaction(
        contractAddress: string | string[],
        options?: {range?: Range, sighash?: string} & MayBeDataSelection<CallDataRequest>
    ): SubstrateBatchProcessor<any> {
        this.assertNotRunning()
        let contractAddresses = Array.isArray(contractAddress) ? contractAddress : [contractAddress]
        this.add({
            ethereumTransactions: contractAddresses.map(addr => {
                return {
                    contract: addr.toLowerCase(),
                    sighash: options?.sighash,
                    data: options?.data
                }
            })
        }, options?.range)
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
        this.add({
            contractsEvents: [{
                contract: contractAddress.toLowerCase(),
                data: options?.data
            }]
        }, options?.range)
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
        this.add({
            gearMessagesEnqueued: [{
                program: programId,
                data: options?.data
            }]
        }, options?.range)
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
        this.add({
            gearUserMessagesSent: [{
                program: programId,
                data: options?.data
            }]
        }, options?.range)
        return this
    }

    /**
     * Similar to {@link .addEvent},
     * but requests `EVM.Executed` events containing logs from particular contract
     * with an option to filter them by log address and topic.
     *
     * @example
     * // request all `EVM.Executed` events from contract `0xae9d7fe007b3327aa64a32824aaac52c42a6e624`
     * processor.addAcalaEvmExecuted('0xae9d7fe007b3327aa64a32824aaac52c42a6e624')
     *
     * // request all `EVM.Executed` events containing ERC20 transfers from contract `0x0000000000000000000100000000000000000080`
     * processor.addAcalaEvmExecuted('*', {
     *     logs: [{
     *         contract: '0x0000000000000000000100000000000000000080',
     *         filter: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef']
     *     }]
     * })
     *
     * // request the same data from multiple contracts at once
     * processor.addAcalaEvmExecuted([
     *     '0xae9d7fe007b3327aa64a32824aaac52c42a6e624',
     *     '0x1aafb0d5aab9ffbe09d4d30c9fd90d695c4f0881',
     * ])
     */
    addAcalaEvmExecuted(
        contractAddress: string | string[],
        options?: AcalaEvmExecutedOptions & NoDataSelection
    ): SubstrateBatchProcessor<AddEventItem<Item, EventItem<"EVM.Executed", true>>>

    addAcalaEvmExecuted<R extends EventDataRequest>(
        contractAddress: string | string[],
        options: AcalaEvmExecutedOptions & DataSelection<R>
    ): SubstrateBatchProcessor<AddEventItem<Item, EventItem<"EVM.Executed", R>>>

    addAcalaEvmExecuted(
        contractAddress: string | string[],
        options?: AcalaEvmExecutedOptions & MayBeDataSelection<EventDataRequest>
    ): SubstrateBatchProcessor<any> {
        this.assertNotRunning()
        let contractAddresses = Array.isArray(contractAddress) ? contractAddress : [contractAddress]
        this.add({
            acalaEvmExecuted: contractAddresses.map(contractAddress => {
                return {
                    contract: contractAddress.toLowerCase(),
                    logs: options?.logs,
                    data: options?.data
                }
            })
        }, options?.range)
        return this
    }

    /**
     * Similar to {@link .addAcalaEvmExecuted},
     * but requests `EVM.ExecutedFailed` events from failed EVM calls (`EVM.call`, `EVM.eth_call`, etc).
     */
    addAcalaEvmExecutedFailed(
        contractAddress: string | string[],
        options?: AcalaEvmExecutedOptions & NoDataSelection
    ): SubstrateBatchProcessor<AddEventItem<Item, EventItem<"EVM.ExecutedFailed", true>>>

    addAcalaEvmExecutedFailed<R extends EventDataRequest>(
        contractAddress: string | string[],
        options: AcalaEvmExecutedOptions & DataSelection<R>
    ): SubstrateBatchProcessor<AddEventItem<Item, EventItem<"EVM.ExecutedFailed", R>>>

    addAcalaEvmExecutedFailed(
        contractAddress: string | string[],
        options?: AcalaEvmExecutedOptions & MayBeDataSelection<EventDataRequest>
    ): SubstrateBatchProcessor<any> {
        this.assertNotRunning()
        let contractAddresses = Array.isArray(contractAddress) ? contractAddress : [contractAddress]
        this.add({
            acalaEvmExecutedFailed: contractAddresses.map(contractAddress => {
                return {
                    contract: contractAddress.toLowerCase(),
                    logs: options?.logs,
                    data: options?.data
                }
            })
        }, options?.range)
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
        this.add({includeAllBlocks: true}, range)
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
        this.prometheus.setPort(port)
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
        this.blockRange = range
        return this
    }

    /**
     *  Used to set the maximum number of blocks which could be fetched
     *  from the data source in a single request.
     *
     *  Now this setting has no effect.
     *
     *  The amount of returned data is determined by the datasource.
     *
     * @deprecated
     */
    setBatchSize(size: number): this {
        this.getLogger().warn('.setBatchSize() is deprecated and has no effect')
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
     * Subsquid project has its own types bundle format,
     * however, most of polkadotjs types bundles will work as well.
     *
     * Types bundle can be specified in 2 different ways:
     *
     * 1. as a name of a JSON file
     * 2. as an {@link OldTypesBundle} or {@link OldSpecsBundle} or {@link PolkadotjsTypesBundle} object
     *
     * @example
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
    setTypesBundle(bundle: string | OldTypesBundle | OldSpecsBundle | PolkadotjsTypesBundle): this {
        this.assertNotRunning()
        if (typeof bundle == 'string') {
            this.typesBundle = getOldTypesBundle(bundle) || readOldTypesBundle(bundle)
        } else {
            this.typesBundle = eliminatePolkadotjsTypesBundle(bundle)
        }
        return this
    }

    private assertNotRunning(): void {
        if (this.running) {
            throw new Error('Settings modifications are not allowed after start of processing')
        }
    }

    private getTypes(specName: string, specVersion: number): OldTypes {
        let bundle = this.typesBundle || getOldTypesBundle(specName)
        if (bundle == null) throw new Error(
            `Types bundle is required for ${specName}@${specVersion}. Provide it via .setTypesBundle() or .setPolkadotjsTypesBundle()`
        )
        return getTypesFromBundle(bundle, specVersion, specName)
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
    private getSquidId(): string {
        return getOrGenerateSquidId()
    }

    @def
    private getArchiveDataSource(): SubstrateArchive {
        let http = new HttpClient({
            baseUrl: this.getArchiveEndpoint(),
            headers: {
                'x-squid-id': this.getSquidId()
            },
            agent: new HttpAgent({
                keepAlive: true
            }),
            httpTimeout: 30_000,
            retryAttempts: Number.MAX_SAFE_INTEGER,
            log: this.getLogger().child('archive')
        })

        return new SubstrateArchive(http)
    }

    @def
    private getChainClient(): RpcClient {
        let url = this.getChainEndpoint()
        let client = new RpcClient({
            url,
            requestTimeout: 30_000,
            capacity: 10,
            retryAttempts: Number.MAX_SAFE_INTEGER
        })
        this.prometheus.addChainRpcMetrics(() => client.getMetrics())
        return client
    }

    @def
    private getChainManager(): ChainManager {
        return new ChainManager({
            archive: this.getArchiveDataSource(),
            getChainClient: () => this.getChainClient(),
            getTypes: meta => this.getTypes(meta.specName, meta.specVersion)
        })
    }

    @def
    private getLogger(): Logger {
        return createLogger('sqd:processor')
    }

    @def
    private getBatchRequests(): RangeRequest<DataRequest>[] {
        let requests = mergeRangeRequests(this.requests, mergeDataRequests)
        return applyRangeBound(requests, this.blockRange)
    }

    private async processBatch<Store>(
        store: Store,
        batch: Batch<BlockData<Item>>,
        handler: (ctx: DataHandlerContext<Store, Item>) => Promise<void>
    ): Promise<void> {
        for await (let {chain, blocks} of this.splitBySpec(batch)) {
            try {
                await handler({
                    _chain: chain,
                    log: this.getLogger().child('mapping'),
                    store,
                    blocks,
                    isHead: batch.isHead && last(blocks) === last(batch.blocks)
                })
            } catch(err: any) {
                throw addErrorContext(err, {
                    batchRange: {
                        from: blocks[0].header.height,
                        to: last(blocks).header.height
                    }
                })
            }
        }
    }

    private async *splitBySpec(batch: Batch<BlockData<Item>>): AsyncIterable<{
        chain: Chain
        blocks: BlockData<Item>[]
    }> {
        let manager = this.getChainManager()

        let pack: {
            chain: Chain
            blocks: BlockData<Item>[]
        } | undefined

        for (let b of batch.blocks) {
            if (pack == null) {
                pack = {
                    chain: await manager.getChainForBlock(b.header),
                    blocks: [b]
                }
            } else if (pack.blocks.length > 1 && pack.blocks[0].header.specId === b.header.specId) {
                pack.blocks.push(b)
            } else {
                let chain = await manager.getChainForBlock(b.header)
                if (pack.chain === chain) {
                    pack.blocks.push(b)
                } else {
                    yield pack
                    pack = {
                        chain,
                        blocks: [b]
                    }
                }
            }
        }

        if (pack) {
            yield pack
        }
    }

    /**
     * Run data processing.
     *
     * This method assumes full control over the current OS process as
     * it terminates the entire program in case of error or
     * at the end of data processing.
     *
     * @param database - database is responsible for providing storage to the data handler
     * and persisting mapping progress and status.
     *
     * @param handler - The data handler, see {@link DataHandlerContext} for an API available to the handler.
     */
    run<Store>(database: Database<Store>, handler: (ctx: DataHandlerContext<Store, Item>) => Promise<void>): void {
        this.assertNotRunning()
        this.running = true
        let log = this.getLogger()
        runProgram(async () => {
            return new Runner({
                database,
                requests: this.getBatchRequests(),
                archive: this.getArchiveDataSource(),
                process: (s, b) => this.processBatch(s, b as any, handler),
                prometheus: this.prometheus,
                log
            }).run()
        }, err => log.fatal(err))
    }
}
