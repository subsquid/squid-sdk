import {createLogger} from '@subsquid/logger'
import {last, maybeLast, runProgram, Throttler} from '@subsquid/util-internal'
import {createPrometheusServer} from '@subsquid/util-internal-prometheus-server'
import * as prom from 'prom-client'
import {HashAndHeight, Database, HotDatabaseState} from './database'
import {Metrics} from './metrics'
import {DataSource, isForkException, BlockRef, type BlockBatch} from '@subsquid/util-internal-data-source'
import {formatHead, getItemsCount} from './util'
import assert from 'assert'

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

interface ProcessorState {
    finalizedHead: BlockRef | undefined
    unfinalizedHeads: BlockRef[]
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
    private statusReportTimer?: any
    private hasStatusNews = false

    constructor(
        private src: DataSource<B>,
        private db: Database<S>,
        private handler: (ctx: DataHandlerContext<B, S>) => Promise<void>
    ) {}

    async run(): Promise<void> {
        let getHead = this.db.supportsHotBlocks ? this.src.getHead.bind(this.src) : this.src.getFinalizedHead.bind(this.src)
        let chainHeight = new Throttler(() => getHead()?.then((r) => r?.number ?? -1), 10_000)

        let state: ProcessorState = {
            finalizedHead: undefined,
            unfinalizedHeads: [],
        }
        if (this.db.supportsHotBlocks) {
            let dbState = await this.db.connect()
            state.finalizedHead = dbState.height < 0 ? undefined : toBlockRef(dbState)
            state.unfinalizedHeads = dbState.top.map(toBlockRef)
        } else {
            let dbState = await this.db.connect()
            state.finalizedHead = dbState.height < 0 ? undefined : toBlockRef(dbState)
        }

        let head = getStateHead(state)
        if (head != null) {
            log.info(`last processed block was ${head.number}`)
        }
        await this.initMetrics(head?.number ?? -1, await chainHeight.get())

        while (true) {
            let getStream = this.db.supportsHotBlocks
                ? this.src.getStream.bind(this.src)
                : this.src.getFinalizedStream.bind(this.src)

            head = getStateHead(state)
            try {
                for await (let data of getStream({after: head})) {
                    state = await this.processBatch(state, data, await chainHeight.get())
                }
                break // Stream completed successfully, exit loop
            } catch (e) {
                if (!isForkException(e) || !this.db.supportsHotBlocks) throw e

                // Handle fork and continue loop to retry
                let chain = state.finalizedHead
                    ? [state.finalizedHead, ...state.unfinalizedHeads]
                    : state.unfinalizedHeads
                let rollbackIndex = findRollbackIndex(chain, e.previousBlocks)
                if (rollbackIndex === -1) {
                    if (state.finalizedHead != null) throw new Error('Unable to process fork')
                    state.unfinalizedHeads = []
                } else {
                    const rollbackHead = chain[rollbackIndex]
                    log.info(`navigating a fork on a common base ${formatHead(rollbackHead)}`)

                    state.unfinalizedHeads = chain.slice(1, rollbackIndex + 1)
                }
            }
        }

        this.reportFinalStatus()
    }

    private async initMetrics(state: number, chainHeight: number): Promise<void> {
        this.updateProgressMetrics(chainHeight, state)
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
        let left = this.metrics.getChainHeight() - this.metrics.getLastProcessedBlock()
        let processed = this.metrics.getLastProcessedBlock()
        this.metrics.updateProgress(processed, left, time)
    }

    private async processBatch(
        state: ProcessorState,
        data: BlockBatch<B>,
        chainHeight: number
    ): Promise<ProcessorState> {
        let {blocks, finalizedHead: finalizedHeadData} = data

        if (blocks.length === 0) return state

        let prevHead = getStateHead(state)

        // Validate data continuity
        if (prevHead && prevHead.number >= blocks[0].header.number) {
            throw new Error('Data is not continuous')
        }

        let unfinalizedIndex = 0
        if (finalizedHeadData != null) {
            unfinalizedIndex = blocks.findIndex((b) => b.header.number > finalizedHeadData!.number)
        }

        let nextHead = last(blocks).header
        let isOnTop = nextHead.number >= chainHeight

        let mappingStartTime = process.hrtime.bigint()

        // All new blocks are finalized
        if (unfinalizedIndex < 0) {
            const finalizedRef = blocks[blocks.length - 1].header
            state.finalizedHead = {number: finalizedRef.number, hash: finalizedRef.hash}
            state.unfinalizedHeads = []

            await this.db.transact(
                {
                    prevHead: prevHead ? toHashAndHeight(prevHead) : {height: -1, hash: '0x'},
                    nextHead: toHashAndHeight(nextHead),
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
        } else {
            assert(this.db.supportsHotBlocks)

            let finalizedRef: BlockRef | undefined = blocks[unfinalizedIndex - 1]?.header
            if (finalizedHeadData?.hash && finalizedHeadData?.number != null) {
                finalizedRef = {hash: finalizedHeadData.hash, number: finalizedHeadData.number}
            }
            state.finalizedHead = finalizedRef ?? state.finalizedHead

            // Finalize all hot heads that are older than the cold head
            if (state.finalizedHead) {
                let finalizeIndex = state.unfinalizedHeads.findIndex((h) => h.number > state.finalizedHead!.number)
                state.unfinalizedHeads = finalizeIndex < 0 ? [] : state.unfinalizedHeads.slice(finalizeIndex)
            }

            // Process unfinalized blocks
            for (let i = unfinalizedIndex; i < blocks.length; i++) {
                state.unfinalizedHeads.push({number: blocks[i].header.number, hash: blocks[i].header.hash})
            }

            await this.db.transactHot2(
                {
                    finalizedHead: toHashAndHeight(finalizedHeadData ?? state.finalizedHead),
                    baseHead: toHashAndHeight(prevHead ?? state.finalizedHead),
                    newBlocks: blocks.map((b) => toHashAndHeight(b.header)),
                },
                (store, start, end) => {
                    return this.handler({
                        store,
                        blocks: blocks.slice(start, end),
                        isHead: isOnTop,
                    })
                }
            )
        }

        let mappingEndTime = process.hrtime.bigint()

        this.updateProgressMetrics(chainHeight, nextHead.number, mappingEndTime)
        this.metrics.registerBatch(blocks.length, getItemsCount(blocks), mappingStartTime, mappingEndTime)

        this.reportStatus()

        return state
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
            }, 5_000)
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

function findRollbackIndex(currentChain: BlockRef[], forkChain: BlockRef[]): number {
    let currentIndex = 0
    let forkIndex = 0
    let lastCommonIndex = -1

    while (currentIndex < currentChain.length && forkIndex < forkChain.length) {
        const currentBlock = currentChain[currentIndex]
        const forkBlock = forkChain[forkIndex]

        if (currentBlock.number > forkBlock.number) {
            forkIndex++
            continue
        }

        if (currentBlock.number < forkBlock.number) {
            currentIndex++
            continue
        }

        if (currentBlock.hash !== forkBlock.hash) {
            return lastCommonIndex
        }

        lastCommonIndex = currentIndex
        currentIndex++
        forkIndex++
    }

    return lastCommonIndex
}

function toHashAndHeight(ref: BlockRef): HashAndHeight {
    return {height: ref.number, hash: ref.hash}
}

function toBlockRef(hashAndHeight: HashAndHeight): BlockRef {
    return {number: hashAndHeight.height, hash: hashAndHeight.hash}
}

function getStateHead(state: ProcessorState): BlockRef | undefined {
    return maybeLast(state.unfinalizedHeads) ?? state.finalizedHead
}
