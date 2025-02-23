import {createLogger} from '@subsquid/logger'
import {last, runProgram, Throttler} from '@subsquid/util-internal'
import {createPrometheusServer} from '@subsquid/util-internal-prometheus-server'
import * as prom from 'prom-client'
import {BlockRef, Database} from './database'
import {Metrics} from './metrics'
import {DataSource, DataSourceForkError} from '@subsquid/util-internal-data-source'
import assert from 'assert'
import {formatHead, getItemsCount} from './util'

const log = createLogger('sqd:batch-processor')

export interface DataHandlerContext<Block, Store> {
    /**
     * Storage interface provided by the database
     */
    store: Store
    /**
     * List of blocks to map and process
     */
    blocks: Block[]
    /**
     * Signals, that the processor is near the head of the chain.
     */
    isHead: boolean
}

export interface BlockBase {
    header: BlockRef
}

/**
 * Run data processing.
 *
 * This method assumes full control over the current OS process as
 * it terminates the entire program in case of error or
 * at the end of data processing.
 *
 * @param src - data source to ingest data from
 *
 * @param db - database is responsible for providing storage API to data handler
 * and persisting mapping progress and status.
 *
 * @param dataHandler - The data handler, see {@link DataHandlerContext} for an API available to the handler.
 */
export function run<Block extends BlockBase, Store>(
    src: DataSource<Block>,
    db: Database<Store>,
    dataHandler: (ctx: DataHandlerContext<Block, Store>) => Promise<void>
): void {
    runProgram(
        () => {
            return new Processor(src, db, dataHandler).run()
        },
        (err) => {
            log.fatal(err)
        }
    )
}

class Processor<B extends BlockBase, S> {
    private metrics = new Metrics()
    private chainHeight: Throttler<number>
    private statusReportTimer?: any
    private hasStatusNews = false

    constructor(
        private src: DataSource<B>,
        private db: Database<S>,
        private handler: (ctx: DataHandlerContext<B, S>) => Promise<void>
    ) {
        this.chainHeight = new Throttler(() => this.src.getHead()?.then((r) => r?.number ?? -1), 30_000)
    }

    async run(): Promise<void> {
        let head = await this.db.getHead()
        if (head != null) {
            log.info(`last processed final block was ${head.number}`)
        }

        // await this.assertWeAreOnTheSameChain(state)
        let prevBlockNumber = head?.number ?? -1
        let prevBlockHash = head?.hash

        await this.initMetrics(prevBlockNumber)

        while (true) {
            try {
                let stream = this.src.getStream({
                    range: {from: prevBlockNumber + 1},
                    parentBlockHash: prevBlockHash,
                })

                let lastBlock: BlockRef | undefined
                for await (let {blocks, finalizedHead} of stream) {
                    let mappingStartTime = process.hrtime.bigint()

                    await this.db.commit(async (tx) => {
                        assert.deepEqual(
                            tx.prevHead,
                            head,
                            'seems like more than one concurrent process tries to modify this database'
                        )

                        if (tx.prevHead && blocks.length > 0 && blocks[0].header.number <= tx.prevHead.number) {
                            // we've got a fork
                            await tx.rollback(prevBlockNumber)
                        }

                        let firstHotBlockPos = 0

                        lastBlock = last(blocks).header
                        let isOnTop = !!head && lastBlock.number >= head?.number

                        if (finalizedHead != null) {
                            if (blocks.length == 0) {
                                await tx.finalize(finalizedHead)
                                return
                            }

                            let finalizedEnd = blocks.findIndex((block) => block.header.number > finalizedHead!.number)
                            if (finalizedEnd < 0) {
                                finalizedEnd = blocks.length
                            }
                            assert(finalizedEnd > 0)

                            firstHotBlockPos = finalizedEnd
                            let finalizedBlocks = blocks.slice(0, finalizedEnd)

                            let lastRef = finalizedEnd < blocks.length ? finalizedHead : last(finalizedBlocks).header
                            await tx.processFinalizedBlocks(lastRef, async (store) => {
                                return this.handler({
                                    blocks: finalizedBlocks,
                                    store,
                                    isHead: isOnTop,
                                })
                            })
                        }

                        if (firstHotBlockPos < blocks.length) {
                            let unfinalizedBlocks = blocks.slice(firstHotBlockPos)
                            for (let block of unfinalizedBlocks) {
                                await tx.processUnfinalizedBlocks(block.header, async (store) => {
                                    return this.handler({
                                        blocks: [block],
                                        store,
                                        isHead: isOnTop,
                                    })
                                })
                            }
                        }
                    })

                    // after successful execution of update transaction,
                    // the head is always on `stream.lastBlockNumber`.
                    // Save it, to check, that no-one else modifies the database
                    head = lastBlock ? {number: lastBlock.number, hash: lastBlock.hash} : undefined

                    let mappingEndTime = process.hrtime.bigint()

                    if (head != null) {
                        this.updateProgressMetrics(-1, head.number, mappingEndTime)
                        this.metrics.registerBatch(
                            blocks.length,
                            getItemsCount(blocks),
                            mappingStartTime,
                            mappingEndTime
                        )

                        this.reportStatus()
                    }
                }

                break
            } catch (e) {
                if (e instanceof DataSourceForkError) {
                    let forkBase = await computeForkBase(this.db, e.lastBlocks)
                    log.info(`navigating a fork${forkBase ? ` on a common base ${formatHead(forkBase)}` : ``}`)
                    if (forkBase == null) {
                        // rollback all blocks
                        prevBlockNumber = -1
                        prevBlockHash = undefined
                    } else {
                        prevBlockNumber = forkBase.number
                        prevBlockHash = forkBase.hash
                    }
                } else {
                    throw e
                }
            }
        }

        this.reportFinalStatus()
    }

