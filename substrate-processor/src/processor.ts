import {ResilientRpcClient} from "@subsquid/rpc-client/lib/resilient"
import {getOldTypesBundle, OldTypesBundle, readOldTypesBundle} from "@subsquid/substrate-metadata"
import {assertNotNull, toCamelCase} from "@subsquid/util"
import assert from "assert"
import {createBatches, DataHandlers, getBlocksCount} from "./batch"
import {ChainManager} from "./chain"
import {Db, IsolationLevel} from "./db"
import {DataBatch, Ingest} from "./ingest"
import {EvmLogEvent, EvmLogHandler, EvmTopicSet} from "./interfaces/evm"
import type {
    BlockHandler,
    BlockHandlerContext,
    EventHandler,
    EventHandlerContext,
    ExtrinsicHandler,
    ExtrinsicHandlerContext
} from "./interfaces/handlerContext"
import {Hooks} from "./interfaces/hooks"
import {QualifiedName, SubstrateEvent} from "./interfaces/substrate"
import {ProgressTracker} from "./progress-tracker"
import {Prometheus} from "./prometheus"
import {timeInterval} from "./util/misc"
import {Range} from "./util/range"
import {ServiceManager} from "./util/sm"


export interface BlockHookOptions {
    /**
     * Inclusive range of blocks for which the block hook is effective.
     */
    range?: Range
}


export interface EventHandlerOptions {
    /**
     * Inclusive range of blocks for which the event handler is effective.
     */
    range?: Range
}


export interface ExtrinsicHandlerOptions {
    /**
     * Inclusive range of blocks for which the extrinsic handler is effective.
     */
    range?: Range
    /**
     * A set of trigger events.
     *
     * The extrinsic handler is triggered on any event from the list.
     * For more details see {@link SubstrateProcessor.addExtrinsicHandler}.
     */
    triggerEvents?: QualifiedName[]
}


export interface DataSource {
    /**
     * Archive endpoint URL
     */
    archive: string
    /**
     * Chain node RPC websocket URL
     */
    chain: string
}


/**
 * Provides methods to configure and launch data processing.
 */
export class SubstrateProcessor {
    protected hooks: Hooks = {pre: [], post: [], event: [], extrinsic: [], evmLog: []}
    private blockRange: Range = {from: 0}
    private batchSize = 100
    private prometheusPort?: number | string
    private src?: DataSource
    private typesBundle?: OldTypesBundle
    private isolationLevel?: IsolationLevel
    private running = false

    /**
     * @param name Defines prefix for a name of database schema
     * under which the processor will keep its state.
     */
    constructor(private name: string) {}

