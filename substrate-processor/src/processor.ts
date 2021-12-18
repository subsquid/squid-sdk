import {assertNotNull} from "@subsquid/util"
import assert from "assert"
import {Db} from "./db"
import {DataBatch, Ingest} from "./ingest"
import {BlockHandler, BlockHandlerContext, EventHandler, ExtrinsicHandler} from "./interfaces/handlerContext"
import {Hooks} from "./interfaces/hooks"
import {QualifiedName} from "./interfaces/substrate"
import {Range} from "./util/range"


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
        this._run().then(() => {
            process.exit()
        }, err => {
            console.log(err)
            process.exit(1)
        })
    }

    private async _run(): Promise<void> {
        let db = await Db.connect()

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

        let ingest = new Ingest({
            archive: assertNotNull(this.archive, 'use .setDataSource() to specify archive url'),
            range: blockRange,
            batchSize: this.batchSize,
            hooks: this.hooks
        })

        let ingestion = ingest.run().catch((err: Error) => err)

        await this.process(ingest, db)

        let ingestionResult = await ingestion
        if (ingestionResult instanceof Error) {
            throw ingestionResult
        }
    }

    private async process(ingest: Ingest, db: Db): Promise<void> {
        let beg = Date.now()
        let processed = 0
        let batch: DataBatch | null
        let startHeight = 0
        while (batch = await ingest.nextBatch()) {
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
            }
            processed += batch.blocks.length
            let end = Date.now()
            console.log(`Speed: ${Math.round(processed * 1000/ (end - beg))} blocks/sec`)

            if (batch.blocks.length > 0) {
                let height = batch.blocks[batch.blocks.length - 1].block.height
                if (startHeight > 0) {
                    console.log(`Progress: ${Math.round((height - startHeight) * 1000/ (end - beg))} blocks/sec`)
                } else {
                    startHeight = height
                }
            }
        }
    }
}