    private async assertWeAreOnTheSameChain(state: BlockRef): Promise<void> {
        return
        // if (state.number < 0) return
        // let hash = await this.src.getBlockHash(state.number)
        // if (state.hash === hash) return
        // throw new Error(
        //     `already indexed block ${formatHead(state)} was not found on chain`
        // )
    }

    private async initMetrics(state: number): Promise<void> {
        this.updateProgressMetrics(await this.chainHeight.get(), state)
        let port = process.env.PROCESSOR_PROMETHEUS_PORT || process.env.PROMETHEUS_PORT
        if (port == null) return
        prom.collectDefaultMetrics()
        this.metrics.install()
        let server = await createPrometheusServer(prom.register, port)
        log.info(`prometheus metrics are served on port ${server.port}`)
    }

    private updateProgressMetrics(chainHeight: number, indexerHeight: number, time?: bigint): void {
        this.metrics.setChainHeight(chainHeight)
        this.metrics.setLastProcessedBlock(indexerHeight)
        let left: number
        let processed: number
        left = this.metrics.getChainHeight() - this.metrics.getLastProcessedBlock()
        processed = this.metrics.getLastProcessedBlock()
        this.metrics.updateProgress(processed, left, time)
    }

    // private async processBatch(prevHead: HashAndHeight, finalizedHead: BlockRef | undefined, blocks: B[]): Promise<HashAndHeight> {
    //     let chainHeight = await this.chainHeight.get()

    //     let nextHead = {
    //         hash: last(blocks).header.hash,
    //         height: last(blocks).header.number
    //     }

    //     let isOnTop = nextHead.height >= chainHeight

    //     let mappingStartTime = process.hrtime.bigint()

    //     await this.db.transact({
    //         prevHead,
    //         nextHead,
    //         isOnTop
    //     }, store => {
    //         return this.handler({
    //             store,
    //             blocks,
    //             isHead: isOnTop
    //         })
    //     })

    //     let mappingEndTime = process.hrtime.bigint()

    //     this.updateProgressMetrics(chainHeight, nextHead, mappingEndTime)
    //     this.metrics.registerBatch(
    //         blocks.length,
    //         getItemsCount(blocks),
    //         mappingStartTime,
    //         mappingEndTime
    //     )

    //     this.reportStatus()

    //     return nextHead
    // }

    private reportStatus(): void {
        if (this.statusReportTimer == null) {
            log.info(this.metrics.getStatusLine())
            this.statusReportTimer = setTimeout(() => {
                this.statusReportTimer = undefined
                if (this.hasStatusNews) {
                    this.hasStatusNews = false
                    this.reportStatus()
                }
            }, 5000)
        } else {
            this.hasStatusNews = true
        }
    }

    private reportFinalStatus(): void {
        if (this.statusReportTimer != null) {
            clearTimeout(this.statusReportTimer)
        }
        if (this.hasStatusNews) {
            this.hasStatusNews = false
            log.info(this.metrics.getStatusLine())
        }
    }
}

async function computeForkBase(
    db: Database<unknown>,
    forked: BlockRef[],
    finalizedHead?: BlockRef
): Promise<BlockRef | undefined> {
    assert(forked?.length)
    let tail = forked.slice()

    while (true) {
        let commited = await db.getUnfinalizedBlocks(last(tail).number)
        if (commited.length == 0) return checkFinalizedHeadAsForkBase(db, forked, finalizedHead)

        for (let i = commited.length - 1; i >= 0; i--) {
            let h = commited[i]

            while (tail.length > 0 && last(tail).number > h.number) {
                tail.pop()
            }

            if (tail.length == 0) return h

            let t = last(tail)
            if (t.number == h.number && t.hash == h.hash) return h
        }
    }
}

async function checkFinalizedHeadAsForkBase(
    db: Database<unknown>,
    forked: BlockRef[],
    finalizedHead?: BlockRef
): Promise<BlockRef | undefined> {
    let head = await db.getFinalizedHead()
    if (head == null) return undefined

    assert(forked?.length)
    if (forked[0].number > head.number) return head

    let headOnChain = forked.find((b) => b.number == head!.number)
    if (headOnChain == null || headOnChain.hash !== head.hash) {
        if (finalizedHead && finalizedHead.number >= head.number) {
            throw new Error(`finalized block ${head.number}#${head.hash} was not found on chain`)
        }
    }

    return head
}
