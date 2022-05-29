import {createLogger} from "@subsquid/logger"
import {ResilientRpcClient} from "@subsquid/rpc-client/lib/resilient"
import {getOldTypesBundle, OldTypesBundle, QualifiedName, readOldTypesBundle} from "@subsquid/substrate-metadata"
import {assertNotNull, def, runProgram, unexpectedCase} from "@subsquid/util-internal"
import {graphqlRequest} from "@subsquid/util-internal-gql-request"
import assert from "assert"
import {createBatches, DataHandlers, getBlocksCount} from "./batch"
import {Chain, ChainManager} from "./chain"
import {BlockData, Ingest} from "./ingest"
import {
    BlockHandler,
    BlockHandlerContext,
    BlockRangeOption,
    CallHandler,
    ContractsContractEmittedHandler,
    EventHandler,
    EvmLogHandler,
    EvmLogOptions,
    EvmTopicSet
} from "./interfaces/dataHandlers"
import {ContextRequest} from "./interfaces/dataSelection"
import {Database} from "./interfaces/db"
import {Hooks} from "./interfaces/hooks"
import {ContractsContractEmittedEvent, EvmLogEvent, SubstrateEvent} from "./interfaces/substrate"
import {Metrics} from "./metrics"
import {timeInterval, withErrorContext} from "./util/misc"
import {Range} from "./util/range"


export interface DataSource {
    /**
     * Subsquid substrate archive endpoint URL
     */
    archive: string
    /**
     * Chain node RPC websocket URL
     */
    chain?: string
}


interface DataSelection<R extends ContextRequest> {
    data: R
}


interface NoDataSelection {
    data?: undefined
}


interface MayBeDataSelection {
    data?: ContextRequest
}


/**
 * Provides methods to configure and launch data processing.
 */
export class SubstrateProcessor<Store> {
    protected hooks: Hooks = {pre: [], post: [], event: [], call: [], evmLog: [], contractsContractEmitted: []}
    private blockRange: Range = {from: 0}
    private batchSize = 100
    private prometheusPort?: number | string
    private src?: DataSource
    private typesBundle?: OldTypesBundle
    private metrics = new Metrics()
    private running = false
    private log = createLogger('sqd:processor')

    constructor(private db: Database<Store>) {}

    /**
     * Sets blockchain data source.
     *
     * @example
     * processor.setDataSource({
     *     chain: 'wss://rpc.polkadot.io',
     *     archive: 'https://polkadot.indexer.gc.subsquid.io/v4/graphql'
     * })
     */
    setDataSource(src: DataSource): void {
        this.assertNotRunning()
        this.src = src
    }

    /**
     * Sets types bundle.
     *
     * Types bundle is only required for blocks which have
     * metadata version below 14.
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
    setTypesBundle(bundle: string | OldTypesBundle): void {
        this.assertNotRunning()
        if (typeof bundle == 'string') {
            this.typesBundle = getOldTypesBundle(bundle) || readOldTypesBundle(bundle)
        } else {
            this.typesBundle = bundle
        }
    }

    /**
     * Limits the range of blocks to be processed.
     *
     * When the upper bound is specified,
     * the processor will terminate with exit code 0 once it reaches it.
     *
     * @example
     * // process only block 100
     * processor.setBlockRange({
     *     from: 100,
     *     to: 100
     * })
     */
    setBlockRange(range: Range): void {
        this.assertNotRunning()
        this.blockRange = range
    }

    /**
     * Sets the maximum number of blocks which can be fetched
     * from the data source in a single request.
     *
     * The default is 100.
     *
     * Usually this setting doesn't have any significant impact on the performance.
     */
    setBatchSize(size: number): void {
        this.assertNotRunning()
        assert(size > 0)
        this.batchSize = size
    }

    /**
     * Sets the port for a built-in prometheus metrics server.
     *
     * By default, the value of `PROMETHEUS_PORT` environment
     * variable is used. When it is not set,
     * the processor will pick up an ephemeral port.
     */
    setPrometheusPort(port: number | string) {
        this.assertNotRunning()
        this.prometheusPort = port
    }

