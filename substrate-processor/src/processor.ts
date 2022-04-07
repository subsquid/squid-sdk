import {ResilientRpcClient} from "@subsquid/rpc-client/lib/resilient"
import {getOldTypesBundle, OldTypesBundle, QualifiedName, readOldTypesBundle} from "@subsquid/substrate-metadata"
import {Abort, assertNotNull, def, unexpectedCase} from "@subsquid/util-internal"
import {ServiceManager} from "@subsquid/util-internal-service-manager"
import assert from "assert"
import {createBatches, DataHandlers, getBlocksCount} from "./batch"
import {ChainManager} from "./chain"
import {Db, IsolationLevel} from "./db"
import {Ingest} from "./ingest"
import {BlockHandler, BlockHandlerContext, CallHandler, EventHandler} from "./interfaces/dataHandlerContext"
import {ContextRequest} from "./interfaces/dataSelection"
import {EvmLogEvent, EvmLogHandler, EvmTopicSet} from "./interfaces/evm"
import {Hooks} from "./interfaces/hooks"
import {SubstrateEvent} from "./interfaces/substrate"
import {Metrics} from "./metrics"
import {timeInterval} from "./util/misc"
import {Range} from "./util/range"


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


interface RangeOption {
    range?: Range
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


export class SubstrateProcessor {
    protected hooks: Hooks = {pre: [], post: [], event: [], call: [], evmLog: []}
    private blockRange: Range = {from: 0}
    private batchSize = 100
    private prometheusPort?: number | string
    private src?: DataSource
    private typesBundle?: OldTypesBundle
    private isolationLevel?: IsolationLevel
    private metrics = new Metrics()
    private running = false

    constructor(private name: string) {}

    setDataSource(src: DataSource): void {
        this.assertNotRunning()
        this.src = src
    }

    setTypesBundle(bundle: string | OldTypesBundle): void {
        this.assertNotRunning()
        if (typeof bundle == 'string') {
            this.typesBundle = getOldTypesBundle(bundle) || readOldTypesBundle(bundle)
        } else {
            this.typesBundle = bundle
        }
    }

    setBlockRange(range: Range): void {
        this.assertNotRunning()
        this.blockRange = range
    }

    setBatchSize(size: number): void {
        this.assertNotRunning()
        assert(size > 0)
        this.batchSize = size
    }

    setPrometheusPort(port: number | string) {
        this.assertNotRunning()
        this.prometheusPort = port
    }

    setIsolationLevel(isolationLevel?: IsolationLevel): void {
        this.assertNotRunning()
        this.isolationLevel = isolationLevel
    }

    private getPrometheusPort(): number | string {
        return this.prometheusPort == null
            ? process.env.PROCESSOR_PROMETHEUS_PORT || process.env.PROMETHEUS_PORT || 0
            : this.prometheusPort
    }

    addPreHook(fn: BlockHandler): void
    addPreHook(options: RangeOption, fn: BlockHandler): void
    addPreHook(fnOrOptions: BlockHandler | RangeOption, fn?: BlockHandler): void {
        this.assertNotRunning()
        let handler: BlockHandler
        let options: RangeOption = {}
        if (typeof fnOrOptions == 'function') {
            handler = fnOrOptions
        } else {
            handler = assertNotNull(fn)
            options = fnOrOptions
        }
        this.hooks.pre.push({handler, ...options})
    }

    addPostHook(fn: BlockHandler): void
    addPostHook(options: RangeOption, fn: BlockHandler): void
    addPostHook(fnOrOptions: BlockHandler | RangeOption, fn?: BlockHandler): void {
        this.assertNotRunning()
        let handler: BlockHandler
        let options: RangeOption = {}
        if (typeof fnOrOptions == 'function') {
            handler = fnOrOptions
        } else {
            handler = assertNotNull(fn)
            options = fnOrOptions
        }
        this.hooks.post.push({handler, ...options})
    }

