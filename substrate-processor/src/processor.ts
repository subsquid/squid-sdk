import assert from "assert"
import {Db} from "./db"
import {DataBatch, Ingest} from "./ingest"
import {BlockHandler, BlockHandlerContext, EventHandler} from "./interfaces/handlerContext"
import {Hooks} from "./interfaces/hooks"
import {QualifiedName} from "./interfaces/substrate"
import {Range} from "./util/range"
import {assertNotNull} from "./util/util"


export class SubstrateProcessor {
    private indexer?: string = process.env.INDEXER_URL
    private hooks: Hooks = {pre: [], post: [], event: []}
    private blockRange: Range = {from: 0}
    private batchSize = 100

    constructor(private name: string) {}

    setIndexer(url: string): void {
        this.indexer = url
    }

    setBlockRange(range: Range): void {
        this.blockRange = range
    }

    setBatchSize(size: number): void {
        assert(size > 0)
        this.batchSize = size
    }

    addPreHook(fn: BlockHandler): void
    addPreHook(range: Range, fn: BlockHandler): void
    addPreHook(fnOrRange: BlockHandler | Range, fn?: BlockHandler): void {
        let handler: BlockHandler
        let range: Range | undefined
        if (typeof fnOrRange == 'function') {
            handler = fnOrRange
        } else {
            handler = assertNotNull(fn)
            range = fnOrRange
        }
        this.hooks.pre.push({handler, range})
    }

    addPostHook(fn: BlockHandler): void
    addPostHook(range: Range, fn: BlockHandler): void
    addPostHook(fnOrRange: BlockHandler | Range, fn?: BlockHandler): void {
        let handler: BlockHandler
        let range: Range | undefined
        if (typeof fnOrRange == 'function') {
            handler = fnOrRange
        } else {
            handler = assertNotNull(fn)
            range = fnOrRange
        }
        this.hooks.post.push({handler, range})
    }

    addEventHandler(eventName: QualifiedName, fn: EventHandler): void
    addEventHandler(eventName: QualifiedName, blockRange: Range, fn: EventHandler): void
    addEventHandler(eventName: QualifiedName, blockRangeOrHandler: Range | EventHandler, fn?: EventHandler): void {
        if (typeof blockRangeOrHandler === 'function') {
            this.hooks.event.push({
                event: eventName,
                handler: blockRangeOrHandler
            })
        } else {
            this.hooks.event.push({
                event: eventName,
                range: blockRangeOrHandler,
                handler: assertNotNull(fn)
            })
        }
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
            indexer: assertNotNull(this.indexer, 'use .setIndexer() to specify indexer url'),
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
            let {pre, post, events, blocks} = batch
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
                        let handlers = events[event.name] || []
                        for (let k = 0; k < handlers.length; k++) {
                            await handlers[k]({...ctx, event})
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