    private getPrometheusPort(): number | string {
        return this.prometheusPort == null
            ? process.env.PROCESSOR_PROMETHEUS_PORT || process.env.PROMETHEUS_PORT || 0
            : this.prometheusPort
    }

    /**
     * Registers a block level data handler which will be executed before
     * any further processing.
     *
     * See {@link BlockHandlerContext} for an API available to the handler.
     *
     * Block level handlers affect performance, as they are
     * triggered for all chain blocks. If no block hooks are defined,
     * only blocks that'd trigger a handler execution will be fetched,
     * which is usually a lot faster.
     *
     * Relative execution order for multiple pre-block hooks is currently not defined.
     *
     * @example
     * processor.addPreHook(async ctx => {
     *     console.log(ctx.block.height)
     * })
     *
     * // limit the range of blocks for which pre-block hook will be effective
     * processor.addPreHook({range: {from: 100000}}, async ctx => {})
     */
    addPreHook(fn: BlockHandler<Store>): void
    addPreHook(options: BlockRangeOption, fn: BlockHandler<Store>): void
    addPreHook(fnOrOptions: BlockHandler<Store> | BlockRangeOption, fn?: BlockHandler<Store>): void {
        this.assertNotRunning()
        let handler: BlockHandler<Store>
        let options: BlockRangeOption = {}
        if (typeof fnOrOptions == 'function') {
            handler = fnOrOptions
        } else {
            handler = assertNotNull(fn)
            options = fnOrOptions
        }
        this.hooks.pre.push({handler, ...options})
    }

    /**
     * Registers a block level data handler which will be executed
     * at the end of processing.
     *
     * See {@link BlockHandlerContext} for an API available to the handler.
     *
     * Block level handlers affect performance, as they are
     * triggered for all chain blocks. If no block hooks are defined,
     * only blocks that'd trigger a handler execution will be fetched,
     * which is usually a lot faster.
     *
     * Relative execution order for multiple post-block hooks is currently not defined.
     *
     * @example
     * processor.addPostHook(async ctx => {
     *     console.log(ctx.block.height)
     * })
     *
     * // limit the range of blocks for which post-block hook will be effective
     * processor.addPostHook({range: {from: 100000}}, async ctx => {})
     */
    addPostHook(fn: BlockHandler<Store>): void
    addPostHook(options: BlockRangeOption, fn: BlockHandler<Store>): void
    addPostHook(fnOrOptions: BlockHandler<Store> | BlockRangeOption, fn?: BlockHandler<Store>): void {
        this.assertNotRunning()
        let handler: BlockHandler<Store>
        let options: BlockRangeOption = {}
        if (typeof fnOrOptions == 'function') {
            handler = fnOrOptions
        } else {
            handler = assertNotNull(fn)
            options = fnOrOptions
        }
        this.hooks.post.push({handler, ...options})
    }

    /**
     * Registers an event data handler.
     *
     * See {@link EventHandlerContext} for an API available to the handler.
     *
     * All events are processed sequentially according to the event log of the current block.
     *
     * Relative execution order is currently not defined for multiple event handlers
     * registered for the same event.
     *
     * @example
     * processor.addEventHandler('balances.Transfer', async ctx => {
     *     assert(ctx.event.name == 'balances.Transfer')
     * })
     *
     * // limit the range of blocks for which event handler will be effective
     * processor.addEventHandler('balances.Transfer', {
     *     range: {from: 100000}
     * }, async ctx => {
     *     assert(ctx.event.name == 'balances.Transfer')
     * })
     */
    addEventHandler(eventName: QualifiedName, fn: EventHandler<Store>): void
    addEventHandler(eventName: QualifiedName, options: BlockRangeOption & NoDataSelection, fn: EventHandler<Store>): void
    addEventHandler<R>(eventName: QualifiedName, options: BlockRangeOption & DataSelection<R>, fn: EventHandler<Store, R> ): void
    addEventHandler(eventName: QualifiedName, fnOrOptions: BlockRangeOption & MayBeDataSelection | EventHandler<Store>, fn?: EventHandler<Store>): void {
        this.assertNotRunning()
        let handler: EventHandler<Store>
        let options: BlockRangeOption & MayBeDataSelection = {}
        if (typeof fnOrOptions === 'function') {
            handler = fnOrOptions
        } else {
            handler = assertNotNull(fn)
            options = fnOrOptions
        }
        this.hooks.event.push({
            event: eventName,
            handler,
            ...options
        })
    }

