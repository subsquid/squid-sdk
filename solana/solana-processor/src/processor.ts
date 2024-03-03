import {HttpAgent, HttpClient} from '@subsquid/http-client'
import {createLogger, Logger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {assertNotNull, def} from '@subsquid/util-internal'
import {ArchiveClient} from '@subsquid/util-internal-archive-client'
import {getOrGenerateSquidId, PrometheusServer} from '@subsquid/util-internal-processor-tools'
import {applyRangeBound, mergeRangeRequests, Range, RangeRequest} from '@subsquid/util-internal-range'
import {SolanaArchive} from './archive/source'
import {getFields} from './fields'
import {FieldSelection} from './interfaces/data'
import {
    BalanceRequest,
    DataRequest,
    InstructionRequest,
    LogRequest,
    RewardRequest,
    TokenBalanceRequest,
    TransactionRequest
} from './interfaces/data-request'


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
     * Maximum number of requests in a single batch call
     */
    maxBatchCallSize?: number
}


export interface RpcDataIngestionSettings {
    /**
     * Poll interval for new blocks in `ms`
     *
     * Poll mechanism is used to get new blocks via HTTP connection.
     */
    headPollInterval?: number
    /**
     * Disable RPC data ingestion entirely
     */
    disabled?: boolean
}


export interface GatewaySettings {
    /**
     * Subsquid Network Gateway url
     */
    url: string
    /**
     * Request timeout in ms
     */
    requestTimeout?: number
}


interface BlockRange {
    range?: Range
}


export type SolanaBatchProcessorFields<T> = T extends SolanaBatchProcessor<infer F> ? F : never


/**
 * Provides methods to configure and launch data processing.
 */
export class SolanaBatchProcessor<F extends FieldSelection = {}> {
    private requests: RangeRequest<DataRequest>[] = []
    private fields?: FieldSelection
    private blockRange?: Range
    private archive?: GatewaySettings
    private rpcEndpoint?: RpcEndpointSettings
    private rpcIngestSettings?: RpcDataIngestionSettings
    private prometheus = new PrometheusServer()
    private running = false

    private assertNotRunning(): void {
        if (this.running) {
            throw new Error('Settings modifications are not allowed after start of processing')
        }
    }

    /**
     * Set Subsquid Network Gateway endpoint (ex Archive).
     *
     * Subsquid Network allows to get data from finalized blocks up to
     * infinite times faster and more efficient than via regular RPC.
     *
     * @example
     * processor.setGateway('https://v2.archive.subsquid.io/network/solana-mainnet')
     */
    setGateway(url: string | GatewaySettings): this {
        this.assertNotRunning()
        if (typeof url == 'string') {
            this.archive = {url}
        } else {
            this.archive = url
        }
        return this
    }

    /**
     * Set chain RPC endpoint
     *
     * @example
     * // just pass a URL
     * processor.setRpcEndpoint('https://api.mainnet-beta.solana.com')
     *
     * // adjust some connection options
     * processor.setRpcEndpoint({
     *     url: 'https://api.mainnet-beta.solana.com',
     *     rateLimit: 10
     * })
     */
    setRpcEndpoint(url: string | RpcEndpointSettings): this {
        this.assertNotRunning()
        if (typeof url == 'string') {
            this.rpcEndpoint = {url}
        } else {
            this.rpcEndpoint = url
        }
        return this
    }

