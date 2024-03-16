import type {Logger} from '@subsquid/logger'
import {assertNotNull, def, last, maybeLast, wait} from '@subsquid/util-internal'
import {applyRangeBound, rangeEnd, RangeRequest} from '@subsquid/util-internal-range'
import assert from 'assert'
import {Database, HashAndHeight, HotDatabaseState} from './database'
import {Batch, Block, DataSource, HotDataSource} from './datasource'
import {PrometheusServer} from './prometheus'
import {RunnerMetrics} from './runner-metrics'
import {formatHead, getItemsCount} from './util'


export interface RunnerConfig<R, S> {
    archive?: DataSource<Block, R>
    hotDataSource?: HotDataSource<Block, R>
    allBlocksAreFinal?: boolean
    process: (store: S, batch: Batch<Block>) => Promise<void>
    requests: RangeRequest<R>[]
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
                this.log.info('using archive data source')
                await this.assertWeAreOnTheSameChain(archive, state)
                await this.initMetrics(archiveHeight, state)
                state = await this.processFinalizedBlocks({
                    state,
                    src: archive,
                    shouldStopOnHead: !!hot
                }).finally(
                    this.chainHeightUpdateLoop(archive)
                )
                if (this.getLeftRequests(state).length == 0) return
            }
        }

        assert(hot)

        this.log.info('using chain RPC data source')
        await this.assertWeAreOnTheSameChain(hot, state)
        let chainFinalizedHeight = await hot.getFinalizedHeight()
        await this.initMetrics(chainFinalizedHeight, state)
        if (chainFinalizedHeight > state.height + state.top.length) {
            state = await this.processFinalizedBlocks({
                state,
                src: hot,
                shouldStopOnHead: this.config.database.supportsHotBlocks && !this.config.allBlocksAreFinal
            }).finally(
                this.chainHeightUpdateLoop(hot)
            )
            if (this.getLeftRequests(state).length == 0) return
        }

        if (chainFinalizedHeight > state.height + state.top.length) {
            // finalized block processing haven't kicked in during previous steps
            // this can happen if the next requested block is above the finalized head.
            // We'll advance the processor in order to:
            //   1. guarantee, that the state passed to `hot.getHotBlocks()` is a real block reference
            //      rather than a dummy `{height: -1, hash: '0x'}`.
            //   2. ease a work of `hot.getHotBlocks()`, which is likely not optimized for such case
            let nextRequestedBlock = this.getLeftRequests(state)[0].range.from
            assert(nextRequestedBlock > chainFinalizedHeight)
            let nextState = {
                height: chainFinalizedHeight,
                hash: assertNotNull(
                    await hot.getBlockHash(chainFinalizedHeight),
                    `finalized block ${chainFinalizedHeight} is not found in the data source`
                ),
                top: []
            }
            await this.config.database.transact({
                prevHead: state,
                nextHead: nextState,
                isOnTop: true
            }, async () => {})
            state = nextState
        }

        return this.processHotBlocks(state).finally(
            this.chainHeightUpdateLoop(hot)
        )
    }

    private async assertWeAreOnTheSameChain(src: DataSource<unknown, unknown>, state: HashAndHeight): Promise<void> {
        if (state.height < 0) return
        if (state.hash === '0x') {
            this.log.warn(
                'seems like we are migrating from the FireSquid, ' +
                'this can only work if the next block to index was already finalized ' +
                'or we are not indexing hot blocks at all'
            )
            return
        }
        let hash = await src.getBlockHash(state.height)
        if (state.hash !== hash) {
            throw new Error(
                `already indexed block ${formatHead(state)} was not found on chain`
            )
        }
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
        assert(this.config.database.supportsHotBlocks)
        let db = this.config.database
        let ds = assertNotNull(this.config.hotDataSource)
        let lastHead = maybeLast(state.top) || state
        return ds.processHotBlocks(
            this.getLeftRequests(state),
            state,
            async upd => {
                let newHead = maybeLast(upd.blocks)?.header || upd.baseHead

                if (upd.baseHead.hash !== lastHead.hash) {
                    this.log.info(`navigating a fork between ${formatHead(lastHead)} to ${formatHead(newHead)} with a common base ${formatHead(upd.baseHead)}`)
                }

                this.log.debug({hotUpdate: upd})

                let info = {
                    finalizedHead: upd.finalizedHead,
                    baseHead: upd.baseHead,
                    newBlocks: upd.blocks.map(b => b.header)
                }

                await this.withProgressMetrics(upd.blocks, () => {
                    if (db.transactHot2) {
                        return db.transactHot2(info, (store, blockSliceStart, blockSliceEnd) => {
                            return this.config.process(store, {
                                blocks: upd.blocks.slice(blockSliceStart, blockSliceEnd),
                                isHead: blockSliceEnd === upd.blocks.length
                            })
                        })
                    } else {
                        return db.transactHot(info, (store, ref) => {
                            let idx = ref.height - upd.baseHead.height - 1
                            let block = upd.blocks[idx]

                            assert.strictEqual(block.header.hash, ref.hash)
                            assert.strictEqual(block.header.height, ref.height)

                            return this.config.process(store, {
                                blocks: [block],
                                isHead: newHead.height === ref.height
                            })
                        })
                    }
                })

                lastHead = newHead
            }
        )
    }

    private chainHeightUpdateLoop(src: DataSource<unknown, unknown>): () => void {
        let abort = new AbortController()

        let loop = async () => {
            while (!abort.signal.aborted) {
                await wait(20_000, abort.signal)
                let newHeight = await src.getFinalizedHeight().catch(err => {
                    if (!abort.signal.aborted) {
                        this.log.error(err, 'failed to check chain height')
                    }
                    return this.metrics.getChainHeight()
                })
                this.metrics.setChainHeight(newHeight)
            }
        }

        loop().catch(err => {
            if (!abort.signal.aborted) {
                this.log.error(err, 'chain height metric update loop failed')
            }
        })

        return () => abort.abort()
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
        let initialized = this.metrics.getChainHeight() >= 0
        this.metrics.setChainHeight(chainHeight)
        if (initialized) return
        this.metrics.setLastProcessedBlock(state.height + state.top.length)
        this.metrics.updateProgress()
        return this.startPrometheusServer()
    }

    private getLeftRequests(after: HashAndHeight): RangeRequest<R>[] {
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
