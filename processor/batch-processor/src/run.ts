import {createLogger} from '@subsquid/logger'
import {last, maybeLast, runProgram, Throttler} from '@subsquid/util-internal'
import {
    Database,
    DatabaseTransactResult,
    FinalDatabaseState,
    HashAndHeight,
    HotDatabaseState,
    TemplateMutation,
} from './database'
import {
    DataSource,
    isForkException,
    BlockRef,
    type BlockBatch,
    type TemplateRegistry as ITemplateRegistry,
    type TemplateValue,
} from '@subsquid/util-internal-data-source'
import {type TemplateManager, TemplateRegistry} from './template-registry'
import type {FiniteRange} from '@subsquid/util-internal-range'
import assert from 'assert'
import {PrometheusServer, RunnerMetrics} from '@subsquid/util-internal-processor-tools'
import {formatHead, getItemsCount} from './util'

export {PrometheusServer}
export type {TemplateManager} from './template-registry'

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
    /**
     * Templates manager to add and remove templates
     */
    templates: TemplateManager
}


export interface BlockBase {
    header: BlockRef
}


export interface RunOptions {
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
    db: Database<Store> & {supportsTemplates: true},
    dataHandler: (ctx: DataHandlerContext<Block, Store>) => Promise<DatabaseTransactResult | void>,
    opts?: RunOptions
): void
export function run<Block extends BlockBase, Store>(
    src: DataSource<Block>,
    db: Database<Store>,
    dataHandler: (ctx: Omit<DataHandlerContext<Block, Store>, 'templates'>) => Promise<DatabaseTransactResult | void>,
    opts?: RunOptions
): void
export function run<Block extends BlockBase, Store>(
    src: DataSource<Block>,
    db: Database<Store>,
    dataHandler: (ctx: DataHandlerContext<Block, Store>) => Promise<DatabaseTransactResult | void>,
    opts?: RunOptions
): void {
    runProgram(() => {
        return new Processor(src, db, dataHandler, opts).run()
    }, err => {
        log.fatal(err)
    })
}

interface ProcessorStateInit {
    finalizedHead?: BlockRef
    unfinalizedHeads?: (BlockRef & {templates?: TemplateMutation[]})[]
    templates?: TemplateMutation[]
}


class ProcessorState implements ITemplateRegistry {
    finalizedHead: BlockRef | undefined = undefined
    unfinalizedHeads: BlockRef[] = []
    private templates = new TemplateRegistry()

    get head(): BlockRef | undefined {
        return maybeLast(this.unfinalizedHeads) ?? this.finalizedHead
    }

    get(key: string): TemplateValue[] {
        return this.templates.get(key)
    }

    init(state: ProcessorStateInit): void {
        this.finalizedHead = state.finalizedHead
        this.unfinalizedHeads = state.unfinalizedHeads ?? []

        let hotBlockTemplates = state.unfinalizedHeads
            ?.filter((b) => b.templates?.length)
            .map((b) => ({blockNumber: b.number, templates: b.templates!}))

        if (state.templates?.length || hotBlockTemplates?.length) {
            log.info('loading persisted templates')
            this.templates.init(state.templates ?? [], hotBlockTemplates)
        }
    }

    handleFork(previousBlocks: BlockRef[]): void {
        let chain = this.finalizedHead ? [this.finalizedHead, ...this.unfinalizedHeads] : this.unfinalizedHeads
        let rollbackIndex = findRollbackIndex(chain, previousBlocks)
        if (rollbackIndex === -1) {
            if (this.finalizedHead != null) throw new Error('Unable to process fork')
            this.unfinalizedHeads = []
            this.templates.rollbackTo(-1)
        } else {
            let rollbackHead = chain[rollbackIndex]
            log.info(`navigating a fork on a common base ${formatHead(rollbackHead)}`)
            this.unfinalizedHeads = chain.slice(1, rollbackIndex + 1)
            this.templates.rollbackTo(rollbackHead.number)
        }
    }

    prune(blockNumber: number): void {
        this.templates.prune(blockNumber)
    }

    commitTemplates(): void {
        this.templates.commit()
    }

    async transact(
        range: FiniteRange,
        fn: (templates: TemplateManager) => Promise<void>,
    ): Promise<{data: TemplateMutation[]; changed: boolean}> {
        return this.templates.transact(range, fn)
    }
}

class Processor<B extends BlockBase, S> {
    private metrics: RunnerMetrics
    private statusReportTimer?: any
    private hasStatusNews = false
    private state = new ProcessorState()

    constructor(
        private src: DataSource<B>,
        private db: Database<S>,
        private handler: (ctx: DataHandlerContext<B, S>) => Promise<DatabaseTransactResult | void>,
        private readonly opts?: RunOptions
    ) {
        this.metrics = new RunnerMetrics(
            src.getBlocksCountInRange?.bind(src) ?? ((range) => Math.max(0, range.to - range.from + 1)),
        )
    }