    addCallHandler(callName: QualifiedName, fn: CallHandler<Store>): void
    addCallHandler(callName: QualifiedName, options: BlockRangeOption & NoDataSelection, fn: CallHandler<Store>): void
    addCallHandler<R>(callName: QualifiedName, options: BlockRangeOption & DataSelection<R>, fn: CallHandler<Store, R>): void
    addCallHandler(callName: QualifiedName, fnOrOptions: CallHandler<Store> | BlockRangeOption & MayBeDataSelection, fn?: CallHandler<Store>): void {
        this.assertNotRunning()
        let handler: CallHandler<Store>
        let options:  BlockRangeOption & MayBeDataSelection = {}
        if (typeof fnOrOptions == 'function') {
            handler = fnOrOptions
        } else {
            handler = assertNotNull(fn)
            options = {...fnOrOptions}
        }
        this.hooks.call.push({
            call: callName,
            handler,
            ...options
        })
    }


    addEvmLogHandler(
        contractAddress: string,
        fn: EvmLogHandler<Store>
    ): void
    addEvmLogHandler(
        contractAddress: string,
        options: EvmLogOptions & NoDataSelection,
        fn: EvmLogHandler<Store>
    ): void
    addEvmLogHandler<R extends ContextRequest>(
        contractAddress: string,
        options: EvmLogOptions & DataSelection<R>,
        fn: EvmLogHandler<Store, R>
    ): void
    addEvmLogHandler(
        contractAddress: string,
        fnOrOptions: EvmLogOptions & MayBeDataSelection | EvmLogHandler<Store>,
        fn?: EvmLogHandler<Store>
    ): void {
        this.assertNotRunning()
        let handler: EvmLogHandler<Store>
        let options:  EvmLogOptions= {}
        if (typeof fnOrOptions == 'function') {
            handler = fnOrOptions
        } else {
            handler = assertNotNull(fn)
            options = {...fnOrOptions}
        }
        this.hooks.evmLog.push({
            handler,
            contractAddress,
            ...options
        })
    }

    addContractsContractEmittedHandler(
        contractAddress: string,
        fn: ContractsContractEmittedHandler<Store>
    ): void
    addContractsContractEmittedHandler(
        contractAddress: string,
        options: BlockRangeOption & NoDataSelection,
        fn: ContractsContractEmittedHandler<Store>
    ): void
    addContractsContractEmittedHandler<R>(
        contractAddress: string,
        options: BlockRangeOption & DataSelection<R>,
        fn: ContractsContractEmittedHandler<Store, R>
    ): void
    addContractsContractEmittedHandler(
        contractAddress: string,
        fnOrOptions: ContractsContractEmittedHandler<Store> | BlockRangeOption & MayBeDataSelection,
        fn?: ContractsContractEmittedHandler<Store>
    ): void {
        this.assertNotRunning()
        let handler: ContractsContractEmittedHandler<Store>
        let options: BlockRangeOption & MayBeDataSelection = {}
        if (typeof fnOrOptions == 'function') {
            handler = fnOrOptions
        } else {
            handler = assertNotNull(fn)
            options = {...fnOrOptions}
        }
        this.hooks.contractsContractEmitted.push({
            handler,
            contractAddress,
            ...options
        })
    }

