import {isForkException as isPortalForkException, PortalClient, solana} from '@subsquid/portal-client'
import {maybeLast} from '@subsquid/util-internal'
import {
    BlockRef,
    DataSource,
    DataSourceStreamOptions,
    ForkException,
    type BlockBatch,
} from '@subsquid/util-internal-data-source'
import {applyRangeBound, FiniteRange, getSize, RangeRequestList, type RangeRequest} from '@subsquid/util-internal-range'
import {
    Block,
    FieldSelection,
    type Balance,
    type BlockHeader,
    type Instruction,
    type LogMessage,
    type Reward,
    type TokenBalance,
    type Transaction,
} from '../data/model'
import {DataRequest} from '../data/request'
import {
    mergeItems,
    TX_FILTER_KEYS,
    INSTRUCTION_FILTER_KEYS,
    LOG_FILTER_KEYS,
    BALANCE_FILTER_KEYS,
    TOKEN_BALANCE_FILTER_KEYS,
    REWARD_FILTER_KEYS,
} from './merge'
import assert from 'assert'

export type RangeRequestResolver<F extends FieldSelection> =
    | RangeRequestList<DataRequest<F>>
    | (() => RangeRequestList<DataRequest<F>>)

export class PortalDataSource<F extends FieldSelection> implements DataSource<Block<F>> {
    constructor(
        private client: PortalClient,
        private requests: RangeRequestResolver<F>,
        private opts?: {squidId?: string}
    ) {}

    async getHead(): Promise<BlockRef> {
        let head = await this.client.getHead({headers: this.getHeaders()})
        assert(head, 'portal has no chain head')
        return head
    }

    async getFinalizedHead(): Promise<BlockRef> {
        let head = await this.client.getFinalizedHead({headers: this.getHeaders()})
        assert(head, 'portal has no finalized head')
        return head
    }

    getFinalizedStream(opts?: DataSourceStreamOptions): AsyncIterable<BlockBatch<Block<F>>> {
        return this._getStream(opts, true)
    }

    getStream(opts?: DataSourceStreamOptions): AsyncIterable<BlockBatch<Block<F>>> {
        return this._getStream(opts, false)
    }

    getBlocksCountInRange(range: FiniteRange): number {
        return getSize(this.resolveRequests().map(r => r.range), range)
    }

    private resolveRequests(): RangeRequestList<DataRequest<F>> {
        return typeof this.requests === 'function' ? this.requests() : this.requests
    }

    private async *_getStream(
        opts?: DataSourceStreamOptions,
        finalized?: boolean
    ): AsyncIterable<BlockBatch<Block<F>>> {
        let requests = applyRangeBound(this.resolveRequests(), opts?.from != null ? {from: opts.from} : undefined)
        if (requests.length === 0) return

        let streamOptions = {request: {headers: this.getHeaders()}}
        let parentHash = opts?.parentHash

        for (let i = 0; i < requests.length; i++) {
            let req = requests[i]
            let query = mapRequest(req, parentHash)
            let stream = this.client.getStream(query, streamOptions, finalized)

            try {
                for await (let {blocks, meta} of stream) {
                    yield {
                        blocks: blocks.map((block) => mapBlock(block)),
                        finalizedHead: getHead(meta.finalizedHeadNumber, meta.finalizedHeadHash),
                    }

                    let lastBlock = maybeLast(blocks)?.header
                    if (lastBlock != null) {
                        parentHash = lastBlock.hash
                    }
                }

                // finalize range
                assert(req.range.to != null)

                let nextReq = requests[i + 1]
                let gapRange = {from: req.range.to + 1, to: nextReq ? nextReq.range.from - 1 : undefined}
                if (gapRange.from === gapRange.to) continue

                for await (let {blocks, meta} of this.client.getStream(
                    mapRequest({range: gapRange, request: {fields: req.request.fields}}, parentHash),
                    streamOptions,
                    finalized
                )) {
                    let finalizedHead = getHead(meta.finalizedHeadNumber, meta.finalizedHeadHash)
                    if (finalizedHead && req.range.to <= finalizedHead.number) {
                        parentHash = undefined
                        break
                    }

                    let lastBlock = maybeLast(blocks)?.header
                    if (lastBlock != null) {
                        parentHash = lastBlock.hash
                    }
                }
            } catch (e: unknown) {
                if (isPortalForkException(e)) {
                    throw new ForkException(e.blockNumber, e.parentBlockHash, e.previousBlocks)
                }

                throw e
            }
        }
    }

