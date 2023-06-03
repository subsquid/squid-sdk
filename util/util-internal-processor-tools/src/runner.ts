import type {Logger} from '@subsquid/logger'
import {assertNotNull, def, last, maybeLast} from '@subsquid/util-internal'
import assert from 'assert'
import {applyRangeBound, BatchRequest} from './batch'
import {Database, HashAndHeight, HotDatabaseState} from './database'
import {HotUpdate, Block, DataSource, HotDataSource, Batch} from './datasource'
import {PrometheusServer} from './prometheus'
import {rangeEnd} from './range'
import {RunnerMetrics} from './runner-metrics'
import {formatHead, getItemsCount} from './util'


export interface RunnerConfig<R, S> {
    archive?: DataSource<Block, R>
    hotDataSource?: HotDataSource<Block, R>
    process: (store: S, batch: Batch<Block>) => Promise<void>
    requests: BatchRequest<R>[]
    database: Database<S>
    log: Logger
    prometheus: PrometheusServer
}


export class Runner<R, S> {
    private metrics: RunnerMetrics
    private statusReportTimer?: any
    private hasStatusNews = false

    constructor(private config: RunnerConfig<R, S>) {
        this.metrics = new RunnerMetrics(this.config.requests)
        this.config.prometheus.addRunnerMetrics(this.metrics)
    }

    @def
    async run(): Promise<void> {
        let log = this.config.log

        let state = await this.getDatabaseState()
        if (state.height >= 0) {
            log.info(`last processed final block was ${state.height}`)
        }

        if (this.getLeftRequests(state).length == 0) {
            this.printProcessingRange()
            log.info('nothing to do')
            return
        }

        this.printProcessingMessage(state)

        const archive = this.config.archive
        const hot = this.config.hotDataSource

        if (archive) {
            let archiveHeight = await archive.getFinalizedHeight()
            if (archiveHeight > state.height + state.top.length || hot == null) {
                await this.initMetrics(archiveHeight, state)
                this.log.info('using archive data source')
                state = await this.processFinalizedBlocks({
                    state,
                    src: archive,
                    shouldStopOnHead: !!hot && this.config.database.supportsHotBlocks
                })
                if (this.getLeftRequests(state).length == 0) return
            }
        }

        assert(hot)

        let chainFinalizedHeight = await hot.getFinalizedHeight()
        await this.initMetrics(chainFinalizedHeight, state)
        this.log.info('using chain RPC data source')
        if (chainFinalizedHeight > state.height + state.top.length) {
            state = await this.processFinalizedBlocks({
                state,
                src: hot,
                shouldStopOnHead: this.config.database.supportsHotBlocks
            })
            if (this.getLeftRequests(state).length == 0) return
        }

        return this.processHotBlocks(state)
    }

    private async processFinalizedBlocks(args: {
        state: HotDatabaseState,
        src: DataSource<Block, R>
        shouldStopOnHead?: boolean
    }): Promise<HotDatabaseState> {
        let state = args.state
        let minimumCommitHeight = state.height + state.top.length
        let prevBatch: Batch<Block> | undefined

        for await (let batch of args.src.getFinalizedBlocks(
            this.getLeftRequests(args.state),
            args.shouldStopOnHead
        )) {
            if (prevBatch) {
                batch = {
                    blocks: prevBatch.blocks.concat(batch.blocks),
                    isHead: batch.isHead
                }
            }
            if (last(batch.blocks).header.height < minimumCommitHeight) {
                prevBatch = batch
            } else {
                prevBatch = undefined
                state = await this.handleFinalizedBlocks(state, batch)
            }
        }

        if (prevBatch) {
            state = await this.handleFinalizedBlocks(state, prevBatch)
        }

        return state
    }

