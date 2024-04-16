import {createLogger} from '@subsquid/logger'
import {last, runProgram, Throttler} from '@subsquid/util-internal'
import {createPrometheusServer} from '@subsquid/util-internal-prometheus-server'
import * as prom from 'prom-client'
import {Database, HashAndHeight} from './database'
import {DataSource} from './datasource'
import {Metrics} from './metrics'
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


interface BlockBase {
    header: HashAndHeight
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
    runProgram(() => {
        return new Processor(src, db, dataHandler).run()
    }, err => {
        log.fatal(err)
    })
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
        this.chainHeight = new Throttler(() => this.src.getFinalizedHeight(), 30_000)
    }

    async run(): Promise<void> {
        let state = await this.db.connect()
        if (state.height >= 0) {
            log.info(`last processed final block was ${state.height}`)
        }

        await this.assertWeAreOnTheSameChain(state)
        await this.initMetrics(state)

        for await (let blocks of this.src.getBlockStream(state.height + 1)) {
            if (blocks.length > 0) {
                state = await this.processBatch(state, blocks)
            }
        }

        this.reportFinalStatus()
    }

    private async assertWeAreOnTheSameChain(state: HashAndHeight): Promise<void> {
        if (state.height < 0) return
        let hash = await this.src.getBlockHash(state.height)
        if (state.hash === hash) return
        throw new Error(
            `already indexed block ${formatHead(state)} was not found on chain`
        )
    }

    private async initMetrics(state: HashAndHeight): Promise<void> {
        await this.updateProgressMetrics(await this.chainHeight.get(), state)
        let port = process.env.PROCESSOR_PROMETHEUS_PORT || process.env.PROMETHEUS_PORT
        if (port == null) return
        prom.collectDefaultMetrics()
        this.metrics.install()
        let server = await createPrometheusServer(prom.register, port)
        log.info(`prometheus metrics are served on port ${server.port}`)
    }

    private updateProgressMetrics(chainHeight: number, state: HashAndHeight, time?: bigint): void {
        this.metrics.setChainHeight(chainHeight)
        this.metrics.setLastProcessedBlock(state.height)
        let left: number
        let processed: number
        if (this.src.getBlocksCountInRange) {
            left = this.src.getBlocksCountInRange({
                from: this.metrics.getLastProcessedBlock() + 1,
                to: this.metrics.getChainHeight()
            })
            processed = this.src.getBlocksCountInRange({
                from: 0,
                to: this.metrics.getChainHeight()
            }) - left
        } else {
            left = this.metrics.getChainHeight() - this.metrics.getLastProcessedBlock()
            processed = this.metrics.getLastProcessedBlock()
        }
        this.metrics.updateProgress(processed, left, time)
    }

    private async processBatch(prevHead: HashAndHeight, blocks: B[]): Promise<HashAndHeight> {
        let chainHeight = await this.chainHeight.get()

        let nextHead = {
            hash: last(blocks).header.hash,
            height: last(blocks).header.height
        }

        let isOnTop = nextHead.height >= chainHeight

        let mappingStartTime = process.hrtime.bigint()

        await this.db.transact({
            prevHead,
            nextHead,
            isOnTop
        }, store => {
            return this.handler({
                store,
                blocks,
                isHead: isOnTop
            })
        })

        let mappingEndTime = process.hrtime.bigint()

        this.updateProgressMetrics(chainHeight, nextHead, mappingEndTime)
        this.metrics.registerBatch(
            blocks.length,
            getItemsCount(blocks),
            mappingStartTime,
            mappingEndTime
        )

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
