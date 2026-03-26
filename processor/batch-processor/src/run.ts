import {createLogger} from '@subsquid/logger'
import {last, maybeLast, runProgram, Throttler} from '@subsquid/util-internal'
import {HashAndHeight, Database} from './database'
import {DataSource, isForkException, BlockRef, type BlockBatch} from '@subsquid/util-internal-data-source'
import assert from 'assert'
import {PrometheusServer, RunnerMetrics} from '@subsquid/util-internal-processor-tools'
import {formatHead, getItemsCount} from './util'


export {PrometheusServer}


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


interface RunOptions {
    prometheus?: PrometheusServer
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
    dataHandler: (ctx: DataHandlerContext<Block, Store>) => Promise<void>,
    opts?: RunOptions
): void {
    runProgram(() => {
        return new Processor(src, db, dataHandler, opts).run()
    }, err => {
        log.fatal(err)
    })
}

class Processor<B extends BlockBase, S> {
    private metrics: RunnerMetrics
    private statusReportTimer?: any
    private hasStatusNews = false

    constructor(
        private src: DataSource<B>,
        private db: Database<S>,
        private handler: (ctx: DataHandlerContext<B, S>) => Promise<void>,
        private readonly opts?: RunOptions
    ) {
        this.metrics = new RunnerMetrics(
            src.getBlocksCountInRange?.bind(src) ?? ((range) => Math.max(0, range.to - range.from + 1)),
        )
    }

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

        let getStream = this.db.supportsHotBlocks
            ? this.src.getStream.bind(this.src)
            : this.src.getFinalizedStream.bind(this.src)

        while (true) {
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

        let prometheusServer: PrometheusServer | undefined
        if (this.opts?.prometheus != null) {
            prometheusServer = this.opts.prometheus
        } else if (port != null) {
            prometheusServer = new PrometheusServer()
            prometheusServer.setPort(port)
        }
        if (prometheusServer == null) return

        prometheusServer.addRunnerMetrics(this.metrics)
        let listening = await prometheusServer.serve()
        log.info(`prometheus metrics are served on port ${listening.port}`)
    }

    private updateProgressMetrics(chainHeight: number, indexerHeight: number, time?: bigint): void {
        this.metrics.setChainHeight(chainHeight)
        this.metrics.setLastProcessedBlock(indexerHeight)
        this.metrics.updateProgress(time)
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

        if (finalizedHeadData != null && state.finalizedHead != null && finalizedHeadData.number <= state.finalizedHead.number) {
            finalizedHeadData = state.finalizedHead
        }

        let unfinalizedIndex = finalizedHeadData == null
            ? 0
            : blocks.findIndex((b) => b.header.number > finalizedHeadData.number)

        let nextHead = last(blocks).header
        let isOnTop = nextHead.number >= chainHeight

        let mappingStartTime = process.hrtime.bigint()
        let nextState: ProcessorState

        if (this.db.supportsHotBlocks) {
            let finalizedRef: BlockRef | undefined
            if (unfinalizedIndex < 0) {
                finalizedRef = last(blocks).header
            } else {
                finalizedRef = finalizedHeadData ?? blocks[unfinalizedIndex - 1]?.header
            }
            let finalizedHead = maxBlockRef(finalizedRef, state.finalizedHead)
            await this.db.transactHot2(
                {
                    finalizedHead: toHashAndHeight(finalizedHead),
                    baseHead: toHashAndHeight(prevHead),
                    newBlocks: blocks.map((b) => toHashAndHeight(b.header)),
                },
                (store, start, end) => {
                    return this.handler({
                        store,
                        blocks: (start === 0 && end === blocks.length) ? blocks : blocks.slice(start, end),
                        isHead: isOnTop,
                    })
                }
            )

            let newFinalizedHead = finalizedHead ?? state.finalizedHead
            let unfinalizedHeads = state.unfinalizedHeads
            if (newFinalizedHead) {
                let idx = unfinalizedHeads.findIndex((h) => h.number > newFinalizedHead!.number)
                unfinalizedHeads = idx < 0 ? [] : unfinalizedHeads.slice(idx)
            }
            if (unfinalizedIndex >= 0) {
                unfinalizedHeads = [
                    ...unfinalizedHeads,
                    ...blocks.slice(unfinalizedIndex).map((b) => ({number: b.header.number, hash: b.header.hash})),
                ]
            }
            nextState = {finalizedHead: newFinalizedHead, unfinalizedHeads}
        } else {
            assert(unfinalizedIndex < 0, 'non-hot database received unfinalized blocks')

            await this.db.transact(
                {
                    prevHead: toHashAndHeight(prevHead),
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

            nextState = {finalizedHead: nextHead, unfinalizedHeads: []}
        }

        let mappingEndTime = process.hrtime.bigint()

        this.updateProgressMetrics(chainHeight, nextHead.number, mappingEndTime)
        this.metrics.registerBatch(blocks.length, getItemsCount(blocks), mappingStartTime, mappingEndTime)

        this.reportStatus()

        return nextState
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

function toHashAndHeight(ref: BlockRef | undefined): HashAndHeight {
    if (ref == null) return {height: -1, hash: '0x'}
    return {height: ref.number, hash: ref.hash}
}

function toBlockRef(hashAndHeight: HashAndHeight): BlockRef {
    return {number: hashAndHeight.height, hash: hashAndHeight.hash}
}

function getStateHead(state: ProcessorState): BlockRef | undefined {
    return maybeLast(state.unfinalizedHeads) ?? state.finalizedHead
}

function maxBlockRef(a: BlockRef | undefined, b: BlockRef | undefined): BlockRef | undefined {
    if (a == null) return b
    if (b == null) return a
    return a.number >= b.number ? a : b
}