    private getHeaders() {
        return this.opts?.squidId ? {'x-squid-id': this.opts.squidId} : undefined
    }
}

function getHead(number?: number | undefined, hash?: string | undefined): BlockRef | undefined {
    if (number == null || hash == null) {
        return undefined
    }
    return {number, hash}
}

function mapRequest<F extends FieldSelection>(
    req: RangeRequest<DataRequest<F>>,
    parentBlockHash?: string
): solana.Query<MapFieldSelection<F>> {
    let transactions = req.request.transactions?.map((tx) => ({...tx.where, ...tx.include}))
    let instructions = req.request.instructions?.map((ix) => ({...ix.where, ...ix.include}))
    let logs = req.request.logs?.map((log) => ({...log.where, ...log.include}))
    let balances = req.request.balances?.map((b) => ({...b.where, ...b.include}))
    let tokenBalances = req.request.tokenBalances?.map((tb) => ({...tb.where, ...tb.include}))
    let rewards = req.request.rewards?.map((r) => r.where || {})
    return {
        type: 'solana',
        fromBlock: req.range.from,
        toBlock: req.range.to === Infinity ? undefined : req.range.to,
        parentBlockHash: parentBlockHash,
        fields: mapFieldSelection(req.request.fields),
        includeAllBlocks: req.request.includeAllBlocks,
        transactions: transactions && mergeItems(transactions, TX_FILTER_KEYS),
        instructions: instructions && mergeItems(instructions, INSTRUCTION_FILTER_KEYS),
        logs: logs && mergeItems(logs, LOG_FILTER_KEYS),
        balances: balances && mergeItems(balances, BALANCE_FILTER_KEYS),
        tokenBalances: tokenBalances && mergeItems(tokenBalances, TOKEN_BALANCE_FILTER_KEYS),
        rewards: rewards && mergeItems(rewards, REWARD_FILTER_KEYS),
    }
}

function mapFieldSelection<F extends FieldSelection>(fields?: F) {
    return {
        block: fields?.block,
        transaction: {...fields?.transaction, transactionIndex: true},
        instruction: {...fields?.instruction, transactionIndex: true, instructionAddress: true},
        log: {...fields?.log, logIndex: true, transactionIndex: true, instructionAddress: true},
        balance: {...fields?.balance, transactionIndex: true, account: true},
        tokenBalance: {...fields?.tokenBalance, transactionIndex: true, account: true},
        reward: {...fields?.reward, pubkey: true},
    } satisfies solana.FieldSelection
}

type MapFieldSelection<F extends FieldSelection> = ReturnType<typeof mapFieldSelection<F>>

export function mapBlock<F extends FieldSelection>(rawBlock: solana.Block<MapFieldSelection<F>>): Block<F> {
    let {number, hash, ...hdr} = rawBlock.header
    let header = {
        number,
        hash,
        ...hdr,
    }
    if ('timestamp' in header && typeof header.timestamp === 'number') {
        header.timestamp = header.timestamp * 1000 // convert to ms
    }

    let block: Block<F> = {
        header: header as any,
        transactions: [],
        instructions: [],
        logs: [],
        balances: [],
        tokenBalances: [],
        rewards: [],
    }

    for (let {transactionIndex, ...props} of rawBlock.transactions) {
        block.transactions.push({...props, transactionIndex} as any)
    }

    for (let {transactionIndex, instructionAddress, ...props} of rawBlock.instructions) {
        block.instructions.push({transactionIndex, instructionAddress, ...props} as any)
    }

    for (let {logIndex, transactionIndex, instructionAddress, ...props} of rawBlock.logs) {
        block.logs.push({logIndex, transactionIndex, instructionAddress, ...props} as any)
    }

    for (let {transactionIndex, account, ...props} of rawBlock.balances) {
        block.balances.push({transactionIndex, account, ...props} as any)
    }

    for (let {transactionIndex, account, ...props} of rawBlock.tokenBalances) {
        block.tokenBalances.push({transactionIndex, account, ...props} as any)
    }

    for (let {pubkey, ...props} of rawBlock.rewards) {
        block.rewards.push({pubkey, ...props} as any)
    }

    return block
}