    protected assertNotRunning(): void {
        if (this.running) {
            throw new Error('Settings modifications are not allowed after start of processing')
        }
    }

    @def
    private wholeRange(): {range: Range}[] {
        return createBatches(this.hooks, this.blockRange)
    }

    @def
    private chainClient(): ResilientRpcClient {
        let endpoint = this.src?.chain
        if (endpoint == null) {
            throw new Error(`use .setDataSource() to specify chain RPC endpoint`)
        }
        return new ResilientRpcClient(endpoint)
    }

    @def
    private archiveRequest(): (query: string) => Promise<any> {
        const archiveUrl = this.src?.archive
        if (archiveUrl == null) {
            throw new Error('use .setDataSource() to specify archive url')
        }

        let log = this.log.child('archive-request', {archiveUrl})
        let counter = 0

        return async archiveQuery => {
            let archiveRequestId = counter
            counter = (counter + 1) % 1000

            log.debug({
                archiveRequestId,
                archiveQuery
            }, 'request')

            let response = await graphqlRequest({
                url: archiveUrl,
                query: archiveQuery,
                timeout: 60_000,
                retry: {
                    log(err, errorsInRow, backoff) {
                        log.warn({
                            archiveRequestId,
                            archiveQuery,
                            backoff,
                            reason: err.message
                        }, 'retry')
                    }
                }
            }).catch(
                withErrorContext({archiveUrl, archiveRequestId, archiveQuery})
            )

            log.debug({
                archiveUrl,
                archiveRequestId,
                archiveResponse: log.isTrace() ? response : undefined
            }, 'response')

            return response
        }
    }

    @def
    private chainManager(): ChainManager {
        return new ChainManager({
            archiveRequest: this.archiveRequest(),
            getChainClient: () => this.chainClient(),
            typesBundle: this.typesBundle
        })
    }

    private updateProgressMetrics(lastProcessedBlock: number, time?: bigint): void {
        let totalBlocksCount = getBlocksCount(this.wholeRange(), 0, this.metrics.getChainHeight())
        let blocksLeft = getBlocksCount(this.wholeRange(), lastProcessedBlock + 1, this.metrics.getChainHeight())
        this.metrics.setLastProcessedBlock(lastProcessedBlock)
        this.metrics.setTotalNumberOfBlocks(totalBlocksCount)
        this.metrics.setProgress(totalBlocksCount - blocksLeft, time)
    }

    /**
     * Starts data processing.
     *
     * This method assumes full control over the current OS process as
     * it terminates the entire program in case of error or
     * at the end of data processing.
     */
    run(): void {
        if (this.running) return
        this.running = true
        runProgram(() => this._run(), err => this.log.fatal(err))
    }

    private async _run(): Promise<void> {
        let heightAtStart = await this.db.connect()
        if (heightAtStart >= 0) {
            this.log.info(`last processed block was ${heightAtStart}`)
        }

        let blockRange = this.blockRange
        if (blockRange.to != null && blockRange.to < heightAtStart + 1) {
            this.log.info(`processing range is [${blockRange.from}, ${blockRange.to}]`)
            this.log.info('nothing to do')
            return
        } else {
            blockRange = {
                from: Math.max(heightAtStart + 1, blockRange.from),
                to: blockRange.to
            }
        }

        this.log.info(`processing blocks from ${blockRange.from}${blockRange.to == null ? '' : ' to ' + blockRange.to}`)

        let ingest = new Ingest({
            archiveRequest: this.archiveRequest(),
            batches: createBatches(this.hooks, blockRange),
            batchSize: this.batchSize,
            metrics: this.metrics
        })

        await ingest.fetchArchiveHeight()
        this.updateProgressMetrics(heightAtStart)
        let prometheusServer = await this.metrics.serve(this.getPrometheusPort())
        this.log.info(`prometheus metrics are served at port ${prometheusServer.port}`)

        return this.process(ingest)
    }

