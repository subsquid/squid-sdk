import {Logger} from '@subsquid/logger'
import {OldTypes} from '@subsquid/substrate-metadata'
import {def, withErrorContext} from '@subsquid/util-internal'
import {FetchRequest, HttpAgent, HttpClient, HttpResponse} from '@subsquid/util-internal-http-client'
import {RpcClient} from '@subsquid/util-internal-resilient-rpc'
import {Batch, getBlocksCount} from '../batch/generic'
import {BatchRequest} from '../batch/request'
import {Chain, ChainManager} from '../chain'
import {BlockData, DataBatch, Ingest} from '../ingest'
import {Database} from '../interfaces/db'
import {Metrics} from '../metrics'
import {timeInterval} from '../util/misc'
import {Range} from '../util/range'


export interface Options {
    blockRange?: Range
    prometheusPort?: number | string
}


export interface Config<S, R> {
    getLogger(): Logger
    getDatabase(): Database<S>
    getOptions(): Options
    getTypes(specName: string, specVersion: number): OldTypes
    getChainEndpoint(): string
    getArchiveEndpoint(): string
    createBatches(blockRange: Range): Batch<R>[]
}


export class Runner<S, R extends BatchRequest> {
    private metrics = new Metrics()
    private _lastBlock = -1

    constructor(protected config: Config<S, R>) {}

    @def
    protected chainClient(): RpcClient {
        let url = this.config.getChainEndpoint()
        let log = this.config.getLogger().child('chain-rpc', {url})

        let client = new RpcClient({
            endpoints: [{url, capacity: 10}],
            requestTimeout: 20_000,
            log
        })

        this.metrics.addChainRpcMetrics(client)

        return client
    }

    @def
    protected archiveRequest(): (query: string) => Promise<any> {
        let metrics = this.metrics
        let archiveUrl = this.config.getArchiveEndpoint()

        class ArchiveClient extends HttpClient {
            protected beforeRetryPause(req: FetchRequest, reason: Error | HttpResponse, pause: number) {
                metrics.registerArchiveRetry(archiveUrl)
                super.beforeRetryPause(req, reason, pause)
            }
        }

        let http = new ArchiveClient({
            baseUrl: archiveUrl,
            headers: {
                'x-squid-id': this.getId()
            },
            agent: new HttpAgent({
                keepAlive: true
            }),
            retryAttempts: Number.MAX_SAFE_INTEGER,
            log: this.config.getLogger().child('archive-request')
        })

        return archiveQuery => {
            return http.graphqlRequest(archiveQuery).catch(withErrorContext({archiveQuery}))
        }
    }

    @def
    protected chainManager(): ChainManager {
        return new ChainManager({
            archiveRequest: this.archiveRequest(),
            getChainClient: () => this.chainClient(),
            getTypes: meta => this.config.getTypes(meta.specName, meta.specVersion)
        })
    }

    protected getWholeBlockRange(): Range {
        return this.config.getOptions().blockRange || {from: 0}
    }

    @def
    protected wholeRange(): {range: Range}[] {
        return this.config.createBatches(this.getWholeBlockRange())
    }

    protected get lastBlock(): number {
        return this._lastBlock
    }

    protected set lastBlock(height: number) {
        this._lastBlock = height
        this.metrics.setLastProcessedBlock(height)
    }

    async run(): Promise<void> {
        let log = this.config.getLogger()
        let heightAtStart = await this.config.getDatabase().connect()
        if (heightAtStart >= 0) {
            log.info(`last processed block was ${heightAtStart}`)
        }

        let blockRange = this.getWholeBlockRange()
        if (blockRange.to != null && blockRange.to < heightAtStart + 1) {
            log.info(`processing range is [${blockRange.from}, ${blockRange.to}]`)
            log.info('nothing to do')
            return
        } else {
            blockRange = {
                from: Math.max(heightAtStart + 1, blockRange.from),
                to: blockRange.to
            }
        }

        log.info(`processing blocks from ${blockRange.from}${blockRange.to == null ? '' : ' to ' + blockRange.to}`)

        let ingest = new Ingest({
            archiveRequest: this.archiveRequest(),
            batches: this.config.createBatches(blockRange),
        })

        this.metrics.updateProgress(
            await ingest.fetchArchiveHeight(),
            getBlocksCount(this.wholeRange(), 0, ingest.getLatestKnownArchiveHeight()),
            getBlocksCount(this.wholeRange(), heightAtStart + 1, ingest.getLatestKnownArchiveHeight()),
        )

        let prometheusServer = await this.metrics.serve(this.getPrometheusPort())
        log.info(`prometheus metrics are served at port ${prometheusServer.port}`)

        return this.process(ingest)
    }