    /**
     * Set up RPC data ingestion settings
     */
    setRpcDataIngestionSettings(settings: RpcDataIngestionSettings): this {
        this.assertNotRunning()
        this.rpcIngestSettings = settings
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
     * Configure a set of fetched fields
     */
    setFields<F extends FieldSelection>(fields: F): SolanaBatchProcessor<F> {
        this.assertNotRunning()
        this.fields = fields
        return this as any
    }

    private add(range: Range | undefined, request: DataRequest): void {
        this.requests.push({
            range: range || {from: 0},
            request
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
        this.add(range, {includeAllBlocks: true})
        return this
    }

    addTransaction(options: TransactionRequest & BlockRange): this {
        this.assertNotRunning()
        let {range, ...req} = options
        this.add(range, {
            transactions: [req]
        })
        return this
    }

    addInstruction(options: InstructionRequest & BlockRange): this {
        this.assertNotRunning()
        let {range, ...req} = options
        this.add(range, {
            instructions: [req]
        })
        return this
    }

    addLog(options: LogRequest & BlockRange): this {
        this.assertNotRunning()
        let {range, ...req} = options
        this.add(range, {
            logs: [req]
        })
        return this
    }

    addBalance(options: BalanceRequest & BlockRange): this {
        this.assertNotRunning()
        let {range, ...req} = options
        this.add(range, {
            balances: [req]
        })
        return this
    }

    addTokenBalance(options: TokenBalanceRequest & BlockRange): this {
        this.assertNotRunning()
        let {range, ...req} = options
        this.add(range, {
            tokenBalances: [req]
        })
        return this
    }

    addReward(options: RewardRequest & BlockRange): this {
        this.assertNotRunning()
        let {range, ...req} = options
        this.add(range, {
            rewards: [req]
        })
        return this
    }

    @def
    private getBatchRequests(): RangeRequest<DataRequest>[] {
        function concat<T>(a?: T[], b?: T[]): T[] | undefined {
            let result: T[] = []
            if (a) {
                result.push(...a)
            }
            if (b) {
                result.push(...b)
            }
            return result.length == 0 ? undefined : result
        }

        let requests = mergeRangeRequests(this.requests, (a, b) => {
            return {
                includeAllBlocks: a.includeAllBlocks || b.includeAllBlocks,
                transactions: concat(a.transactions, b.transactions),
                instructions: concat(a.instructions, b.instructions),
                logs: concat(a.logs, b.logs),
                balances: concat(a.balances, b.balances),
                tokenBalances: concat(a.tokenBalances, b.tokenBalances),
                rewards: concat(a.rewards, b.rewards)
            }
        })

        let fields = getFields(this.fields)

        requests = requests.map(({range, request}) => {
            return {
                range,
                request: {
                    fields,
                    ...request
                }
            }
        })

        return applyRangeBound(requests, this.blockRange)
    }

    /**
     * Sets the port for a built-in prometheus metrics server.
     *
     * By default, the value of `PROMETHEUS_PORT` environment
     * variable is used. When it is not set,
     * the processor will pick up an ephemeral port.
     */
    setPrometheusPort(port: number | string): this {
        this.assertNotRunning()
        this.prometheus.setPort(port)
        return this
    }

    @def
    private getSquidId(): string {
        return getOrGenerateSquidId()
    }

    @def
    private getLogger(): Logger {
        return createLogger('sqd:processor')
    }

    @def
    private getArchiveDataSource(): SolanaArchive {
        let options = assertNotNull(this.archive)

        let log = this.getLogger().child('archive')

        let http = new HttpClient({
            headers: {
                'x-squid-id': this.getSquidId()
            },
            agent: new HttpAgent({
                keepAlive: true
            }),
            log
        })

        return new SolanaArchive(
            new ArchiveClient({
                http,
                url: options.url,
                queryTimeout: options.requestTimeout,
                log
            })
        )
    }

    @def
    private getChainRpcClient(): RpcClient {
        if (this.rpcEndpoint == null) {
            throw new Error(`use .setRpcEndpoint() to specify chain RPC endpoint`)
        }
        let client = new RpcClient({
            url: this.rpcEndpoint.url,
            maxBatchCallSize: this.rpcEndpoint.maxBatchCallSize ?? 100,
            requestTimeout:  this.rpcEndpoint.requestTimeout ?? 30_000,
            capacity: this.rpcEndpoint.capacity ?? 10,
            rateLimit: this.rpcEndpoint.rateLimit,
            retryAttempts: Number.MAX_SAFE_INTEGER,
            log: this.getLogger().child('rpc', {rpcUrl: this.rpcEndpoint.url})
        })
        this.prometheus.addChainRpcMetrics(() => client.getMetrics())
        return client
    }
}