    async run(): Promise<void> {
        let getHead = this.db.supportsHotBlocks
            ? this.src.getHead.bind(this.src)
            : this.src.getFinalizedHead.bind(this.src)
        let chainHeight = new Throttler(() => getHead().then((r) => r.number), 10_000)

        let dbState = await this.db.connect()
        this.state.init(toProcessorStateInit(dbState))

        let head = this.state.head
        if (head != null) {
            log.info(`last processed block was ${head.number}`)
        }
        await this.initMetrics(head?.number ?? -1, await chainHeight.get())

        let getStream = this.db.supportsHotBlocks
            ? this.src.getStream.bind(this.src)
            : this.src.getFinalizedStream.bind(this.src)

        while (true) {
            try {
                for await (let data of getStream({
                    from: (this.state.head?.number ?? -1) + 1,
                    parentHash: this.state.head?.hash,
                    templateRegistry: this.state,
                })) {
                    await this.processBatch(
                        data,
                        await chainHeight.get(),
                        async (store: S, sliceBlocks: B[], isOnTop: boolean) => {
                            let batchRange = {from: sliceBlocks[0].header.number, to: last(sliceBlocks).header.number}

                            const {data: newTemplates, changed} = await this.state.transact(
                                batchRange,
                                async (templates) => {
                                    await this.handler({store, blocks: sliceBlocks, isHead: isOnTop, templates})
                                },
                            )

                            if (changed) {
                                throw new TemplateRegistryChanged()
                            }

                            return {templates: newTemplates}
                    })
                }
                break
            } catch (e) {
                if (isTemplateRegistryChanged(e)) {
                    log.info('template registry updated, re-fetching stream with new filters')
                    continue
                }

                if (!isForkException(e) || !this.db.supportsHotBlocks) throw e
                this.state.handleFork(e.previousBlocks)
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
        data: BlockBatch<B>,
        chainHeight: number,
        map: (store: S, blocks: B[], isOnTop: boolean) => Promise<DatabaseTransactResult | void>
    ): Promise<void> {
        let {blocks, finalizedHead: finalizedHeadData} = data

        if (blocks.length === 0) return

        let prevHead = this.state.head

        if (prevHead && prevHead.number >= blocks[0].header.number) {
            throw new Error('Data is not continuous')
        }

        if (
            finalizedHeadData != null &&
            this.state.finalizedHead != null &&
            finalizedHeadData.number <= this.state.finalizedHead.number
        ) {
            finalizedHeadData = this.state.finalizedHead
        }

        let unfinalizedIndex =
            finalizedHeadData == null ? 0 : blocks.findIndex((b) => b.header.number > finalizedHeadData!.number)

        let nextHead = last(blocks).header
        let isOnTop = nextHead.number >= chainHeight

        let mappingStartTime = process.hrtime.bigint()

        if (this.db.supportsHotBlocks) {
            let finalizedRef: BlockRef | undefined
            if (unfinalizedIndex < 0) {
                finalizedRef = last(blocks).header
            } else {
                finalizedRef = finalizedHeadData ?? blocks[unfinalizedIndex - 1]?.header
            }
            let finalizedHead = maxBlockRef(finalizedRef, this.state.finalizedHead)
            await this.db.transactHot2(
                {
                    finalizedHead: toHashAndHeight(finalizedHead),
                    baseHead: toHashAndHeight(prevHead),
                    newBlocks: blocks.map((b) => toHashAndHeight(b.header)),
                },
                async (store, start, end) => {
                    let sliceBlocks = start === 0 && end === blocks.length ? blocks : blocks.slice(start, end)
                    if (sliceBlocks.length === 0) return
                    return map(store, sliceBlocks, isOnTop)
                }
            )
            this.state.commitTemplates()

            let newFinalizedHead = finalizedHead ?? this.state.finalizedHead
            if (newFinalizedHead) {
                this.state.prune(newFinalizedHead.number)
            }
            let unfinalizedHeads = this.state.unfinalizedHeads
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
            this.state.finalizedHead = newFinalizedHead
            this.state.unfinalizedHeads = unfinalizedHeads
        } else {
            assert(unfinalizedIndex < 0, 'non-hot database received unfinalized blocks')

            await this.db.transact(
                {
                    prevHead: toHashAndHeight(prevHead),
                    nextHead: toHashAndHeight(nextHead),
                    isOnTop,
                },
                (store) => map(store, blocks, isOnTop)
            )
            this.state.commitTemplates()

            this.state.prune(nextHead.number)
            this.state.finalizedHead = nextHead
            this.state.unfinalizedHeads = []
        }

        let mappingEndTime = process.hrtime.bigint()

        this.updateProgressMetrics(chainHeight, nextHead.number, mappingEndTime)
        this.metrics.registerBatch(blocks.length, getItemsCount(blocks), mappingStartTime, mappingEndTime)

        this.reportStatus()
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

function toBlockRef(hh: HashAndHeight): BlockRef {
    return {number: hh.height, hash: hh.hash}
}

function toProcessorStateInit(dbState: FinalDatabaseState | HotDatabaseState): ProcessorStateInit {
    let top = 'top' in dbState ? dbState.top : undefined
    return {
        finalizedHead: dbState.height < 0 ? undefined : toBlockRef(dbState),
        unfinalizedHeads: top?.map(b => ({...toBlockRef(b), templates: b.templates})),
        templates: dbState.templates,
    }
}

function maxBlockRef(a: BlockRef | undefined, b: BlockRef | undefined): BlockRef | undefined {
    if (a == null) return b
    if (b == null) return a
    return a.number >= b.number ? a : b
}

export class TemplateRegistryChanged extends Error {
    readonly isTemplateRegistryChanged = true
    readonly name = 'TemplateRegistryChanged'
}

export function isTemplateRegistryChanged(err: unknown): err is TemplateRegistryChanged {
    return err instanceof TemplateRegistryChanged
}
