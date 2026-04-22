import {isForkException as isPortalForkException, PortalClient, solana} from '@subsquid/portal-client'
import {maybeLast} from '@subsquid/util-internal'
import {
    BlockBatch,
    BlockRef,
    ForkException,
    StreamRequest,
} from '@subsquid/util-internal-data-source'
import {
    applyRangeBound,
    FiniteRange,
    getSize,
    RangeRequest,
    RangeRequestList,
} from '@subsquid/util-internal-range'
import assert from 'assert'
import {Block, FieldSelection} from '../data/model'
import {DataRequest} from '../data/request'
import {
    BALANCE_FILTER_KEYS,
    INSTRUCTION_FILTER_KEYS,
    LOG_FILTER_KEYS,
    mergeItems,
    REWARD_FILTER_KEYS,
    TOKEN_BALANCE_FILTER_KEYS,
    TX_FILTER_KEYS,
} from './merge'
import type {SolanaDataSource} from '../source'

export type RangeRequestResolver =
    | RangeRequestList<DataRequest>
    | (() => RangeRequestList<DataRequest>)

export class PortalSolanaDataSource<F extends FieldSelection> implements SolanaDataSource<F> {
    constructor(
        private client: PortalClient,
        private fields: FieldSelection,
        private requests: RangeRequestResolver,
        private opts?: {squidId?: string},
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

    getFinalizedStream(opts?: StreamRequest): AsyncIterable<BlockBatch<Block<F>>> {
        return this._getStream(opts, true)
    }

    getStream(opts?: StreamRequest): AsyncIterable<BlockBatch<Block<F>>> {
        return this._getStream(opts, false)
    }

    getBlocksCountInRange(range: FiniteRange): number {
        return getSize(
            this.resolveRequests().map((r) => r.range),
            range,
        )
    }

    private resolveRequests(): RangeRequestList<DataRequest> {
        return typeof this.requests === 'function' ? this.requests() : this.requests
    }

    private async *_getStream(opts?: StreamRequest, finalized?: boolean): AsyncIterable<BlockBatch<Block<F>>> {
        let requests = applyRangeBound(this.resolveRequests(), opts?.from != null ? {from: opts.from} : undefined)
        if (requests.length === 0) return

        let streamOptions = {request: {headers: this.getHeaders()}}
        let parentHash = opts?.parentHash
        let nextBlock = opts?.from

        // Stream a request from the portal and keep (parentHash, nextBlock)
        // in sync with the last block of every batch.
        let drain = async function* (
            this: PortalSolanaDataSource<F>,
            req: RangeRequest<DataRequest>,
        ): AsyncIterable<BlockBatch<Block<F>>> {
            for await (let {blocks, meta} of this.client.getStream(
                mapRequest(req, this.fields, parentHash),
                streamOptions,
                finalized,
            )) {
                yield {
                    blocks: blocks.map((block) => mapBlock(block)),
                    finalizedHead: getHead(meta.finalizedHeadNumber, meta.finalizedHeadHash),
                }

                let lastBlock = maybeLast(blocks)?.header
                if (lastBlock != null) {
                    parentHash = lastBlock.hash
                    nextBlock = lastBlock.number + 1
                }
            }
        }.bind(this)

        // Advance the stream until the given block becomes finalized, after
        // which chain-continuity info is no longer needed and is dropped.
        // When `to` is undefined the stream is open-ended and we wait on the
        // current tail (nextBlock - 1).
        let finalize = async (to?: number) => {
            if (nextBlock == null) return
            if (to != null && nextBlock > to) return
            let target = to ?? nextBlock - 1
            for await (let {finalizedHead} of drain({range: {from: nextBlock, to}, request: {}})) {
                if (finalizedHead && target <= finalizedHead.number) {
                    parentHash = undefined
                    nextBlock = undefined
                    return
                }
            }
        }

        try {
            for (let req of requests) {
                // Close any gap preceding this query so parentHash lands on
                // req.range.from (or is safely dropped).
                await finalize(req.range.from - 1)

                if (nextBlock !== req.range.from) {
                    parentHash = undefined
                }

                yield* drain(req)
            }

            // After the last query, wait for its range to finalize before
            // ending the stream.
            await finalize()
        } catch (e: unknown) {
            if (isPortalForkException(e)) {
                throw new ForkException(e.blockNumber, e.parentBlockHash, e.previousBlocks)
            }

            throw e
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

function mapRequest(
    req: RangeRequest<DataRequest>,
    fields: FieldSelection,
    parentBlockHash?: string,
): solana.Query<MapFieldSelection> {
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
        fields: mapFieldSelection(fields),
        includeAllBlocks: req.request.includeAllBlocks,
        transactions: transactions && mergeItems(transactions, TX_FILTER_KEYS),
        instructions: instructions && mergeItems(instructions, INSTRUCTION_FILTER_KEYS),
        logs: logs && mergeItems(logs, LOG_FILTER_KEYS),
        balances: balances && mergeItems(balances, BALANCE_FILTER_KEYS),
        tokenBalances: tokenBalances && mergeItems(tokenBalances, TOKEN_BALANCE_FILTER_KEYS),
        rewards: rewards && mergeItems(rewards, REWARD_FILTER_KEYS),
    }
}

function mapFieldSelection(fields: FieldSelection) {
    return {
        block: fields.block,
        transaction: {...fields.transaction, transactionIndex: true},
        instruction: {...fields.instruction, transactionIndex: true, instructionAddress: true},
        log: {...fields.log, logIndex: true, transactionIndex: true, instructionAddress: true},
        balance: {...fields.balance, transactionIndex: true, account: true},
        tokenBalance: {...fields.tokenBalance, transactionIndex: true, account: true},
        reward: {...fields.reward, pubkey: true},
    } satisfies solana.FieldSelection
}

type MapFieldSelection = ReturnType<typeof mapFieldSelection>

export function mapBlock<F extends FieldSelection>(rawBlock: solana.Block<MapFieldSelection>): Block<F> {
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