    private async handleFinalizedBlocks(state: HotDatabaseState, batch: Batch<Block>): Promise<HotDatabaseState> {
        let lastBlock = last(batch.blocks)

        assert(state.height < lastBlock.header.height)

        let nextState: HotDatabaseState = {
            height: lastBlock.header.height,
            hash: lastBlock.header.hash,
            top: []
        }

        await this.withProgressMetrics(batch.blocks, () => {
            return this.config.database.transact({
                prevHead: state,
                nextHead: nextState,
                isOnTop: batch.isHead
            }, store => {
                return this.config.process(store, batch)
            })
        })

        return nextState
    }

    private async processHotBlocks(state: HotDatabaseState): Promise<void> {
        assert(this.config.database.supportsHotBlocks === true)
        let db = this.config.database
        let ds = assertNotNull(this.config.hotDataSource)
        let lastHead = maybeLast(state.top) || state

        for await (let upd of ds.getHotBlocks(this.getLeftRequests(state), state)) {
            let newHead = maybeLast(upd.blocks)?.header || upd.baseHead
            if (upd.baseHead.hash !== lastHead.hash) {
                this.log.info(`navigating a fork between ${formatHead(lastHead)} to ${formatHead(newHead)} with a common base ${formatHead(upd.baseHead)}`)
            }

            this.log.debug({hotUpdate: upd})

            await this.withProgressMetrics(upd.blocks, () => {
                return db.transactHot({
                    finalizedHead: upd.finalizedHead,
                    baseHead: upd.baseHead,
                    newBlocks: upd.blocks.map(b => b.header)
                }, (store, ref) => {
                    let idx = ref.height - upd.baseHead.height - 1
                    let block = upd.blocks[idx]

                    assert.strictEqual(block.header.hash, ref.hash)
                    assert.strictEqual(block.header.height, ref.height)

                    return this.config.process(store, {
                        blocks: [block],
                        isHead: newHead.height === ref.height
                    })
                })
            })
            lastHead = newHead
        }
    }

    private async withProgressMetrics<R>(blocks: Block[], handler: () => R): Promise<R> {
        let mappingStartTime = process.hrtime.bigint()

        let result = await handler()

        let mappingEndTime = process.hrtime.bigint()

        if (blocks.length > 0) {
            this.metrics.setLastProcessedBlock(last(blocks).header.height)
            this.metrics.updateProgress(mappingEndTime)
            this.metrics.registerBatch(
                blocks.length,
                getItemsCount(blocks),
                mappingStartTime,
                mappingEndTime
            )
        }
        this.reportStatus()
        return result
    }

    private reportStatus(): void {
        if (this.statusReportTimer == null) {
            this.log.info(this.metrics.getStatusLine())
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

    private async initMetrics(chainHeight: number, state: HotDatabaseState): Promise<void> {
        if (this.metrics.getChainHeight() >= 0) return
        this.metrics.setChainHeight(chainHeight)
        this.metrics.setLastProcessedBlock(state.height + state.top.length)
        this.metrics.updateProgress()
        return this.startPrometheusServer()
    }

    private getLeftRequests(after: HashAndHeight): BatchRequest<R>[] {
        return applyRangeBound(this.config.requests, {from: after.height + 1})
    }

    private getDatabaseState(): Promise<HotDatabaseState> {
        if (this.config.database.supportsHotBlocks) {
            return this.config.database.connect()
        } else {
            return this.config.database.connect().then(head => {
                return {...head, top: []}
            })
        }
    }

    private printProcessingRange(): void {
        if (this.config.requests.length == 0) return
        let requests = this.config.requests
        this.log.info(`processing range is [${requests[0].range.from}, ${last(requests).range.to}]`)
    }

    private printProcessingMessage(state: HashAndHeight): void {
        let from = Math.max(state.height + 1, this.config.requests[0].range.from)
        let end = rangeEnd(last(this.config.requests).range)
        let msg = `processing blocks from ${from}`
        if (Number.isSafeInteger(end)) {
            msg += ' to ' + end
        }
        this.log.info(msg)
    }

    @def
    private async startPrometheusServer(): Promise<void> {
        let prometheusServer = await this.config.prometheus.serve()
        this.log.info(`prometheus metrics are served at port ${prometheusServer.port}`)
    }

    private get log(): Logger {
        return this.config.log
    }
}