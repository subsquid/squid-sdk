import {PortalClient, PortalClientOptions} from '@subsquid/portal-client'
import {def} from '@subsquid/util-internal'
import {BlockBatch, BlockRef, DataSource, DataSourceStreamOptions} from '@subsquid/util-internal-data-source'
import {getOrGenerateSquidId} from '@subsquid/util-internal-processor-tools'
import {applyRangeBound, mergeRangeRequests, Range, RangeRequest, RangeRequestList} from '@subsquid/util-internal-range'
import assert from 'assert'
import {Block, DEFAULT_FIELDS, FieldSelection} from './data/model'
import {
    BalanceRequest,
    DataRequest,
    InstructionRequest,
    LogRequest,
    RewardRequest,
    TokenBalanceRequest,
    TransactionRequest,
} from './data/request'
import type {Selector} from './data/type-util'
import {PortalDataSource} from './portal/source'

interface BlockRange {
    range?: Range
}

export class DataSourceBuilder<F extends FieldSelection = {}> {
    private requests: RangeRequest<DataRequest>[] = []
    private fields?: FieldSelection
    private blockRange?: Range
    private archive?: PortalClient | PortalClientOptions

    /**
     * Set SQD Network Portal endpoint.
     *
     * SQD Network allows to get data from blocks up to
     * infinite times faster and more efficient than via regular RPC.
     *
     * @example
     * source.setGateway('https://portal.sqd.dev/datasets/solana-mainnet')
     */
    setPortal(portal: string | PortalClientOptions | PortalClient): this {
        if (typeof portal == 'string') {
            this.archive = {url: portal}
        } else {
            this.archive = portal
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
            request,
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
            transactions: [req],
        })
        return this
    }

    addInstruction(options: InstructionRequest & BlockRange): this {
        let {range, ...req} = options
        this.add(range, {
            instructions: [req],
        })
        return this
    }

    addLog(options: LogRequest & BlockRange): this {
        let {range, ...req} = options
        this.add(range, {
            logs: [req],
        })
        return this
    }

    addBalance(options: BalanceRequest & BlockRange): this {
        let {range, ...req} = options
        this.add(range, {
            balances: [req],
        })
        return this
    }

    addTokenBalance(options: TokenBalanceRequest & BlockRange): this {
        let {range, ...req} = options
        this.add(range, {
            tokenBalances: [req],
        })
        return this
    }

    addReward(options: RewardRequest & BlockRange): this {
        let {range, ...req} = options
        this.add(range, {
            rewards: [req],
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
                rewards: concat(a.rewards, b.rewards),
            }
        })

        let fields = addDefaultFields(this.fields)

        requests = requests.map(({range, request}) => {
            return {
                range,
                request: {
                    fields,
                    ...request,
                },
            }
        })

        return applyRangeBound(requests, this.blockRange)
    }

    build(): DataSource<Block<F>> {
        assert(this.archive, 'Portal settings not set')

        return new SolanaDataSource(
            this.getRequests(),
            this.archive instanceof PortalClient ? this.archive : new PortalClient(this.archive)
        )
    }
}

function addDefaultFields(fields?: FieldSelection): FieldSelection {
    return {
        block: mergeDefaultFields(DEFAULT_FIELDS.block, fields?.block),
        transaction: mergeDefaultFields(DEFAULT_FIELDS.transaction, fields?.transaction),
        instruction: mergeDefaultFields(DEFAULT_FIELDS.instruction, fields?.instruction),
        log: mergeDefaultFields(DEFAULT_FIELDS.log, fields?.log),
        balance: mergeDefaultFields(DEFAULT_FIELDS.balance, fields?.balance),
        tokenBalance: mergeDefaultFields(DEFAULT_FIELDS.tokenBalance, fields?.tokenBalance),
        reward: mergeDefaultFields(DEFAULT_FIELDS.reward, fields?.reward),
    }
}

function mergeDefaultFields<Props extends string>(
    defaults: Selector<Props>,
    selection?: Selector<Props>
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

export type GetDataSourceBlock<T> = T extends DataSource<infer B> ? B : never

export class SolanaDataSource<F extends FieldSelection> implements DataSource<Block<F>> {
    constructor(private requests: RangeRequestList<DataRequest>, private portal: PortalClient) {}

    getHead(): Promise<BlockRef | undefined> {
        return this.createArchive().getHead()
    }

    getFinalizedHead(): Promise<BlockRef | undefined> {
        return this.createArchive().getFinalizedHead()
    }

    getFinalizedStream(opts: DataSourceStreamOptions): AsyncIterable<BlockBatch<Block<F>>> {
        return this._getStream(opts, true)
    }

    getStream(opts?: DataSourceStreamOptions): AsyncIterable<BlockBatch<Block<F>>> {
        return this._getStream(opts, false)
    }

    private _getStream(opts?: DataSourceStreamOptions, finalized?: boolean): AsyncIterable<BlockBatch<Block<F>>> {
        let archive = this.createArchive()

        return finalized ? archive.getFinalizedStream(opts) : archive.getStream(opts)
    }

    @def
    private createArchive() {
        return new PortalDataSource(this.portal, this.requests, {squidId: this.getSquidId()})
    }

    @def
    private getSquidId(): string {
        return getOrGenerateSquidId()
    }
}