    addEventHandler(eventName: QualifiedName, fn: EventHandler): void
    addEventHandler(eventName: QualifiedName, options: RangeOption & NoDataSelection, fn: EventHandler): void
    addEventHandler<R>(eventName: QualifiedName, options: RangeOption & DataSelection<R>, fn: EventHandler<R> ): void
    addEventHandler(eventName: QualifiedName, fnOrOptions: RangeOption & MayBeDataSelection | EventHandler, fn?: EventHandler): void {
        this.assertNotRunning()
        let handler: EventHandler
        let options: RangeOption & MayBeDataSelection = {}
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

    addCallHandler(callName: QualifiedName, fn: CallHandler): void
    addCallHandler(callName: QualifiedName, options: RangeOption & NoDataSelection, fn: CallHandler): void
    addCallHandler<R>(callName: QualifiedName, options: RangeOption & DataSelection<R>, fn: CallHandler<R>): void
    addCallHandler(callName: QualifiedName, fnOrOptions: CallHandler | RangeOption & MayBeDataSelection, fn?: CallHandler): void {
        this.assertNotRunning()
        let handler: CallHandler
        let options:  RangeOption & MayBeDataSelection = {}
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

    protected assertNotRunning(): void {
        if (this.running) {
            throw new Error('Settings modifications are not allowed after start of processing')
        }
    }

    @def
    private wholeRange(): {range: Range}[] {
        return createBatches(this.hooks, this.blockRange)
    }

    private updateProgressMetrics(lastProcessedBlock: number, time?: bigint): void {
        let totalBlocksCount = getBlocksCount(this.wholeRange(), 0, this.metrics.getChainHeight())
        let blocksLeft = getBlocksCount(this.wholeRange(), lastProcessedBlock + 1, this.metrics.getChainHeight())
        this.metrics.setLastProcessedBlock(lastProcessedBlock)
        this.metrics.setTotalNumberOfBlocks(totalBlocksCount)
        this.metrics.setProgress(totalBlocksCount - blocksLeft, time)
    }

    run(): void {
        if (this.running) return
        this.running = true
        ServiceManager.run(sm => this._run(sm))
    }

    private async _run(sm: ServiceManager): Promise<void> {
        let db = sm.add(await Db.connect({
            processorName: this.name,
            isolationLevel: this.isolationLevel
        }))

        let {height: heightAtStart} = await db.init()

        let blockRange = this.blockRange
        if (blockRange.to != null && blockRange.to < heightAtStart + 1) {
            return
        } else {
            blockRange = {
                from: Math.max(heightAtStart + 1, blockRange.from),
                to: blockRange.to
            }
        }

        let ingest = sm.add(new Ingest({
            archive: assertNotNull(this.src?.archive, 'use .setDataSource() to specify archive url'),
            batches$: createBatches(this.hooks, blockRange),
            batchSize: this.batchSize,
            metrics: this.metrics
        }))

        let client = sm.add(new ResilientRpcClient(
            assertNotNull(this.src?.chain, 'use .setDataSource() to specify chain RPC endpoint')
        ))

        await ingest.fetchArchiveHeight()
        this.updateProgressMetrics(heightAtStart)
        let prometheusServer = sm.add(await this.metrics.serve(this.getPrometheusPort()))
        console.log(`Prometheus metrics are served at port ${prometheusServer.port}`)

        await this.process(
            ingest,
            new ChainManager(client, this.typesBundle),
            db,
            sm.abort
        )
    }

    private async process(
        ingest: Ingest,
        chainManager: ChainManager,
        db: Db,
        abort: Abort
    ): Promise<void> {
        let lastBlock = -1
        for await (let batch of ingest.getBlocks()) {
            let beg = process.hrtime.bigint()

            let {handlers, blocks, range} = batch

            for (let block of blocks) {
                abort.assertNotAborted()
                assert(lastBlock < block.header.height)

                let chain = await chainManager.getChainForBlock(block.header)

                await db.transact(block.header.height, async store => {
                    let ctx: BlockHandlerContext = {
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
                                for (let handler of handlers.events[item.event.name].handlers || []) {
                                    await handler({...ctx, event: item.event})
                                }
                                break
                            case 'call':
                                for (let handler of handlers.calls[item.call.name].handlers || []) {
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
                })

                lastBlock = block.header.height
                this.metrics.setLastProcessedBlock(lastBlock)
            }

            if (lastBlock < range.to) {
                lastBlock = range.to
                await db.setHeight(lastBlock)
            }

            let end = process.hrtime.bigint()
            this.metrics.batchProcessingTime(beg, end, batch.blocks.length)
            this.updateProgressMetrics(lastBlock, end)

            console.log(
                `Last block: ${lastBlock}, ` +
                `mapping: ${Math.round(this.metrics.getMappingSpeed())} blocks/sec, ` +
                `ingest: ${Math.round(this.metrics.getIngestSpeed())} blocks/sec, ` +
                `eta: ${timeInterval(this.metrics.getSyncEtaSeconds())}, ` +
                `progress: ${Math.round(this.metrics.getSyncRatio() * 100)}%`
            )
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