    /**
     * Sets blockchain data source.
     *
     * Currently, requires both chain node RPC WS endpoint and archive gateway.
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

    /**
     * Sets the isolation level for database transactions
     * in which data handlers are executed.
     *
     * Defaults to `SERIALIZABLE`.
     *
     * This setting is for complex scenarios when
     * there are another database writers beside the processor.
     *
     * Note, that altering this setting can easily lead to "hard to debug"
     * consistency issues.
     */
    setIsolationLevel(isolationLevel?: IsolationLevel): void {
        this.assertNotRunning()
        this.isolationLevel = isolationLevel
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
    addPreHook(fn: BlockHandler): void
    addPreHook(options: BlockHookOptions, fn: BlockHandler): void
    addPreHook(fnOrOptions: BlockHandler | BlockHookOptions, fn?: BlockHandler): void {
        this.assertNotRunning()
        let handler: BlockHandler
        let options: BlockHookOptions = {}
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
    addPostHook(fn: BlockHandler): void
    addPostHook(options: BlockHookOptions, fn: BlockHandler): void
    addPostHook(fnOrOptions: BlockHandler | BlockHookOptions, fn?: BlockHandler): void {
        this.assertNotRunning()
        let handler: BlockHandler
        let options: BlockHookOptions = {}
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
    addEventHandler(eventName: QualifiedName, fn: EventHandler): void
    addEventHandler(eventName: QualifiedName, options: EventHandlerOptions, fn: EventHandler): void
    addEventHandler(eventName: QualifiedName, fnOrOptions: EventHandlerOptions | EventHandler, fn?: EventHandler): void {
        this.assertNotRunning()
        let handler: EventHandler
        let options: EventHandlerOptions = {}
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

    /**
     * Registers extrinsic data handler.
     *
     * See {@link ExtrinsicHandlerContext} for an API available to the handler.
     *
     * Extrinsic handlers are triggered following the relative order
     * of trigger event in the event log of the current block.
     * This defines a deterministic canonical ordering
     * of how all the event and extrinsic handlers are executed within a single block.
     *
     * The set of possible trigger events is customizable and defaults to `['system.ExtrinsicSuccess']`.
     * Which means, by default extrinsic handler will be executed after all events of the same extrinsic
     * and only if it was successful.
     *
     * Relative execution order is currently not defined for multiple extrinsic handlers
     * registered for the same extrinsic and trigger events.
     *
     * @example
     * processor.addExtrinsicHandler('balances.transfer', async ctx => {
     *     assert(ctx.extrinsic.name == 'balances.transfer')
     * })
     *
     * // limit the range of blocks for which extrinsic handler will be effective
     * processor.addExtrinsicHandler('balances.transfer', {
     *     range: {from: 100000}
     * }, async ctx => {
     *     assert(ctx.extrinsic.name == 'balances.transfer')
     * })
     *
     * // handle both successful and failed extrinsics
     * processor.addExtrinsicHandler('balances.transfer', {
     *     triggerEvents: ['system.ExtrinsicSuccess', 'system.ExtrinsicFailed']
     * }, async ctx => {
     *     if (ctx.event.name == 'system.ExtrinsicSuccess') {
     *         console.log('successful')
     *     } else {
     *         console.log('failed')
     *     }
     * })
     */
    addExtrinsicHandler(extrinsicName: QualifiedName, fn: ExtrinsicHandler): void
    addExtrinsicHandler(extrinsicName: QualifiedName, options: ExtrinsicHandlerOptions, fn: ExtrinsicHandler): void
    addExtrinsicHandler(extrinsicName: QualifiedName, fnOrOptions: ExtrinsicHandler | ExtrinsicHandlerOptions, fn?: ExtrinsicHandler): void {
        this.assertNotRunning()
        let handler: ExtrinsicHandler
        let options: ExtrinsicHandlerOptions = {}
        if (typeof fnOrOptions == 'function') {
            handler = fnOrOptions
        } else {
            handler = assertNotNull(fn)
            options = {...fnOrOptions}
        }
        let triggers = options.triggerEvents || ['system.ExtrinsicSuccess']
        new Set(triggers).forEach(event => {
            this.hooks.extrinsic.push({
                event,
                handler,
                extrinsic: extrinsicName.split('.').map(n => toCamelCase(n)).join('.'),
                range: options.range
            })
        })
    }

    protected assertNotRunning(): void {
        if (this.running) {
            throw new Error('Settings modifications are not allowed after start of processing')
        }
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
        ServiceManager.run(sm => this._run(sm))
    }

    private async _run(sm: ServiceManager): Promise<void> {
        let prometheus = new Prometheus()
        let prometheusServer = sm.add(await prometheus.serve(this.getPrometheusPort()))
        console.log(`Prometheus metrics are served at port ${prometheusServer.port}`)

        let db = sm.add(await Db.connect({
            processorName: this.name,
            isolationLevel: this.isolationLevel
        }))

        let {height: heightAtStart} = await db.init()

        prometheus.setLastProcessedBlock(heightAtStart)

        let blockRange = this.blockRange
        if (blockRange.to != null && blockRange.to < heightAtStart + 1) {
            return
        } else {
            blockRange = {
                from: Math.max(heightAtStart + 1, blockRange.from),
                to: blockRange.to
            }
        }

        let batches = createBatches(this.hooks, blockRange)

        let ingest = sm.add(new Ingest({
            archive: assertNotNull(this.src?.archive, 'use .setDataSource() to specify archive url'),
            batches$: batches,
            batchSize: this.batchSize,
            metrics: prometheus
        }))

        let client = sm.add(new ResilientRpcClient(
            assertNotNull(this.src?.chain, 'use .setDataSource() to specify chain RPC endpoint')
        ))

        let wholeRange = createBatches(this.hooks, this.blockRange)
        let progress = new ProgressTracker(
            getBlocksCount(wholeRange, heightAtStart),
            wholeRange,
            prometheus
        )

        await this.process(
            ingest,
            new ChainManager(client, this.typesBundle),
            db,
            prometheus,
            progress
        )
    }

    private async process(
        ingest: Ingest,
        chainManager: ChainManager,
        db: Db,
        prom: Prometheus,
        progress: ProgressTracker
    ): Promise<void> {
        let batch: DataBatch | null
        let lastBlock = -1
        while (batch = await ingest.nextBatch()) {
            let {handlers, blocks, range} = batch
            let beg = blocks.length > 0 ? process.hrtime.bigint() : 0n

            for (let block of blocks) {
                assert(lastBlock < block.block.height)
                let chain = await chainManager.getChainForBlock(block.block)
                await db.transact(block.block.height, async store => {
                    let ctx: BlockHandlerContext = {
                        _chain: chain,
                        store,
                        ...block
                    }

                    for (let pre of handlers.pre) {
                        await pre(ctx)
                    }

                    for (let event of block.events) {
                        let extrinsic = event.extrinsic

                        for (let eventHandler of handlers.events[event.name] || []) {
                            await eventHandler({...ctx, event, extrinsic})
                        }

                        for (let evmLogHandler of this.getEvmLogHandlers(handlers.evmLogs, event)) {
                            let log = event as EvmLogEvent
                            await evmLogHandler({
                                contractAddress: log.evmLogAddress,
                                topics: log.evmLogTopics,
                                data: log.evmLogData,
                                txHash: log.evmHash,
                                substrate: {...ctx, event, extrinsic},
                                store
                            })
                        }

                        if (extrinsic == null) continue
                        for (let callHandler of handlers.extrinsics[event.name]?.[extrinsic.name] || []) {
                            await callHandler({...ctx, event, extrinsic})
                        }
                    }

                    for (let post of handlers.post) {
                        await post(ctx)
                    }
                })

                lastBlock = block.block.height
                prom.setLastProcessedBlock(lastBlock)
            }

            if (lastBlock < range.to) {
                lastBlock = range.to
                await db.setHeight(lastBlock)
                prom.setLastProcessedBlock(lastBlock)
            }

            let end = process.hrtime.bigint()
            progress.batch(end, batch)

            let status: string[] = []
            status.push(`Last block: ${lastBlock}`)
            if (blocks.length > 0) {
                let speed = blocks.length * Math.pow(10, 9) / Number(end - beg)
                let roundedSpeed = Math.round(speed)
                status.push(`mapping: ${roundedSpeed} blocks/sec`)
                prom.setMappingSpeed(speed)
            }
            status.push(`ingest: ${Math.round(prom.getIngestSpeed())} blocks/sec`)
            status.push(`eta: ${timeInterval(progress.getSyncEtaSeconds())}`)
            status.push(`progress: ${Math.round(progress.getSyncRatio() * 100)}%`)
            console.log(status.join(', '))
        }
    }

    private *getEvmLogHandlers(evmLogs: DataHandlers["evmLogs"], event: SubstrateEvent): Generator<EvmLogHandler> {
        if (event.name != 'evm.Log') return
        let log = event as EvmLogEvent

        let contractHandlers = evmLogs[log.evmLogAddress]
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
            if (Array.isArray(set) && !set.includes(log.evmLogTopics[i])) {
                return false
            } else if (set !== log.evmLogTopics[i]) {
                return false
            }
        }
        return true
    }
}
