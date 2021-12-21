import {assertNotNull} from "@subsquid/util"
import assert from "assert"
import {Db} from "./db"
import {DataBatch, Ingest} from "./ingest"
import {BlockHandler, BlockHandlerContext, EventHandler, ExtrinsicHandler} from "./interfaces/handlerContext"
import {Hooks} from "./interfaces/hooks"
import {QualifiedName} from "./interfaces/substrate"
import {Prometheus} from "./prometheus"
import {Range} from "./util/range"
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


export class SubstrateProcessor {
    private archive?: string
    private hooks: Hooks = {pre: [], post: [], event: [], extrinsic: []}
    private blockRange: Range = {from: 0}
    private batchSize = 100
    private prometheusPort?: number | string

    constructor(private name: string) {}

    setDataSource(archiveUrl: string): void {
        this.archive = archiveUrl
    }

    setBlockRange(range: Range): void {
        this.blockRange = range
    }

    setBatchSize(size: number): void {
        assert(size > 0)
        this.batchSize = size
    }

    setPrometheusPort(port: number | string) {
        this.prometheusPort = port
    }

    private getPrometheusPort(): number | string {
        return this.prometheusPort || process.env.PROCESSOR_PROMETHEUS_PORT || 0
    }

    addPreHook(fn: BlockHandler): void
    addPreHook(options: BlockHookOptions, fn: BlockHandler): void
    addPreHook(fnOrOptions: BlockHandler | BlockHookOptions, fn?: BlockHandler): void {
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

    run(): void {
        ServiceManager.run(sm => this._run(sm))
    }

    private async _run(sm: ServiceManager): Promise<void> {
        let db = sm.add(await Db.connect())

        let {height: heightAtStart} = await db.init(this.name)
        let blockRange = this.blockRange
        if (blockRange.to != null && blockRange.to < heightAtStart + 1) {
            return
        } else {
            blockRange = {
                from: Math.max(heightAtStart + 1, blockRange.from),
                to: blockRange.to
            }
        }

        let prometheus = new Prometheus()
        let prometheusServer = sm.add(await prometheus.serve(this.getPrometheusPort()))
        console.log(`Prometheus metrics are served at port ${prometheusServer.port}`)

        let ingest = sm.add(new Ingest({
            archive: assertNotNull(this.archive, 'use .setDataSource() to specify archive url'),
            range: blockRange,
            batchSize: this.batchSize,
            hooks: this.hooks,
            prometheus
        }))

        await this.process(ingest, db, prometheus)
    }

    private async process(ingest: Ingest, db: Db, prom: Prometheus): Promise<void> {
        let batch: DataBatch | null
        let lastBlock = -1
        while (batch = await ingest.nextBatch()) {
            let beg = Date.now()
            let {pre, post, events, extrinsics, blocks} = batch
            for (let i = 0; i < blocks.length; i++) {
                let block = blocks[i]
                await db.transact(this.name, block.block.height, async store => {
                    let ctx: BlockHandlerContext = {
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
            let end = Date.now()
            let duration = end - beg
            let speed = duration > 0 ? Math.round(blocks.length * 1000 / duration) : 0
            console.log(
                `Last block: ${lastBlock}. Processed batch of ${blocks.length} blocks in ${duration}ms${speed > 0 ? ` (${speed} blocks/sec)` : ''}`
            )
        }
    }
}
