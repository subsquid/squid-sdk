import {HttpAgent, HttpClient} from '@subsquid/http-client'
import {def, last} from '@subsquid/util-internal'
import {getOrGenerateSquidId} from '@subsquid/util-internal-processor-tools'
import {
    applyRangeBound,
    mergeRangeRequests,
    Range,
    RangeRequest,
    RangeRequestList,
} from '@subsquid/util-internal-range'
import assert from 'assert'
import {getFields} from './data/fields'
import {Block, FieldSelection} from './data/model'
import {PartialBlock} from './data/partial'
import {
    BalanceRequest,
    DataRequest,
    InstructionRequest,
    LogRequest,
    RewardRequest,
    TokenBalanceRequest,
    TransactionRequest,
} from './data/request'
import {PortalDataSource} from './archive/source'
import {PortalClient, PortalClientOptions} from '@subsquid/portal-client'
import {BlockRef, DataSource, DataSourceStream, DataSourceStreamOptions} from '@subsquid/util-internal-data-source'

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


export interface PortalSettings extends Omit<PortalClientOptions, 'http'> {
    /**
     * Request timeout in ms
     */
    requestTimeout?: number

    retryAttempts?: number
}

interface BlockRange {
    range?: Range
}

export class DataSourceBuilder<F extends FieldSelection = {}> {
    private requests: RangeRequest<DataRequest>[] = []
    private fields?: FieldSelection
    private blockRange?: Range
    private archive?: PortalSettings

    /**
     * Set SQD Network Portal endpoint.
     *
     * SQD Network allows to get data from blocks up to
     * infinite times faster and more efficient than via regular RPC.
     *
     * @example
     * source.setGateway('https://portal.sqd.dev/datasets/solana-mainnet')
     */
    setPortal(url: string | PortalSettings): this {
        if (typeof url == 'string') {
            this.archive = {url}
        } else {
            this.archive = {...url}
        }
        return this
    }

    /**
     * Limits the range of blocks to fetch.
     *
     * Note, that block heights should be used instead of slots.
     */
    setBlockRange(range?: Range): this {
        this.blockRange = range
        return this
    }

    /**
     * Configure a set of fetched fields
     */
    setFields<F extends FieldSelection>(fields: F): DataSourceBuilder<F> {
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
     * By default, blocks that doesn't contain requested items can be omitted.
     * This method modifies such behaviour to fetch all chain blocks.
     *
     * Optionally a range of blocks can be specified
     * for which the setting should be effective.
     */
    includeAllBlocks(range?: Range): this {
        this.add(range, {includeAllBlocks: true})
        return this
    }

    addTransaction(options: TransactionRequest & BlockRange): this {
        let {range, ...req} = options
        this.add(range, {
            transactions: [req]
        })
        return this
    }

    addInstruction(options: InstructionRequest & BlockRange): this {
        let {range, ...req} = options
        this.add(range, {
            instructions: [req]
        })
        return this
    }

    addLog(options: LogRequest & BlockRange): this {
        let {range, ...req} = options
        this.add(range, {
            logs: [req]
        })
        return this
    }

    addBalance(options: BalanceRequest & BlockRange): this {
        let {range, ...req} = options
        this.add(range, {
            balances: [req]
        })
        return this
    }

    addTokenBalance(options: TokenBalanceRequest & BlockRange): this {
        let {range, ...req} = options
        this.add(range, {
            tokenBalances: [req]
        })
        return this
    }

    addReward(options: RewardRequest & BlockRange): this {
        let {range, ...req} = options
        this.add(range, {
            rewards: [req]
        })
        return this
    }

    private getRequests(): RangeRequestList<DataRequest> {
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

    build(): DataSource<Block<F>> {
        return new SolanaDataSource(
            this.getRequests(),
            this.archive,
        ) as DataSource<Block<F>>
    }
}

export type GetDataSourceBlock<T> = T extends DataSource<infer B> ? B : never

class SolanaDataSource implements DataSource<PartialBlock> {
    private isConsistent?: boolean
    private ranges: Range[]

    constructor(
        private requests: RangeRequestList<DataRequest>,
        private archiveSettings?: PortalSettings,
    ) {
        this.ranges = this.requests.map((req) => req.range)
    }

    getHead(): Promise<BlockRef | undefined> {
        return this.createArchive().getHead()
    }

    getFinalizedHead(): Promise<BlockRef | undefined> {
        return this.createArchive().getFinalizedHead()
    }

    getFinalizedStream(opts: DataSourceStreamOptions): DataSourceStream<PartialBlock> {
        return this._getStream(opts, true)
    }

    getStream(opts?: DataSourceStreamOptions): DataSourceStream<PartialBlock> {
        return this._getStream(opts, false)
    }

    private async *_getStream(opts?: DataSourceStreamOptions, finalized?: boolean): DataSourceStream<PartialBlock> {
        let from = opts?.range?.from ?? 0
        let parentHash = opts?.parentHash
        if (this.archiveSettings) {
            let agent = new HttpAgent({keepAlive: true})
            try {
                let archive = this.createArchive(agent)

                let stream = finalized
                    ? archive.getFinalizedStream({
                          range: {from, to: opts?.range?.to},
                          stopOnHead: opts?.stopOnHead,
                          parentHash,
                      })
                    : archive.getStream({
                          range: {from, to: opts?.range?.to},
                          stopOnHead: opts?.stopOnHead,
                          parentHash,
                      })

                for await (let batch of stream) {
                    yield batch
                    from = last(batch.blocks).header.number + 1
                    parentHash = last(batch.blocks).header.hash
                }
            } finally {
                agent.close()
            }
        }
    }

    private createArchive(agent?: HttpAgent): PortalDataSource {
        assert(this.archiveSettings)

        let headers = {
            'x-squid-id': this.getSquidId(),
        }

        return new PortalDataSource(
            new PortalClient({
                http: new HttpClient({
                    headers,
                    agent,
                    httpTimeout: this.archiveSettings.requestTimeout,
                    retryAttempts: this.archiveSettings.retryAttempts ?? Infinity,
                }),
                url: this.archiveSettings.url,
                minBytes: this.archiveSettings.minBytes,
                maxIdleTime: this.archiveSettings.maxIdleTime,
                maxBytes: this.archiveSettings.maxBytes,
                maxWaitTime: this.archiveSettings.maxWaitTime,
                headPollInterval: this.archiveSettings.headPollInterval,
            }),
            this.requests
        )
    }

    @def
    private getSquidId(): string {
        return getOrGenerateSquidId()
    }
}