    private async process(ingest: Ingest): Promise<void> {
        let chainManager = this.chainManager()
        let lastBlock = -1
        for await (let batch of ingest.getBlocks()) {
            let beg = process.hrtime.bigint()
            let {handlers, blocks, range} = batch

            for (let block of blocks) {
                assert(lastBlock < block.header.height)
                let chain = await chainManager.getChainForBlock(block.header)
                await this.db.transact(block.header.height, store => {
                    return this.processBlock(handlers, chain, store, block)
                })
                lastBlock = block.header.height
                this.metrics.setLastProcessedBlock(lastBlock)
            }

            lastBlock = range.to
            await this.db.advance(lastBlock)

            let end = process.hrtime.bigint()
            this.metrics.batchProcessingTime(beg, end, batch.blocks.length)
            this.updateProgressMetrics(lastBlock, end)

            this.log.info(
                `last block: ${lastBlock}, ` +
                `speed: ${Math.round(this.metrics.getSyncSpeed())} blocks/sec, ` +
                `mapping: ${Math.round(this.metrics.getMappingSpeed())} blocks/sec, ` +
                `ingest: ${Math.round(this.metrics.getIngestSpeed())} blocks/sec, ` +
                `eta: ${timeInterval(this.metrics.getSyncEtaSeconds())}, ` +
                `progress: ${Math.round(this.metrics.getSyncRatio() * 100)}%`
            )
        }
    }

    private async processBlock(
        handlers: DataHandlers,
        chain: Chain,
        store: Store,
        block: BlockData
    ): Promise<void> {
        let ctx: BlockHandlerContext<Store> = {
            _chain: chain,
            store,
            block: block.header
        }

        for (let pre of handlers.pre) {
            await pre(ctx)
        }

        for (let item of block.log) {
            switch(item.kind) {
                case 'event':
                    for (let handler of handlers.events[item.event.name]?.handlers || []) {
                        await handler({...ctx, event: item.event})
                    }
                    for (let handler of this.getEvmLogHandlers(handlers.evmLogs, item.event)) {
                        let event = item.event as EvmLogEvent
                        await handler({
                            ...ctx,
                            event
                        })
                    }
                    for (let handler of this.getContractEmittedHandlers(handlers, item.event)) {
                        let event = item.event as ContractsContractEmittedEvent
                        await handler({
                            ...ctx,
                            event
                        })
                    }
                    break
                case 'call':
                    for (let handler of handlers.calls[item.call.name]?.handlers || []) {
                        let {kind, ...data} = item
                        await handler({...ctx, ...data})
                    }
                    break
                default:
                    throw unexpectedCase()
            }
        }

        for (let post of handlers.post) {
            await post(ctx)
        }
    }

    private *getEvmLogHandlers(evmLogs: DataHandlers["evmLogs"], event: SubstrateEvent): Generator<EvmLogHandler<any>> {
        if (event.name != 'EVM.Log') return
        let log = event as EvmLogEvent

        let contractHandlers = evmLogs[log.args.address]
        if (contractHandlers == null) return

        for (let h of contractHandlers) {
            if (this.evmHandlerMatches(h, log)) {
                yield h.handler
            }
        }
    }

    private evmHandlerMatches(handler: {filter?: EvmTopicSet[]}, log: EvmLogEvent): boolean {
        if (handler.filter == null) return true
        for (let i = 0; i < handler.filter.length; i++) {
            let set = handler.filter[i]
            if (set == null) continue
            if (Array.isArray(set) && !set.includes(log.args.topics[i])) {
                return false
            } else if (set !== log.args.topics[i]) {
                return false
            }
        }
        return true
    }

    private *getContractEmittedHandlers(handlers: DataHandlers, event: SubstrateEvent): Generator<ContractsContractEmittedHandler<any>> {
        if (event.name != 'Contracts.ContractEmitted') return
        let e = event as ContractsContractEmittedEvent

        let hs = handlers.contractsContractEmitted[e.args.contract]
        if (hs == null) return

        for (let h of hs.handlers) {
            yield h
        }
    }
}
