import {PortalClient, PortalClientOptions} from '@subsquid/portal-client'
import {def} from '@subsquid/util-internal'
import {
    BlockBatch,
    BlockRef,
    DataSource,
    DataSourceStreamOptions,
    TemplateRegistry,
} from '@subsquid/util-internal-data-source'
import {getOrGenerateSquidId} from '@subsquid/util-internal-processor-tools'
import {applyRangeBound, FiniteRange, mergeRangeRequests, Range, rangeIntersection, RangeRequest, RangeRequestList} from '@subsquid/util-internal-range'
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

interface TemplateSpec<F extends FieldSelection> {
    key: string
    range?: Range
    resolve(value: string): DataRequest<F>
}

export class DataSourceBuilder<F extends FieldSelection = {}> {
    private requests: RangeRequest<DataRequest<F>>[] = []
    private templates: TemplateSpec<F>[] = []
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
     * source.setPortal('https://portal.sqd.dev/datasets/solana-mainnet')
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

    private add(range: Range | undefined, request: DataRequest<F>): void {
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

    addTransaction(options: TransactionRequest & BlockRange): this
    addTransaction(key: string, options: TransactionRequest & BlockRange): this
    addTransaction(keyOrOptions: string | (TransactionRequest & BlockRange), options?: TransactionRequest & BlockRange): this {
        if (typeof keyOrOptions === 'string') {
            let {range, ...transaction} = options!
            this.templates.push({key: keyOrOptions, range, resolve: (value) => ({
                transactions: [{...transaction, where: {...transaction.where, feePayer: [value]}}],
            })})
            return this
        }
        let {range, ...req} = keyOrOptions
        this.add(range, {transactions: [req]})
        return this
    }

    addInstruction(options: InstructionRequest & BlockRange): this
    addInstruction(key: string, options: InstructionRequest & BlockRange): this
    addInstruction(keyOrOptions: string | (InstructionRequest & BlockRange), options?: InstructionRequest & BlockRange): this {
        if (typeof keyOrOptions === 'string') {
            let {range, ...instruction} = options!
            this.templates.push({key: keyOrOptions, range, resolve: (value) => ({
                instructions: [{...instruction, where: {...instruction.where, programId: [value]}}],
            })})
            return this
        }
        let {range, ...req} = keyOrOptions
        this.add(range, {instructions: [req]})
        return this
    }

    addLog(options: LogRequest & BlockRange): this
    addLog(key: string, options: LogRequest & BlockRange): this
    addLog(keyOrOptions: string | (LogRequest & BlockRange), options?: LogRequest & BlockRange): this {
        if (typeof keyOrOptions === 'string') {
            let {range, ...log} = options!
            this.templates.push({key: keyOrOptions, range, resolve: (value) => ({
                logs: [{...log, where: {...log.where, programId: [value]}}],
            })})
            return this
        }
        let {range, ...req} = keyOrOptions
        this.add(range, {logs: [req]})
        return this
    }

    addBalance(options: BalanceRequest & BlockRange): this
    addBalance(key: string, options: BalanceRequest & BlockRange): this
    addBalance(keyOrOptions: string | (BalanceRequest & BlockRange), options?: BalanceRequest & BlockRange): this {
        if (typeof keyOrOptions === 'string') {
            let {range, ...balance} = options!
            this.templates.push({key: keyOrOptions, range, resolve: (value) => ({
                balances: [{...balance, where: {...balance.where, account: [value]}}],
            })})
            return this
        }
        let {range, ...req} = keyOrOptions
        this.add(range, {balances: [req]})
        return this
    }

    addTokenBalance(options: TokenBalanceRequest & BlockRange): this
    addTokenBalance(key: string, options: TokenBalanceRequest & BlockRange): this
    addTokenBalance(keyOrOptions: string | (TokenBalanceRequest & BlockRange), options?: TokenBalanceRequest & BlockRange): this {
        if (typeof keyOrOptions === 'string') {
            let {range, ...tokenBalance} = options!
            this.templates.push({key: keyOrOptions, range, resolve: (value) => ({
                tokenBalances: [{...tokenBalance, where: {...tokenBalance.where, account: [value]}}],
            })})
            return this
        }
        let {range, ...req} = keyOrOptions
        this.add(range, {tokenBalances: [req]})
        return this
    }

    addReward(options: RewardRequest & BlockRange): this
    addReward(key: string, options: RewardRequest & BlockRange): this
    addReward(keyOrOptions: string | (RewardRequest & BlockRange), options?: RewardRequest & BlockRange): this {
        if (typeof keyOrOptions === 'string') {
            let {range, ...reward} = options!
            this.templates.push({key: keyOrOptions, range, resolve: (value) => ({
                rewards: [{...reward, where: {...reward.where, pubkey: [value]}}],
            })})
            return this
        }
        let {range, ...req} = keyOrOptions
        this.add(range, {rewards: [req]})
        return this
    }

    private getRequests(registry: TemplateRegistry | undefined): RangeRequestList<DataRequest<any>> {

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

        let mergedInputs: RangeRequest<DataRequest<F>>[] = this.requests.slice()

        if (registry) {
            for (let spec of this.templates) {
                for (let entry of registry.get(spec.key)) {
                    let range = rangeIntersection(spec.range ?? {from: 0}, entry.range)
                    if (!range) continue
                    mergedInputs.push({range, request: spec.resolve(entry.value)})
                }
            }
        }

        let requests = mergeRangeRequests(mergedInputs, (a, b) => {
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

        let rangeRequests = requests.map(({range, request}) => {
            return {
                range,
                request: {
                    fields,
                    ...request,
                },
            }
        })

        return applyRangeBound(rangeRequests, this.blockRange)
    }

    build(): SolanaDataSource<F> {
        assert(this.archive, 'Portal settings not set')

        let portal = this.archive instanceof PortalClient ? this.archive : new PortalClient(this.archive)
        return new SolanaDataSource(
            (reg) => this.getRequests(reg),
            portal
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
    constructor(
        private _resolveRequests: (registry: TemplateRegistry | undefined) => RangeRequestList<DataRequest<F>>,
        private portal: PortalClient,
    ) {}

    getHead(): Promise<BlockRef | undefined> {
        return this.createArchive().getHead()
    }

    getFinalizedHead(): Promise<BlockRef | undefined> {
        return this.createArchive().getFinalizedHead()
    }

    getFinalizedStream(opts: DataSourceStreamOptions): AsyncIterable<BlockBatch<Block<F>>> {
        return this.createArchive().getFinalizedStream(opts)
    }

    getStream(opts?: DataSourceStreamOptions): AsyncIterable<BlockBatch<Block<F>>> {
        return this.createArchive().getStream(opts)
    }

    getBlocksCountInRange(range: FiniteRange): number {
        return this.createArchive().getBlocksCountInRange(range)
    }

    @def
    private createArchive() {
        return new PortalDataSource(this.portal, this._resolveRequests.bind(this), {squidId: this.getSquidId()})
    }

    @def
    private getSquidId(): string {
        return getOrGenerateSquidId()
    }
}
