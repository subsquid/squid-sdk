import {createLogger} from '@subsquid/logger'
import {last, maybeLast, runProgram, Throttler} from '@subsquid/util-internal'
import {createPrometheusServer} from '@subsquid/util-internal-prometheus-server'
import * as prom from 'prom-client'
import {HashAndHeight, Database, HotDatabaseState} from './database'
import {Metrics} from './metrics'
import {DataSource, isForkException, BlockRef} from '@subsquid/util-internal-data-source'
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
        this.chainHeight = new Throttler(() => this.src.getFinalizedHead()?.then((r) => r?.number ?? -1), 30_000)
    }

    async run(): Promise<void> {
        let finalizedHead: HashAndHeight
        let head: HashAndHeight
        if (this.db.supportsHotBlocks) {
            let state = await this.db.connect()
            finalizedHead = state
            head = last([state, ...state.top])
        } else {
            finalizedHead = head = await this.db.connect()
        }

        if (head.height >= 0) {
            log.info(`last processed block was ${head.height}`)
            await this.assertWeAreOnTheSameChain(finalizedHead)
        }

        await this.initMetrics(head.height)

        while (true) {
            try {
                let prevBlockNumber = head.height
                let prevBlockHash = head.height < 0 ? undefined : head.hash

                let stream = this.db.supportsHotBlocks
                    ? this.src.getStream({range: {from: prevBlockNumber + 1}, parentHash: prevBlockHash})
                    : this.src.getFinalizedStream({range: {from: prevBlockNumber + 1}, parentHash: prevBlockHash})

                for await (let data of stream) {
                    let finalizedHead: HashAndHeight =
                        data.finalizedHead == null
                            ? {height: -1, hash: '0x'}
                            : {
                                  height: data.finalizedHead.number,
                                  hash: data.finalizedHead.hash,
                              }

                    head = await this.processBatch(head, finalizedHead, data.blocks)
                }

                break
            } catch (e) {
                if (isForkException(e) && this.db.supportsHotBlocks) {
                    let state = await this.db.getState()
                    let forkBase = await computeForkBase(state, e.prevBlocks)
                    if (forkBase == null) {
                        // rollback all blocks
                        head = {height: -1, hash: '0x'}
                    } else {
                        head = forkBase
                    }
                    log.info(`navigating a fork on a common base ${formatHead(head)}`)
                } else {
                    throw e
                }
            }
        }

        this.reportFinalStatus()
    }

    private async assertWeAreOnTheSameChain(state: HashAndHeight): Promise<void> {
        // if (state.height < 0) return
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

    private async processBatch(
        prevHead: HashAndHeight,
        finalizedHead: HashAndHeight,
        blocks: B[]
    ): Promise<HashAndHeight> {
        let chainHeight = await this.chainHeight.get()

        let lastBlock = maybeLast(blocks)
        if (lastBlock == null) return prevHead

        let nextHead = {
            hash: lastBlock.header.hash,
            height: lastBlock.header.number,
        }

        let isOnTop = nextHead.height >= chainHeight

        let mappingStartTime = process.hrtime.bigint()

        if (this.db.supportsHotBlocks) {
            await this.db.transactHot2(
                {
                    finalizedHead,
                    baseHead: prevHead,
                    newBlocks: blocks.map((b) => ({
                        hash: b.header.hash,
                        height: b.header.number,
                    })),
                },
                (store, start, end) => {
                    return this.handler({
                        store,
                        blocks: blocks.slice(start, end),
                        isHead: isOnTop,
                    })
                }
            )
        } else {
            await this.db.transact(
                {
                    prevHead,
                    nextHead,
                    isOnTop,
                },
                (store) => {
                    return this.handler({
                        store,
                        blocks,
                        isHead: isOnTop,
                    })
                }
            )
        }

        let mappingEndTime = process.hrtime.bigint()

        this.updateProgressMetrics(chainHeight, nextHead.height, mappingEndTime)
        this.metrics.registerBatch(blocks.length, getItemsCount(blocks), mappingStartTime, mappingEndTime)

        this.reportStatus()

        return nextHead
    }

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
    state: HotDatabaseState,
    forked: BlockRef[],
    finalizedHead?: BlockRef
): Promise<HashAndHeight | undefined> {
    assert(forked?.length)
    let tail = forked.slice()

    let commited = state.top
    if (commited.length > 0) {
        for (let i = commited.length - 1; i >= 0; i--) {
            let h = commited[i]

            while (tail.length > 0 && last(tail).number > h.height) {
                tail.pop()
            }

            if (tail.length == 0) return h

            let t = last(tail)
            if (t.number == h.height && t.hash == h.hash) return h
        }
    } else {
        if (forked[0].number > state.height) return state

        let headOnChain = forked.find((b) => b.number == state.height)
        if (headOnChain == null || headOnChain.hash !== state.hash) {
            if (finalizedHead && finalizedHead.number >= state.height) {
                throw new Error(`finalized block ${formatHead(state)} was not found on chain`)
            }
        }

        return state
    }
}
