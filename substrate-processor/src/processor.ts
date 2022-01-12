import {getOldTypesBundle, OldTypesBundle, readOldTypesBundle} from "@subsquid/substrate-metadata"
import {assertNotNull} from "@subsquid/util"
import assert from "assert"
import {createBatches, getBlocksCount} from "./batch"
import {ChainManager} from "./chain"
import {Db} from "./db"
import {DataBatch, Ingest} from "./ingest"
import {BlockHandler, BlockHandlerContext, EventHandler, ExtrinsicHandler} from "./interfaces/handlerContext"
import {Hooks} from "./interfaces/hooks"
import {QualifiedName} from "./interfaces/substrate"
import {Prometheus} from "./prometheus"
import {timeInterval} from "./util/misc"
import {Range} from "./util/range"
import {ResilientRpc} from "./util/resilient-rpc-client"
import {ServiceManager} from "./util/sm"


export interface BlockHookOptions {
    range?: Range
}


export interface EventHandlerOptions {
    range?: Range
}


export interface ExtrinsicHandlerOptions {
    range?: Range
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


export class SubstrateProcessor {
    private hooks: Hooks = {pre: [], post: [], event: [], extrinsic: []}
    private blockRange: Range = {from: 0}
    private batchSize = 100
    private prometheusPort?: number | string
    private src?: DataSource
    private typesBundle?: OldTypesBundle
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

    private getPrometheusPort(): number | string {
        return this.prometheusPort == null ? process.env.PROCESSOR_PROMETHEUS_PORT || 0 : this.prometheusPort
    }

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
                extrinsic: extrinsicName,
                range: options.range
            })
        })
    }

    private assertNotRunning(): void {
        if (this.running) {
            throw new Error('Settings modifications are not allowed after start of processing')
        }
    }

    run(): void {
        if (this.running) return
        this.running = true
        ServiceManager.run(sm => this._run(sm))
    }

    private async _run(sm: ServiceManager): Promise<void> {
        let prometheus = new Prometheus()
        let prometheusServer = sm.add(await prometheus.serve(this.getPrometheusPort()))
        console.log(`Prometheus metrics are served at port ${prometheusServer.port}`)

        let db = sm.add(await Db.connect())
        let {height: heightAtStart} = await db.init(this.name)

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

        let client = sm.add(new ResilientRpc(
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
            let {handlers: {pre, post, events, extrinsics}, blocks, range} = batch
            let beg = blocks.length > 0 ? process.hrtime.bigint() : 0n
            for (let i = 0; i < blocks.length; i++) {
                let block = blocks[i]
                assert(lastBlock < block.block.height)
                let chain = await chainManager.getChainForBlock(block.block)
                await db.transact(this.name, block.block.height, async store => {
                    let ctx: BlockHandlerContext = {
                        _chain: chain,
                        store,
                        ...block
                    }
                    for (let j = 0; j < pre.length; j++) {
                        await pre[j](ctx)
                    }
                    for (let j = 0; j < block.events.length; j++) {
                        let event = block.events[j]
                        let extrinsic = event.extrinsic
                        let eventHandlers = events[event.name] || []
                        for (let k = 0; k < eventHandlers.length; k++) {
                            await eventHandlers[k]({...ctx, event, extrinsic})
                        }
                        if (extrinsic == null) continue
                        let callHandlers = extrinsics[event.name]?.[extrinsic.name] || []
                        for (let k = 0; k < callHandlers.length; k++) {
                            await callHandlers[k]({...ctx, event, extrinsic})
                        }
                    }
                    for (let j = 0; j < post.length; j++) {
                        await post[j](ctx)
                    }
                })
                lastBlock = block.block.height
                prom.setLastProcessedBlock(lastBlock)
            }

            if (lastBlock < range.to) {
                lastBlock = range.to
                await db.setHeight(this.name, lastBlock)
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
}


class ProgressTracker {
    private window: {time: bigint, count: number}[] = []
    private ratio = 0
    private eta = 0

    constructor(
        private count: number,
        private wholeRange: {range: Range}[],
        private prometheus: Prometheus
    ) {
        this.tick(process.hrtime.bigint(), 0)
    }

    private tick(time: bigint, inc: number): bigint {
        this.count += inc
        this.window.push({
            time,
            count: this.count
        })
        if (this.window.length > 5) {
            this.window.shift()
        }
        return time
    }

    batch(time: bigint, batch: DataBatch): void {
        this.tick(time, batch.range.to - batch.range.from + 1)

        let total = getBlocksCount(this.wholeRange, this.prometheus.getChainHeight())
        this.ratio = Math.round(10000 * this.count / total) / 10000
        this.prometheus.setSyncRatio(this.ratio)

        let beg = this.window[0]
        let end = this.window[this.window.length - 1]
        let duration = end.time - beg.time
        let processed = end.count - beg.count
        this.eta = Number(BigInt(total - this.count) * duration / (BigInt(processed) * 1000_000_000n))
        this.prometheus.setSyncETA(this.eta)
    }

    getSyncRatio(): number {
        return this.ratio
    }

    getSyncEtaSeconds(): number {
        return this.eta
    }
}
