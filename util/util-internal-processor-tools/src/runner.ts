import type {Logger} from '@subsquid/logger'
import {last} from '@subsquid/util-internal'
import {applyRangeBound, BatchRequest, getBlocksCount} from './batch'
import {Database} from './database'
import {BlockBase, DataBatch, DataSource, Ingest} from './ingest'
import {Metrics} from './metrics'
import {rangeEnd} from './range'


export interface RunnerConfig<R, B, S> {
    src: DataSource<R, B>
    srcPollInterval?: number
    requests: BatchRequest<R>[]
    database: Database<S>
    log: Logger
    metrics: Metrics
    prometheusPort?: number | string
}


export class Runner<R, B extends BlockBase, S> {
    private chainHeight = -1
    private lastBlock = -1

    constructor(protected config: RunnerConfig<R, B, S>) {}

    async run(): Promise<void> {
        let log = this.config.log

        let heightAtStart = await this.config.database.connect()
        if (heightAtStart >= 0) {
            log.info(`last processed block was ${heightAtStart}`)
            this.setLastProcessedBlock(heightAtStart)
        }

        let requests = applyRangeBound(this.config.requests, {from: heightAtStart})
        if (requests.length == 0) {
            this.printProcessingRange()
            log.info('nothing to do')
            return
        }

        this.printProcessingMessage(requests)
        this.setChainHeight(await this.config.src.getChainHeight())
        this.updateProgress()

        let prometheusServer = await this.config.metrics.serve(this.getPrometheusPort())
        log.info(`prometheus metrics are served at port ${prometheusServer.port}`)

        let ingest = new Ingest({
            requests,
            src: this.config.src,
            pollInterval: this.config.srcPollInterval
        })

        for await (let batch of ingest.getBlocks()) {
            await this.handleBatch(batch)
        }
    }

    private async handleBatch(batch: DataBatch<R, B>): Promise<void> {
        this.setChainHeight(batch.chainHeight)

        let lastBlock = batch.range.to
        let mappingStartTime = process.hrtime.bigint()

        if (batch.blocks.length) {
            await this.config.database.transact(
                batch.range.from,
                batch.range.to,
                store => this.processBatch(store, batch)
            )
        }

        await this.config.database.advance(lastBlock, batch.isHead)

        let mappingEndTime = process.hrtime.bigint()

        this.setLastProcessedBlock(lastBlock)
        this.updateProgress(mappingEndTime)
        this.config.metrics.registerBatch(
            batch.blocks.length,
            batch.itemsCount,
            batch.fetchStartTime,
            batch.fetchEndTime,
            mappingStartTime,
            mappingEndTime
        )
    }

    async processBatch(store: S, batch: DataBatch<R, B>): Promise<void> {}

    private getEstimatedTotalBlocksCount(): number {
        return getBlocksCount(this.config.requests, 0,  this.chainHeight)
    }

    private getEstimatedBlocksLeft(): number {
        return getBlocksCount(this.config.requests, this.lastBlock + 1, this.chainHeight)
    }

    private setChainHeight(height: number): void {
        this.chainHeight = height
        this.config.metrics.setChainHeight(height)
    }

    private setLastProcessedBlock(blockNumber: number): void {
        this.lastBlock = blockNumber
        this.config.metrics.setLastProcessedBlock(blockNumber)
    }

    private updateProgress(time?: bigint): void {
        this.config.metrics.updateProgress(
            this.chainHeight,
            this.getEstimatedTotalBlocksCount(),
            this.getEstimatedBlocksLeft(),
            time
        )
    }

    private getPrometheusPort(): number | string {
        let port = this.config.prometheusPort
        return port == null
            ? process.env.PROCESSOR_PROMETHEUS_PORT || process.env.PROMETHEUS_PORT || 0
            : port
    }

    private printProcessingRange(): void {
        if (this.config.requests.length == 0) return
        let requests = this.config.requests
        this.config.log.info(`processing range is [${requests[0].range.from}, ${last(requests).range.to}]`)
    }

    private printProcessingMessage(requests: BatchRequest<R>[]): void {
        let from = requests[0].range.from
        let end = rangeEnd(last(requests).range)
        let msg = `processing blocks from ${from}`
        if (Number.isSafeInteger(end)) {
            msg += ' to ' + end
        }
        this.config.log.info(msg)
    }
}