    private async process(ingest: Ingest<R>): Promise<void> {
        for await (let batch of ingest.getBlocks()) {
            let packs = await this.splitBySpec(batch)
            let mappingStartTime = process.hrtime.bigint()

            for (let i = 0; i < packs.length; i++) {
                let pack = packs[i]
                let isHead = batch.isHead && i + 1 == packs.length
                await this.processBatch(batch.request, pack.chain, pack.blocks, isHead)
            }

            this.lastBlock = batch.range.to
            await this.config.getDatabase().advance(this.lastBlock, batch.isHead)

            let mappingEndTime = process.hrtime.bigint()

            this.metrics.updateProgress(
                ingest.getLatestKnownArchiveHeight(),
                getBlocksCount(this.wholeRange(), 0, ingest.getLatestKnownArchiveHeight()),
                getBlocksCount(this.wholeRange(), this.lastBlock + 1, ingest.getLatestKnownArchiveHeight()),
                mappingEndTime
            )

            this.metrics.registerBatch(
                batch.blocks.length,
                getItemsCount(batch.blocks),
                batch.fetchStartTime,
                batch.fetchEndTime,
                mappingStartTime,
                mappingEndTime
            )

            this.config.getLogger().info(
                `${this.lastBlock} / ${this.metrics.getChainHeight()}, ` +
                `rate: ${Math.round(this.metrics.getSyncSpeed())} blocks/sec, ` +
                `mapping: ${Math.round(this.metrics.getMappingSpeed())} blocks/sec, ` +
                `${Math.round(this.metrics.getMappingItemSpeed())} items/sec, ` +
                `ingest: ${Math.round(this.metrics.getIngestSpeed())} blocks/sec, ` +
                `eta: ${timeInterval(this.metrics.getSyncEtaSeconds())}`
            )
        }
    }

    private async splitBySpec(batch: DataBatch<R>): Promise<Pack[]> {
        let manager = this.chainManager()
        let result: Pack[] = []
        let pack: Pack | undefined
        for (let b of batch.blocks) {
            if (pack == null) {
                pack = {
                    chain: await manager.getChainForBlock(b.header),
                    blocks: [b]
                }
            } else if (pack.blocks.length > 1 && pack.blocks[0].header.specId === b.header.specId) {
                pack.blocks.push(b)
            } else {
                let chain = await manager.getChainForBlock(b.header)
                if (pack.chain === chain) {
                    pack.blocks.push(b)
                } else {
                    result.push(pack)
                    pack = {
                        chain,
                        blocks: [b]
                    }
                }
            }
        }
        if (pack) {
            result.push(pack)
        }
        return result
    }

    async processBatch(request: R, chain: Chain, blocks: BlockData[], isHead: boolean): Promise<void> {

    }

    private getPrometheusPort(): number | string {
        let port = this.config.getOptions().prometheusPort
        return port == null
            ? process.env.PROCESSOR_PROMETHEUS_PORT || process.env.PROMETHEUS_PORT || 0
            : port
    }

    @def
    private getId() {
        return process.env.SQUID_ID || `gen-${randomString(10)}`
    }
}


type Pack = {chain: Chain, blocks: BlockData[]}


function getItemsCount(blocks: BlockData[]): number {
    let count = 0
    for (let i = 0; i < blocks.length; i++) {
        count += blocks[i].items.length
    }
    return count
}


function randomString(len: number) {
    const chars ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

    let result = ''
    for (let i = 0; i < len; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }

    return result
}
