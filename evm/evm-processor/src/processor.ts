import {run, type Database, PrometheusServer} from '@subsquid/batch-processor'
import {augmentBlock} from '@subsquid/evm-objects'
import {DataSourceBuilder} from '@subsquid/evm-stream'
import type * as stream from '@subsquid/evm-stream'
import {createLogger, type Logger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {def} from '@subsquid/util-internal'
import {applyRangeBound, mergeRangeRequests, type Range, type RangeRequest} from '@subsquid/util-internal-range'
import {cast} from '@subsquid/util-internal-validation'
import assert from 'node:assert'
import type {Chain} from './interfaces/chain'
import {type BlockData, DEFAULT_FIELDS, type FieldSelection, type FieldSelectionWithDefaults} from './interfaces/data'
import type {
    DataRequest,
    LogRequest,
    StateDiffRequest,
    TraceRequest,
    TransactionRequest,
} from './interfaces/data-request'
import {getFieldSelectionValidator} from './mapping/selection'

export type RpcValidationFlags = {
    /**
     * @deprecated RPC validation is not used by this processor.
     */
    [k: string]: boolean
}

export interface RpcEndpointSettings {
    /**
     * RPC endpoint URL (either http(s) or ws(s))
     */
    url: string
    /**
     * Maximum number of ongoing concurrent requests
     */
    capacity?: number
    /**
     * Maximum number of requests per second
     */
    rateLimit?: number
    /**
     * Request timeout in `ms`
     */
    requestTimeout?: number
    /**
     * Maximum number of retry attempts.
     *
     * By default, retries all "retryable" errors indefinitely.
     */
    retryAttempts?: number
    /**
     * Maximum number of requests in a single batch call
     */
    maxBatchCallSize?: number
    /**
     * HTTP headers
     */
    headers?: Record<string, string>
}

export interface RpcDataIngestionSettings {
    /**
     * @deprecated RPC is not used for data ingestion by this processor.
     */
    preferTraceApi?: boolean
    /**
     * @deprecated RPC is not used for data ingestion by this processor.
     */
    useDebugApiForStateDiffs?: boolean
    /**
     * @deprecated RPC is not used for data ingestion by this processor.
     */
    debugTraceTimeout?: string
    /**
     * @deprecated Use portal client stream settings instead.
     */
    headPollInterval?: number
    /**
     * @deprecated RPC is not used for data ingestion by this processor.
     */
    newHeadTimeout?: number
    /**
     * @deprecated RPC is not used for data ingestion by this processor.
     */
    disabled?: boolean

    /**
     * @deprecated RPC validation is not used by this processor.
     */
    validationFlags?: RpcValidationFlags
}

export interface PortalSettings {
    /**
     * SQD Network Portal dataset URL.
     */
    url: string
    /**
     * Optional request headers.
     */
    headers?: Record<string, string>
    /**
     * Request timeout in ms.
     */
    requestTimeout?: number
    /**
     * Maximum number of retry attempts.
     */
    retryAttempts?: number
    /**
     * Maximum response size in bytes.
     */
    maxBytes?: number
    /**
     * Maximum time between stream data chunks in ms.
     */
    maxIdleTime?: number
    /**
     * Maximum wait time for stream data in ms.
     */
    maxWaitTime?: number
    /**
     * Interval for polling the head in ms.
     */
    headPollInterval?: number
}

export interface GatewaySettings extends PortalSettings {
    /**
     * @deprecated Portal does not use gateway API keys. Pass authorization through headers if needed.
     */
    apiKey?: string
}

interface BlockRange {
    /**
     * Block range
     */
    range?: Range
}

/**
 * API and data that is passed to the data handler
 */
type DefaultFieldSelection = Record<never, never>

export interface DataHandlerContext<Store, F extends FieldSelection = DefaultFieldSelection> {
    /**
     * @internal
     */
    _chain: Chain
    /**
     * An instance of a structured logger.
     */
    log: Logger
    /**
     * Storage interface provided by the database
     */
    store: Store
    /**
     * List of blocks to map and process
     */
    blocks: BlockData<F>[]
    /**
     * Signals, that the processor reached the head of a chain.
     *
     * The head block is always included in `.blocks`.
     */
    isHead: boolean
}

export type EvmBatchProcessorFields<T> = T extends EvmBatchProcessor<infer F> ? FieldSelectionWithDefaults<F> : never

/**
 * Provides methods to configure and launch data processing.
 */
export class EvmBatchProcessor<F extends FieldSelection = DefaultFieldSelection> {
    private requests: RangeRequest<DataRequest>[] = []
    private blockRange?: Range
    private fields?: FieldSelection
    private portal?: GatewaySettings
    private rpcIngestSettings?: RpcDataIngestionSettings
    private rpcEndpoint?: RpcEndpointSettings
    private running = false
    private prometheusServer?: PrometheusServer

    /**
     * Set SQD Network Portal dataset endpoint.
     *
     * @example
     * processor.setPortal('https://portal.sqd.dev/datasets/ethereum-mainnet')
     */
    setPortal(url: string | GatewaySettings): this {
        this.assertNotRunning()
        if (typeof url == 'string') {
            this.portal = {url}
        } else {
            this.portal = url
        }
        return this
    }

    /**
     * Set chain RPC endpoint.
     *
     * RPC is not used for data ingestion. The endpoint is retained only for
     * compatibility with mappings that access `ctx._chain.client`.
     */
    setRpcEndpoint(url: string | RpcEndpointSettings | undefined): this {
        this.assertNotRunning()
        if (typeof url == 'string') {
            this.rpcEndpoint = {url}
        } else {
            this.rpcEndpoint = url
        }
        return this
    }

    /**
     * Set up RPC data ingestion settings.
     *
     * @deprecated RPC is not used for data ingestion by this processor.
     */
    setRpcDataIngestionSettings(settings: RpcDataIngestionSettings): this {
        this.assertNotRunning()
        this.rpcIngestSettings = settings
        return this
    }

    /**
     * @deprecated RPC is not used for data ingestion by this processor.
     */
    setChainPollInterval(ms: number): this {
        assert(ms >= 0)
        this.assertNotRunning()
        this.rpcIngestSettings = {...this.rpcIngestSettings, headPollInterval: ms}
        return this
    }

    /**
     * @deprecated RPC is not used for data ingestion by this processor.
     */
    preferTraceApi(yes?: boolean): this {
        this.assertNotRunning()
        this.rpcIngestSettings = {...this.rpcIngestSettings, preferTraceApi: yes !== false}
        return this
    }

    /**
     * @deprecated RPC is not used for data ingestion by this processor.
     */
    useDebugApiForStateDiffs(yes?: boolean): this {
        this.assertNotRunning()
        this.rpcIngestSettings = {...this.rpcIngestSettings, useDebugApiForStateDiffs: yes !== false}
        return this
    }

    /**
     * @deprecated RPC is not used for data ingestion by this processor.
     */
    useArchiveOnly(yes?: boolean): this {
        this.assertNotRunning()
        this.rpcIngestSettings = {...this.rpcIngestSettings, disabled: yes !== false}
        return this
    }

    /**
     * @deprecated Portal finality is controlled by the portal source.
     */
    setFinalityConfirmation(_nBlocks: number): this {
        this.assertNotRunning()
        return this
    }

    /**
     * Configure a set of fetched fields
     */
    setFields<T extends FieldSelection>(fields: T): EvmBatchProcessor<T> {
        this.assertNotRunning()
        let validator = getFieldSelectionValidator()
        this.fields = cast(validator, fields)
        return this as any
    }

    private add(request: DataRequest, range?: Range): void {
        this.requests.push({
            range: range || {from: 0},
            request,
        })
    }

    /**
     * By default, the processor will fetch only blocks
     * which contain requested items. This method
     * modifies such behaviour to fetch all chain blocks.
     *
     * Optionally a range of blocks can be specified
     * for which the setting should be effective.
     */
    includeAllBlocks(range?: Range): this {
        this.assertNotRunning()
        this.add({includeAllBlocks: true}, range)
        return this
    }

    addLog(options: LogRequest & BlockRange): this {
        this.assertNotRunning()
        this.add(
            {
                logs: [mapRequest(options)],
            },
            options.range,
        )
        return this
    }

    addTransaction(options: TransactionRequest & BlockRange): this {
        this.assertNotRunning()
        this.add(
            {
                transactions: [mapRequest(options)],
            },
            options.range,
        )
        return this
    }

    addTrace(options: TraceRequest & BlockRange): this {
        this.assertNotRunning()
        this.add(
            {
                traces: [mapRequest(options)],
            },
            options.range,
        )
        return this
    }

    addStateDiff(options: StateDiffRequest & BlockRange): this {
        this.assertNotRunning()
        this.add(
            {
                stateDiffs: [mapRequest(options)],
            },
            options.range,
        )
        return this
    }

    /**
     * Limits the range of blocks to be processed.
     *
     * When the upper bound is specified,
     * the processor will terminate with exit code 0 once it reaches it.
     */
    setBlockRange(range?: Range): this {
        this.assertNotRunning()
        this.blockRange = range
        return this
    }

    /**
     * Sets the port for a built-in prometheus metrics server.
     *
     * By default, the value of `PROMETHEUS_PORT` environment
     * variable is used. When it is not set,
     * the processor will pick up an ephemeral port.
     *
     * @deprecated Use {@link .setPrometheusServer()} method for fine customization.
     */
    setPrometheusPort(port: number | string): this {
        this.assertNotRunning()
        if (this.prometheusServer) {
            throw new Error('Prometheus server has already been configured')
        }
        this.getPrometheusServer().setPort(port)
        return this
    }

    /**
     * Sets a custom prometheus metrics server.
     */
    setPrometheusServer(server: PrometheusServer): this {
        this.assertNotRunning()
        if (this.prometheusServer) {
            throw new Error('Prometheus server has already been configured')
        }
        this.prometheusServer = server
        return this
    }

    private assertNotRunning(): void {
        if (this.running) {
            throw new Error('Settings modifications are not allowed after start of processing')
        }
    }

    @def
    private getLogger(): Logger {
        return createLogger('sqd:processor')
    }

    private getPrometheusServer(): PrometheusServer {
        if (!this.prometheusServer) {
            this.prometheusServer = new PrometheusServer()
        }
        return this.prometheusServer
    }

    @def
    private getChainRpcClient(): RpcClient {
        if (this.rpcEndpoint == null) {
            throw new Error('use .setRpcEndpoint() to specify chain RPC endpoint')
        }
        return new RpcClient({
            url: this.rpcEndpoint.url,
            headers: this.rpcEndpoint.headers,
            maxBatchCallSize: this.rpcEndpoint.maxBatchCallSize ?? 100,
            requestTimeout: this.rpcEndpoint.requestTimeout ?? 30_000,
            capacity: this.rpcEndpoint.capacity ?? 10,
            rateLimit: this.rpcEndpoint.rateLimit,
            retryAttempts: this.rpcEndpoint.retryAttempts ?? Number.MAX_SAFE_INTEGER,
            log: this.getLogger().child('rpc', {rpcUrl: this.rpcEndpoint.url}),
        })
    }

    @def
    private getChain(): Chain {
        let self = this
        return {
            get client() {
                return self.getChainRpcClient()
            },
        }
    }

    @def
    private getBatchRequests(): RangeRequest<DataRequest>[] {
        let requests = mergeRangeRequests(this.requests, function merge(a: DataRequest, b: DataRequest) {
            let res: DataRequest = {}
            if (a.includeAllBlocks || b.includeAllBlocks) {
                res.includeAllBlocks = true
            }
            res.transactions = concatRequestLists(a.transactions, b.transactions)
            res.logs = concatRequestLists(a.logs, b.logs)
            res.traces = concatRequestLists(a.traces, b.traces)
            res.stateDiffs = concatRequestLists(a.stateDiffs, b.stateDiffs)
            return res
        })

        return applyRangeBound(requests, this.blockRange)
    }

    private getDataSource(): stream.EVMDataSource<FieldSelectionWithDefaults<F>> {
        if (this.portal == null) {
            throw new Error(
                'No portal data source was specified. Use .setPortal() to specify SQD Network Portal dataset.',
            )
        }

        let builder = new DataSourceBuilder()
            .setPortal({
                url: this.portal.url,
                http: {
                    headers: this.portal.headers,
                    httpTimeout: this.portal.requestTimeout,
                    retryAttempts: this.portal.retryAttempts,
                },
                maxBytes: this.portal.maxBytes,
                maxIdleTime: this.portal.maxIdleTime,
                maxWaitTime: this.portal.maxWaitTime,
                headPollInterval: this.portal.headPollInterval ?? this.rpcIngestSettings?.headPollInterval,
            })
            .setFields(addDefaultFields(this.fields as F | undefined))

        for (let req of this.getBatchRequests()) {
            builder.addQuery({
                range: req.range,
                request: toStreamRequest(req.request),
            })
        }

        return builder.build()
    }

    /**
     * Run data processing.
     *
     * This method assumes full control over the current OS process as
     * it terminates the entire program in case of error or
     * at the end of data processing.
     *
     * @param database - database is responsible for providing storage to data handlers
     * and persisting mapping progress and status.
     *
     * @param handler - The data handler, see {@link DataHandlerContext} for an API available to the handler.
     */
    run<Store>(database: Database<Store>, handler: (ctx: DataHandlerContext<Store, F>) => Promise<void>): void {
        this.assertNotRunning()
        this.running = true

        let chain = this.getChain()
        let mappingLog = this.getLogger().child('mapping')

        run(
            this.getDataSource(),
            database,
            (ctx) => {
                return handler({
                    _chain: chain,
                    log: mappingLog,
                    store: ctx.store,
                    blocks: ctx.blocks.map((block) => toProcessorBlock<F>(block)),
                    isHead: ctx.isHead,
                })
            },
            {prometheus: this.getPrometheusServer()},
        )
    }
}

function toProcessorBlock<F extends FieldSelection>(block: stream.Block<FieldSelectionWithDefaults<F>>): BlockData<F> {
    return augmentBlock(block)
}

function toStreamRequest(req: DataRequest): stream.DataRequest {
    return {
        includeAllBlocks: req.includeAllBlocks,
        logs: req.logs?.map((log) => ({
            where: {
                address: log.address,
                topic0: log.topic0,
                topic1: log.topic1,
                topic2: log.topic2,
                topic3: log.topic3,
            },
            include: {
                transaction: log.transaction,
                transactionTraces: log.transactionTraces,
                transactionLogs: log.transactionLogs,
                transactionStateDiffs: log.transactionStateDiffs,
            },
        })),
        transactions: req.transactions?.map((tx) => ({
            where: {
                to: tx.to,
                from: tx.from,
                sighash: tx.sighash,
                type: tx.type,
            },
            include: {
                logs: tx.logs,
                traces: tx.traces,
                stateDiffs: tx.stateDiffs,
            },
        })),
        traces: req.traces?.map((trace) => ({
            where: {
                type: trace.type,
                createFrom: trace.createFrom,
                callTo: trace.callTo,
                callFrom: trace.callFrom,
                callSighash: trace.callSighash,
                suicideRefundAddress: trace.suicideRefundAddress,
                rewardAuthor: trace.rewardAuthor,
            },
            include: {
                transaction: trace.transaction,
                transactionLogs: trace.transactionLogs,
                subtraces: trace.subtraces,
                parents: trace.parents,
            },
        })),
        stateDiffs: req.stateDiffs?.map((sd) => ({
            where: {
                address: sd.address,
                key: sd.key,
                kind: sd.kind,
            },
            include: {
                transaction: sd.transaction,
            },
        })),
    }
}

function mapRequest<T extends BlockRange>(options: T): Omit<T, 'range'> {
    let {range, ...req} = options
    for (let key in req) {
        let val = (req as any)[key]
        if (Array.isArray(val)) {
            ;(req as any)[key] = val.map((s) => {
                return typeof s == 'string' ? s.toLowerCase() : s
            })
        }
    }
    return req
}

function concatRequestLists<T extends object>(a?: T[], b?: T[]): T[] | undefined {
    let result: T[] = []
    if (a) {
        result.push(...a)
    }
    if (b) {
        result.push(...b)
    }
    return result.length == 0 ? undefined : result
}

function addDefaultFields<F extends FieldSelection>(fields?: F): FieldSelectionWithDefaults<F> {
    return {
        block: mergeDefaultFields(DEFAULT_FIELDS.block, fields?.block),
        transaction: mergeDefaultFields(DEFAULT_FIELDS.transaction, fields?.transaction),
        log: mergeDefaultFields(DEFAULT_FIELDS.log, fields?.log),
        trace: mergeDefaultFields(DEFAULT_FIELDS.trace, fields?.trace),
        stateDiff: {...mergeDefaultFields(DEFAULT_FIELDS.stateDiff, fields?.stateDiff), kind: true},
    } as FieldSelectionWithDefaults<F>
}

type Selector<Props extends string> = {
    [P in Props]?: boolean
}

function mergeDefaultFields<Props extends string>(
    defaults: Selector<Props>,
    selection?: Selector<Props>,
): Selector<Props> {
    let result: Selector<Props> = {...defaults}
    for (let key in selection) {
        if (selection[key] != null) {
            if (selection[key]) {
                result[key] = true
            } else {
                delete result[key]
            }
        }
    }
    return result
}
