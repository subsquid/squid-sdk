import {createLogger} from '@subsquid/logger'
import {last, maybeLast, runProgram, Throttler} from '@subsquid/util-internal'
import {createPrometheusServer} from '@subsquid/util-internal-prometheus-server'
import * as prom from 'prom-client'
import {DataSink, DataSinkState, HashAndHeight} from './database'
import {BlocksData, DataSource} from './datasource'
import {Metrics} from './metrics'
import {formatHead, getItemsCount} from './util'
import assert from 'assert'
import {AlreadyIndexedBlockNotFoundError, FinalizedHeadBelowStateError} from './errors'


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
    db: DataSink<Store>,
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

const RACE_MSG = 'status table was updated by foreign process, make sure no other processor is running'

export class Processor<B extends BlockBase, S> {
    private metrics = new Metrics()
    private chainHeight: Throttler<number>
    private statusReportTimer?: any
    private hasStatusNews = false

    /**
     * Constructs a new instance of the Processor class.
     *
     * @param src - data source to ingest data from
     * 
     * @param db - database is responsible for providing storage API to data handler
     * and persisting mapping progress and status
     * 
     * @param dataHandler - The data handler, see {@link DataHandlerContext} for an API available to the handler.
     */
    constructor(
        private src: DataSource<B>,
        private db: DataSink<S>,
        private handler: (ctx: DataHandlerContext<B, S>) => Promise<void>
    ) {
        this.chainHeight = new Throttler(() => this.src.getFinalizedHeight(), 30_000)
    }

    async run(): Promise<void> {
        let state = await this.db.connect()

        // remove all hot block to start from the finalized head
        if (state.top.length) {
            await this.db.transaction(async (tx) => {
                for (let i = state.top.length - 1; i >= 0; i--) {
                    await tx.rollbackHotBlock(state.top[i])
                    state.top.pop()
                }
            })
        }

        if (state.height >= 0) {
            log.info(`last processed final block was ${state.height}`)
        }

        await this.assertWeAreOnTheSameChain(state)
        await this.initMetrics(state)

        for await (let data of this.src.getBlockStream({
            range: {from: state.height + 1},
            supportHotBlocks: this.db.supportsHotBlocks,
        })) {
            let mappingStartTime = process.hrtime.bigint()

            await this.processBlocksData(data)

            let mappingEndTime = process.hrtime.bigint()

            await this.updateProgressMetrics(maybeLast(data.blocks)?.header || data.finalizedHead, mappingEndTime)
            this.metrics.registerBatch(data.blocks.length, getItemsCount(data.blocks), mappingStartTime, mappingEndTime)
    
            this.reportStatus()
        }

        this.reportFinalStatus()
    }

    private async assertWeAreOnTheSameChain(state: HashAndHeight): Promise<void> {
        if (state.height < 0) return
        let hash = await this.src.getBlockHash(state.height)
        if (state.hash === hash) return
        throw new AlreadyIndexedBlockNotFoundError(state)
    }

    private async initMetrics(state: HashAndHeight): Promise<void> {
        await this.updateProgressMetrics(state)
        let port = process.env.PROCESSOR_PROMETHEUS_PORT || process.env.PROMETHEUS_PORT
        if (port == null) return
        prom.collectDefaultMetrics()
        this.metrics.install()
        let server = await createPrometheusServer(prom.register, port)
        log.info(`prometheus metrics are served on port ${server.port}`)
    }

    private async updateProgressMetrics(state: HashAndHeight, time?: bigint): Promise<void> {
        let chainHeight = await this.chainHeight.get()

        this.metrics.setChainHeight(chainHeight)
        this.metrics.setLastProcessedBlock(state.height)
        let left: number
        let processed: number
        if (this.src.getBlocksCountInRange) {
            left = this.src.getBlocksCountInRange({
                from: this.metrics.getLastProcessedBlock() + 1,
                to: this.metrics.getChainHeight(),
            })
            processed =
                this.src.getBlocksCountInRange({
                    from: 0,
                    to: this.metrics.getChainHeight(),
                }) - left
        } else {
            left = this.metrics.getChainHeight() - this.metrics.getLastProcessedBlock()
            processed = this.metrics.getLastProcessedBlock()
        }
        this.metrics.updateProgress(processed, left, time)
    }

    private async processBlocksData({finalizedHead, blocks, rollbacks}: BlocksData<B>): Promise<void> {
        await this.db.transaction(async (tx) => {
            let state = await tx.getState()

            assert(state.height <= finalizedHead.height, RACE_MSG)

            for (let block of rollbacks) {
                await tx.rollbackHotBlock(block)
            }
    
            if (blocks.length) {
                let firstHotBlockIndex = 0
                for (; firstHotBlockIndex < blocks.length; firstHotBlockIndex++) {
                    let b = blocks[firstHotBlockIndex].header
                    if (b.height > finalizedHead.height) break
                }
         
                if (firstHotBlockIndex > 0) {
                    let isHead = last(blocks).header.height === finalizedHead.height && firstHotBlockIndex === blocks.length
                    await tx.performUpdates(store => this.handler({
                        store,
                        blocks: blocks.slice(0, firstHotBlockIndex),
                        isHead,
                    }))
                }

                for (let i = firstHotBlockIndex; i < blocks.length; i++) {
                    let b = blocks[i].header
                    await tx.insertHotBlock(b)
                    await tx.performUpdates(
                        store => this.handler({
                            store,
                            blocks: blocks.slice(i, i + 1),
                            isHead: i === blocks.length - 1,
                        }),
                    )
                }
            }

            await tx.finalizeHotBlocks(finalizedHead.height)
    
            await tx.updateState(finalizedHead)
        })
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
