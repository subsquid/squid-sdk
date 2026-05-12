import { Logger, createLogger } from '@subsquid/logger'
import { CallOptions, RetryError, RpcError, RpcProtocolError } from '@subsquid/rpc-client'
import {
    array,
    BYTES,
    DataValidationError,
    GetSrcType,
    NAT,
    nullable,
    object,
    Validator
} from '@subsquid/util-internal-validation'
import { addErrorContext, assertNotNull, groupBy, last } from '@subsquid/util-internal'
import assert from 'assert'
import {
    GetBlock,
    Receipt,
    TraceFrame,
    DebugStateDiffResult,
    DebugFrameResult,
    TraceReplayTraces,
    getTraceTransactionReplayValidator,
    Transaction,
    Log
} from './rpc-data'
import { Block, DataRequest, Qty, Bytes, Bytes32 } from './types'
import { qty2Int, toQty, getTxHash } from './util'
import { ChainUtils } from './chain-utils'
import { EvmRpcClient } from './rpc-client'
import { isBloomSuperset, logsBloom } from './verification'


export type Commitment = 'finalized' | 'latest'


export interface RpcOptions {
    client: EvmRpcClient,
    finalityConfirmation?: number
    verifyBlockHash?: boolean
    verifyTxSender?: boolean
    verifyTxRoot?: boolean
    verifyReceiptsRoot?: boolean
    verifyWithdrawalsRoot?: boolean
    verifyLogsBloom?: boolean
    assertLogIndex?: boolean
    useGasUsedForReceiptsRoot?: boolean
}


export class Rpc {
    private client: EvmRpcClient
    private finalityConfirmation?: number
    private verifyBlockHash?: boolean
    private verifyTxSender?: boolean
    private verifyTxRoot?: boolean
    private verifyReceiptsRoot?: boolean
    private verifyWithdrawalsRoot?: boolean
    private verifyLogsBloom?: boolean
    private assertLogIndex?: boolean
    private useGasUsedForReceiptsRoot?: boolean
    private log: Logger
    private receiptsMethod?: GetReceiptsMethod
    private chainUtils?: ChainUtils

    constructor(options: RpcOptions) {
        this.client = options.client
        this.finalityConfirmation = options.finalityConfirmation
        this.verifyBlockHash = options.verifyBlockHash
        this.verifyTxSender = options.verifyTxSender
        this.verifyTxRoot = options.verifyTxRoot
        this.verifyReceiptsRoot = options.verifyReceiptsRoot
        this.verifyWithdrawalsRoot = options.verifyWithdrawalsRoot
        this.verifyLogsBloom = options.verifyLogsBloom
        this.assertLogIndex = options.assertLogIndex
        this.useGasUsedForReceiptsRoot = options.useGasUsedForReceiptsRoot
        this.log = createLogger('sqd:evm-rpc')
    }

    getConcurrency(): number {
        return this.client.getConcurrency()
    }

    call<T = any>(method: string, params?: any[], options?: CallOptions<T>): Promise<T> {
        return this.client.call(method, params, options)
    }

    batchCall<T = any>(batch: { method: string, params?: any[] }[], options?: CallOptions<T>): Promise<T[]> {
        return this.client.batchCall(batch, options)
    }

    async getHeight(): Promise<number> {
        let height: Qty = await this.call('eth_blockNumber')
        return qty2Int(height)
    }

    async getLatestBlockhash(commitment: Commitment): Promise<LatestBlockhash> {
        let qtyOrCommitment: Qty | Commitment
        if (commitment == 'finalized' && this.finalityConfirmation != null) {
            let height = await this.getHeight()
            qtyOrCommitment = toQty(Math.max(0, height - this.finalityConfirmation))
        } else {
            qtyOrCommitment = commitment
        }
        let block = await this.call('eth_getBlockByNumber', [qtyOrCommitment, false], {
            validateResult: getResultValidator(GetBlock)
        })
        return {
            number: qty2Int(block.number),
            hash: block.hash
        }
    }

    async getFinalizedBlockBatch(numbers: number[]): Promise<Block[]> {
        let blockhash = await this.getLatestBlockhash('finalized')
        let finalized = numbers.filter(n => n <= blockhash.number)
        return this.getBlockBatch(finalized)
    }

    async canDoFastBlock(): Promise<boolean> {
        return 'eth_getBlockReceipts' === await this.getReceiptsMethod()
    }

    async getFastBlock(number: number, hash: string, req?: DataRequest): Promise<Block | null> {
        let startTime = Date.now()
        console.log(`[EVM-RPC] getFastBlock: number = ${number}, hash = ${hash}`)

        let block_promise = this.getBlocks([number], req?.transactions ?? false);
        let logs_promise = null
        let receipts_promise = null
        let traces_promise = null
        if (req?.logs) {
            logs_promise = this.fetchLogs(number)
        }
        if (req?.receipts) {
            receipts_promise = this.fetchReceiptsByBlock(number)
        }
        if ((req?.traces || req?.stateDiffs) && number !== 0) {
            traces_promise = this.fetchTracesData(hash, req)
        }

        let [[block], logs, receipts, tracesData] = await Promise.all([block_promise, logs_promise, receipts_promise, traces_promise]);
        console.log(`[EVM-RPC] getFastBlock: fetch data took ${Date.now() - startTime}ms`)

        let addDataStart = Date.now()
        if (req?.logs && block) {
            if (logs) {
                this.processLogs(block, logs)
            } else {
                block._isInvalid = true
                block._errorMessage = 'eth_getLogs returned null'
            }
        }
        if (req?.receipts && block) {
            if (receipts) {
                this.processReceipts(block, receipts)
            } else {
                block._isInvalid = true
                block._errorMessage = 'eth_getBlockReceipts returned null'
            }
        }
        if ((req?.traces || req?.stateDiffs) && block && tracesData) {
            await this.processTracesData(block, tracesData, req!)
        }
        console.log(`[EVM-RPC] getFastBlock: add requested data took ${Date.now() - addDataStart}ms`)
        console.log(`[EVM-RPC] getFastBlock: total time = ${Date.now() - startTime}ms`)

        return block
    }

    async getBlockBatch(numbers: number[], req?: DataRequest): Promise<Block[]> {
        let blocks = await this.getBlocks(numbers, req?.transactions ?? false);

        let chain: Block[] = []

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            if (block == null) break
            if (i > 0 && chain[i - 1].block.hash !== block.block.parentHash) break
            chain.push(block)
        }

        await this.addRequestedData(chain, req)

        return chain
    }

    private async getBlocks(numbers: number[], withTransactions: boolean): Promise<(Block | null)[]> {
        let call = numbers.map(height => ({
            method: 'eth_getBlockByNumber',
            params: [toQty(height), withTransactions]
        }))

        let results = await this.reduceBatchOnRetry(call, {
            validateResult: getResultValidator(nullable(GetBlock)),
            validateError: info => {
                if (info.message.includes('cannot query unfinalized data')) return null // Avalanche
                if (info.message.includes('invalid block height')) throw new RetryError() // Hyperliquid
                throw new RpcError(info)
            }
        })

        let utils = await this.getChainUtils()
        let blocks = new Array(results.length)
        for (let i = 0; i < results.length; i++) {
            let block = results[i]
            if (block == null) {
                blocks[i] = null
            } else {
                try {
                    blocks[i] = await this.mapBlock(block, withTransactions, utils)
                } catch (err: any) {
                    throw addErrorContext(err, {
                        blockNumber: qty2Int(block.number),
                        blockHash: block.hash
                    })
                }
            }
        }

        return blocks
    }

    private async mapBlock(block: GetBlock, withTransactions: boolean, utils: ChainUtils): Promise<Block> {

        if (this.verifyBlockHash) {
            let blockHash = utils.calculateBlockHash(block)
            assert.equal(block.hash, blockHash, 'failed to verify block hash')
        }

        if (this.verifyTxRoot && withTransactions) {
            let txRoot = await utils.calculateTransactionsRoot(block)
            assert.equal(block.transactionsRoot, txRoot, 'failed to verify transactions root')
        }

        if (this.verifyTxSender && withTransactions) {
            for (let tx of block.transactions) {
                let transaction = tx as Transaction
                try {
                    let sender = utils.recoverTxSender(transaction)
                    if (sender == null) continue
                    assert.equal(transaction.from, sender, 'failed to verify transaction sender')
                } catch (err: any) {
                    throw addErrorContext(err, {
                        transactionIndex: qty2Int(transaction.transactionIndex),
                        transactionHash: transaction.hash
                    })
                }
            }
        }

        if (this.verifyWithdrawalsRoot && block.withdrawalsRoot != null) {
            let withdrawals = assertNotNull(block.withdrawals)
            let withdrawalsRoot = await utils.calculateWithdrawalsRoot(withdrawals)
            assert.equal(block.withdrawalsRoot, withdrawalsRoot, 'failed to verify withdrawals root')
        }

        return {
            number: qty2Int(block.number),
            hash: block.hash,
            block
        }
    }

    private async addRequestedData(blocks: Block[], req?: DataRequest) {
        let subtasks = []

        if (req?.logs) {
            subtasks.push(this.addLogs(blocks))
        }

        if (req?.receipts) {
            subtasks.push(this.addReceipts(blocks))
        }

        if (req?.traces || req?.stateDiffs) {
            subtasks.push(this.addTraces(blocks, req))
        }

        await Promise.all(subtasks)
    }

    private async fetchLogs(number: number): Promise<Map<string, Log[]>> {
        let results = await this.call('eth_getLogs', [{
            fromBlock: number,
            toBlock: number
        }], {
            validateResult: getResultValidator(array(Log)),
            validateError: info => {
                if (info.message.includes('after last accepted block')) {
                    // Regular EVM networks simply return an empty array in case
                    // of out of range request, but Avalanche returns an error.
                    return []
                }
                throw new RpcError(info)
            }
        })
        let logsByBlock = groupBy(results, log => log.blockHash)
        return logsByBlock
    }

    private async processLogs(block: Block, logsByBlock: Map<string, Log[]>) {

        let utils = await this.getChainUtils()
        let logs = logsByBlock.get(block.hash) || []

        try {
            if (this.assertLogIndex) {
                let logIndex = 0
                for (let log of logs) {
                    assert.equal(qty2Int(log.logIndex), logIndex++)
                }
            }

            if (this.verifyLogsBloom) {
                let logsBloom = utils.calculateLogsBloom(block.block, logs)
                assert.equal(block.block.logsBloom, logsBloom, 'failed to verify logs bloom')
            }
        } catch (err: any) {
            throw addErrorContext(err, {
                blockNumber: block.number,
                blockHash: block.hash
            })
        }

        block.logs = logs
    }

    private async fetchReceiptsByBlock(number: number) : Promise<(Receipt | null)[] | null> {
        let call = {
            method: 'eth_getBlockReceipts',
            params: ["0x" + number.toString(16)]
        }

        let result = await this.reduceBatchOnRetry([call], {
            validateResult: getResultValidator(nullable(array(nullable(Receipt)))),
            validateError: info => {
                if (info.message.includes('invalid block height')) throw new RetryError() // Hyperliquid
                throw new RpcError(info)
            }
        })
        return result[0]
    }

    private async processReceipts(block: Block, rawReceipts: (Receipt | null)[]) {
        let utils = await this.getChainUtils()

        // Some RPCs occasionally return null entries inside the receipts
        // array (e.g. dRPC for Cronos). Drop them here — length-mismatch follow-ups
        // (phantom-tx handling, per-tx recovery, final invalidity check)
        // will decide how to deal with the missing ones.
        let nullCount = 0
        let receipts: Receipt[] = []
        for (let r of rawReceipts) {
            if (r == null) {
                nullCount++
            } else {
                receipts.push(r)
            }
        }
        if (nullCount > 0) {
            this.log.warn(
                {
                    rpcEndpoint: this.client.url,
                    blockNumber: block.number,
                    blockHash: block.hash,
                    nullCount
                },
                'eth_getBlockReceipts returned null entries in the receipts array - stripping them'
            )
        }

        for (let receipt of receipts) {
            if (receipt.blockHash !== block.block.hash) {
                block._isInvalid = true
                block._errorMessage = 'eth_getBlockReceipts returned receipts for a different block'
            }
        }

        // Handle Cronos (Ethermint) phantom transactions BEFORE any verification.
        // Phantom txs are stripped from both block.block.transactions and receipts,
        // so that subsequent checks (bloom, receipts root, count) see a consistent view.
        // Only runs on blocks affected by the Ethermint bug window — past that cutoff
        // the chain is fixed and mismatches would indicate a real problem.
        let phantomTxHashes: Bytes32[] = []
        if (utils.isCronosEthermintBugBlock(block.block.number) && !block._isInvalid) {
            phantomTxHashes = await this.handleCronosPhantomTransactions(block, receipts)
            if (block.block.transactions.length !== receipts.length) {
                // Any tx still missing a receipt after phantom handling genuinely
                // executed (nonce advanced) but was omitted by eth_getBlockReceipts
                // — fall back to eth_getTransactionReceipt per tx.
                await this.recoverMissingCronosReceipts(block, receipts)
            }
        }

        block.receipts = receipts

        let logs = []
        for (let receipt of receipts) {
            logs.push(...receipt.logs)
        }

        try {
            if (this.assertLogIndex) {
                let logIndex = 0
                for (let log of logs) {
                    assert.equal(qty2Int(log.logIndex), logIndex++)
                }
            }

            if (this.verifyLogsBloom) {
                let computed = utils.calculateLogsBloom(block.block, logs)
                if (computed !== block.block.logsBloom) {
                    if (utils.isCronosEthermintBugBlock(block.block.number)) {
                        // Cronos blocks may have extra bits in the header bloom from
                        // leaked pre-revert logs. Try to verify those extras via tracing.
                        await this.verifyCronosLeakedLogsBloom(
                            block, logs, computed, phantomTxHashes, receipts
                        )
                    } else {
                        assert.equal(block.block.logsBloom, computed, 'failed to verify logs bloom')
                    }
                }
            }

            if (this.verifyReceiptsRoot) {
                let root = await utils.calculateReceiptsRoot(block.block, receipts)
                assert.equal(block.block.receiptsRoot, root, 'failed to verify receipts root')
            }
        } catch (err: any) {
            throw addErrorContext(err, {
                blockNumber: block.number,
                blockHash: block.hash
            })
        }

        if (block.block.transactions.length !== receipts.length) {
            block._isInvalid = true
            block._errorMessage = `got invalid number of receipts from eth_getBlockReceipts`
        }
    }

    private async addLogs(blocks: Block[]) {
        if (blocks.length == 0) return

        let results = await this.call('eth_getLogs', [{
            fromBlock: blocks[0].block.number,
            toBlock: last(blocks).block.number
        }], {
            validateResult: getResultValidator(array(Log)),
            validateError: info => {
                if (info.message.includes('after last accepted block')) {
                    // Regular EVM networks simply return an empty array in case
                    // of out of range request, but Avalanche returns an error.
                    return []
                }
                throw new RpcError(info)
            }
        })

        let utils = await this.getChainUtils()
        let logsByBlock = groupBy(results, log => log.blockHash)
        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let logs = logsByBlock.get(block.hash) || []

            try {
                if (this.assertLogIndex) {
                    let logIndex = 0
                    for (let log of logs) {
                        assert.equal(qty2Int(log.logIndex), logIndex++)
                    }
                }

                if (this.verifyLogsBloom) {
                    let logsBloom = utils.calculateLogsBloom(block.block, logs)
                    assert.equal(block.block.logsBloom, logsBloom, 'failed to verify logs bloom')
                }
            } catch (err: any) {
                throw addErrorContext(err, {
                    blockNumber: block.number,
                    blockHash: block.hash
                })
            }

            block.logs = logs
        }
    }

    private async getReceiptsMethod() {
        if (this.receiptsMethod) return this.receiptsMethod

        let eth = await this.client.call('eth_getBlockReceipts', ['latest']).then(
            res => Array.isArray(res),
            () => false
        )
        if (eth) return this.receiptsMethod = 'eth_getBlockReceipts'

        return this.receiptsMethod = 'eth_getTransactionReceipt'
    }

    private async addReceipts(blocks: Block[]) {
        let method = await this.getReceiptsMethod()
        switch (method) {
            case 'eth_getBlockReceipts':
                return this.addReceiptsByBlock(blocks)
            default:
                return this.addReceiptsByTx(blocks)
        }
    }

    private async addReceiptsByBlock(blocks: Block[]) {
        let call = blocks.map(block => ({
            method: 'eth_getBlockReceipts',
            params: [block.block.number]
        }))

        let results = await this.reduceBatchOnRetry(call, {
            validateResult: getResultValidator(nullable(array(nullable(Receipt)))),
            validateError: info => {
                if (info.message.includes('invalid block height')) throw new RetryError() // Hyperliquid
                throw new RpcError(info)
            }
        })

        let utils = await this.getChainUtils()
        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let rawReceipts = results[i]
            if (rawReceipts == null) {
                block._isInvalid = true
                block._errorMessage = 'eth_getBlockReceipts returned null'
                continue
            }

            // Some RPCs occasionally return null entries inside the receipts
            // array (e.g. dRPC for Cronos). Drop them here — length-mismatch follow-ups
            // (phantom-tx handling, per-tx recovery, final invalidity check)
            // will decide how to deal with the missing ones.
            let nullCount = 0
            let receipts: Receipt[] = []
            for (let r of rawReceipts) {
                if (r == null) {
                    nullCount++
                } else {
                    receipts.push(r)
                }
            }
            if (nullCount > 0) {
                this.log.warn(
                    {
                        rpcEndpoint: this.client.url,
                        blockNumber: block.number,
                        blockHash: block.hash,
                        nullCount
                    },
                    'eth_getBlockReceipts returned null entries in the receipts array - stripping them'
                )
            }

            for (let receipt of receipts) {
                if (receipt.blockHash !== block.block.hash) {
                    block._isInvalid = true
                    block._errorMessage = 'eth_getBlockReceipts returned receipts for a different block'
                }
            }

            // Handle Cronos (Ethermint) phantom transactions BEFORE any verification.
            // Phantom txs are stripped from both block.block.transactions and receipts,
            // so that subsequent checks (bloom, receipts root, count) see a consistent view.
            // Only runs on blocks affected by the Ethermint bug window — past that cutoff
            // the chain is fixed and mismatches would indicate a real problem.
            let phantomTxHashes: Bytes32[] = []
            if (utils.isCronosEthermintBugBlock(block.block.number) && !block._isInvalid) {
                phantomTxHashes = await this.handleCronosPhantomTransactions(block, receipts)
                if (block.block.transactions.length !== receipts.length) {
                    // Any tx still missing a receipt after phantom handling genuinely
                    // executed (nonce advanced) but was omitted by eth_getBlockReceipts
                    // — fall back to eth_getTransactionReceipt per tx.
                    await this.recoverMissingCronosReceipts(block, receipts)
                }
            }

            block.receipts = receipts

            let logs = []
            for (let receipt of receipts) {
                logs.push(...receipt.logs)
            }

            try {
                if (this.assertLogIndex) {
                    let logIndex = 0
                    for (let log of logs) {
                        assert.equal(qty2Int(log.logIndex), logIndex++)
                    }
                }

                if (this.verifyLogsBloom) {
                    let computed = utils.calculateLogsBloom(block.block, logs)
                    if (computed !== block.block.logsBloom) {
                        if (utils.isCronosEthermintBugBlock(block.block.number)) {
                            // Cronos blocks may have extra bits in the header bloom from
                            // leaked pre-revert logs. Try to verify those extras via tracing.
                            await this.verifyCronosLeakedLogsBloom(
                                block, logs, computed, phantomTxHashes, receipts
                            )
                        } else {
                            assert.equal(block.block.logsBloom, computed, 'failed to verify logs bloom')
                        }
                    }
                }

                if (this.verifyReceiptsRoot) {
                    let root = await utils.calculateReceiptsRoot(block.block, receipts)
                    assert.equal(block.block.receiptsRoot, root, 'failed to verify receipts root')
                }
            } catch (err: any) {
                throw addErrorContext(err, {
                    blockNumber: block.number,
                    blockHash: block.hash
                })
            }

            if (block.block.transactions.length !== receipts.length) {
                block._isInvalid = true
                block._errorMessage = `got invalid number of receipts from eth_getBlockReceipts`
            }
        }
    }

    /**
     * Handles "phantom transactions" in Cronos (Ethermint) blocks.
     *
     * Due to bugs in the Ethermint EVM module, some transactions included in
     * CometBFT blocks had no real effect on the EVM state. Such a tx can appear
     * in one of two forms as seen over JSON-RPC:
     *   1. The tx has no receipt at all (e.g. block 0x198d, 0x20189).
     *   2. The tx has a receipt with status=0x0 and no logs, but its pre-revert
     *      logs leak into the block's logsBloom (e.g. block 0x10a77).
     * In both cases the sender's nonce was NOT advanced by the tx, and the same
     * tx hash may be re-included by CometBFT later — possibly in a subsequent
     * block or even later within the same block — where it actually executes.
     * (related Ethermint fix: https://github.com/evmos/ethermint/pull/809)
     *
     * Detection uses `eth_getTransactionCount(sender, blockNumber)` as ground truth.
     * A tx is a candidate phantom if it has no receipt or a status=0x0 receipt.
     * For each candidate:
     *   - If `candidate.nonce >= nonceAfter` → the nonce was never consumed,
     *     so the candidate is definitely phantom.
     *   - Otherwise the nonce was consumed by some tx in this block. If another
     *     tx from the same sender with the same nonce has a status=0x1 receipt,
     *     that one consumed the nonce and the candidate is phantom (re-inclusion
     *     within the same block). If all txs sharing that nonce are candidates,
     *     we can't tell which one is phantom — refuse to strip.
     *   - Otherwise the candidate itself consumed the nonce — it is a normal
     *     execution failure (revert, out-of-gas, etc.), not a phantom.
     *
     * Phantoms are removed from both `block.block.transactions` and the `receipts`
     * array; remaining tx and receipt indices (including log transactionIndex) are
     * renumbered to be contiguous.
     */
    private async handleCronosPhantomTransactions(block: Block, receipts: Receipt[]): Promise<Bytes32[]> {
        let transactions = block.block.transactions as Transaction[]
        let receiptByHash = new Map(receipts.map(r => [r.transactionHash, r]))

        // Collect candidates: txs with no receipt or a status=0x0 receipt.
        let candidates: Transaction[] = []
        for (let tx of transactions) {
            let receipt = receiptByHash.get(tx.hash)
            if (receipt == null || qty2Int(receipt.status) === 0) {
                candidates.push(tx)
            }
        }

        if (candidates.length === 0) return []

        // Fetch nonceAfter once per unique sender.
        let uniqueSenders = Array.from(new Set(candidates.map(tx => tx.from)))
        let nonceResults: Qty[] = await this.batchCall(uniqueSenders.map(sender => ({
            method: 'eth_getTransactionCount',
            params: [sender, block.block.number]
        })))
        let nonceAfterBySender = new Map<Bytes, number>()
        for (let i = 0; i < uniqueSenders.length; i++) {
            nonceAfterBySender.set(uniqueSenders[i], qty2Int(nonceResults[i]))
        }

        // Group all txs by (sender, nonce) so we can detect multi-tx-per-nonce cases.
        let txsBySenderNonce = new Map<string, Transaction[]>()
        for (let tx of transactions) {
            let key = `${tx.from}:${qty2Int(tx.nonce)}`
            let list = txsBySenderNonce.get(key)
            if (list == null) {
                list = []
                txsBySenderNonce.set(key, list)
            }
            list.push(tx)
        }

        let phantomHashes = new Set<string>()
        for (let candidate of candidates) {
            let nonceAfter = nonceAfterBySender.get(candidate.from)!
            let txNonce = qty2Int(candidate.nonce)

            if (txNonce >= nonceAfter) {
                // Nonce not consumed at this block — definitely phantom.
                phantomHashes.add(candidate.hash)
                continue
            }

            // Nonce was consumed — but by which tx?
            let sameNonceTxs = txsBySenderNonce.get(`${candidate.from}:${txNonce}`)!
            let successfulCompeter = sameNonceTxs.some(tx => {
                if (tx.hash === candidate.hash) return false
                let receipt = receiptByHash.get(tx.hash)
                return receipt != null && qty2Int(receipt.status) === 1
            })

            if (successfulCompeter) {
                // Another tx from same sender with same nonce succeeded — candidate is phantom.
                phantomHashes.add(candidate.hash)
                continue
            }

            let sharedWithOtherCandidate = sameNonceTxs.some(tx => {
                if (tx.hash === candidate.hash) return false
                let receipt = receiptByHash.get(tx.hash)
                return receipt == null || qty2Int(receipt.status) === 0
            })

            if (sharedWithOtherCandidate) {
                // Multiple candidates share this nonce and none has a status=0x1 receipt —
                // can't unambiguously decide which one is phantom.
                this.log.warn(
                    {
                        cronosFix: true,
                        rpcEndpoint: this.client.url,
                        blockNumber: block.number,
                        transactionHash: candidate.hash,
                        sender: candidate.from,
                        nonce: candidate.nonce
                    },
                    'Cronos fix: multiple phantom candidates share the same nonce - refusing to strip (block will fail validation)'
                )
                return []
            }

            // Candidate.nonce < nonceAfter and no other tx shares this nonce —
            // candidate consumed the nonce itself, so it's a real execution
            // failure (revert / OOG / etc.), not a phantom.
        }

        if (phantomHashes.size === 0) return []

        this.log.warn(
            {
                cronosFix: true,
                rpcEndpoint: this.client.url,
                blockNumber: block.number,
                phantomTxHashes: Array.from(phantomHashes)
            },
            'Cronos fix: stripping phantom Ethermint transactions (no nonce consumption) from block'
        )

        // Strip phantom txs from block.block.transactions and renumber indices.
        block.block.transactions = transactions.filter(tx => !phantomHashes.has(tx.hash))
        for (let i = 0; i < block.block.transactions.length; i++) {
            let tx = block.block.transactions[i] as Transaction
            tx.transactionIndex = toQty(i)
        }

        // Strip phantom receipts from the receipts array (mutate in place so
        // callers sharing the reference observe the change).
        let keptReceipts = receipts.filter(r => !phantomHashes.has(r.transactionHash))
        receipts.length = 0
        receipts.push(...keptReceipts)

        // Renumber receipt.transactionIndex and contained log.transactionIndex
        // to match the new tx positions.
        let txIndexByHash = new Map<string, number>()
        for (let i = 0; i < block.block.transactions.length; i++) {
            let tx = block.block.transactions[i] as Transaction
            txIndexByHash.set(tx.hash, i)
        }
        for (let receipt of receipts) {
            let newIdx = txIndexByHash.get(receipt.transactionHash)
            if (newIdx == null) continue
            receipt.transactionIndex = toQty(newIdx)
            for (let log of receipt.logs) {
                log.transactionIndex = toQty(newIdx)
            }
        }

        return Array.from(phantomHashes)
    }

    /**
     * Recovers receipts for Cronos (Ethermint) transactions that were omitted
     * by eth_getBlockReceipts but actually executed (nonce advanced).
     *
     * We've observed this on Cronos mainnet block 0x10a78 — eth_getBlockReceipts
     * consistently omits the receipt for tx 0xc453d4... but the tx did execute
     * (contract deployed, nonce advanced). On some Cronos RPC providers
     * eth_getTransactionReceipt returns the receipt in this case (dRPC, sometimes);
     * on others it also returns null (Chainstack).
     *
     * If eth_getTransactionReceipt returns a valid receipt pinned to this block,
     * we splice it into the receipts array in tx-position order and renumber
     * receipt / log transactionIndex values to match. Otherwise we throw — the
     * data is simply unavailable from this RPC and the caller should retry later
     * (e.g. via a service restart).
     */
    private async recoverMissingCronosReceipts(block: Block, receipts: Receipt[]): Promise<void> {
        let transactions = block.block.transactions as Transaction[]
        let receiptHashes = new Set(receipts.map(r => r.transactionHash))

        let missingTxs: Transaction[] = []
        for (let tx of transactions) {
            if (!receiptHashes.has(tx.hash)) {
                missingTxs.push(tx)
            }
        }

        if (missingTxs.length === 0) return

        this.log.warn(
            {
                cronosFix: true,
                rpcEndpoint: this.client.url,
                blockNumber: block.number,
                missingTxHashes: missingTxs.map(tx => tx.hash)
            },
            'Cronos fix: receipts missing from eth_getBlockReceipts - falling back to eth_getTransactionReceipt for recovery'
        )

        let recoveredResults = await this.batchCall(
            missingTxs.map(tx => ({
                method: 'eth_getTransactionReceipt',
                params: [tx.hash]
            })),
            { validateResult: getResultValidator(nullable(Receipt)) }
        )

        for (let i = 0; i < missingTxs.length; i++) {
            let tx = missingTxs[i]
            let recovered = recoveredResults[i]

            if (recovered == null) {
                throw addErrorContext(
                    new Error('Cronos fix: failed to recover missing receipt via eth_getTransactionReceipt - RPC returned null'),
                    {
                        cronosFix: true,
                        rpcEndpoint: this.client.url,
                        blockNumber: block.number,
                        transactionHash: tx.hash
                    }
                )
            }

            if (recovered.blockHash !== block.block.hash) {
                throw addErrorContext(
                    new Error(`Cronos fix: recovered receipt belongs to a different block (got blockHash=${recovered.blockHash})`),
                    {
                        cronosFix: true,
                        rpcEndpoint: this.client.url,
                        blockNumber: block.number,
                        transactionHash: tx.hash
                    }
                )
            }

            receipts.push(recovered)
        }

        // Sort receipts by tx position in the block and renumber transactionIndex
        // (on both receipts and their logs) to match.
        let txIndexByHash = new Map<string, number>()
        for (let i = 0; i < transactions.length; i++) {
            txIndexByHash.set(transactions[i].hash, i)
        }
        receipts.sort((a, b) =>
            txIndexByHash.get(a.transactionHash)! - txIndexByHash.get(b.transactionHash)!
        )
        for (let receipt of receipts) {
            let idx = txIndexByHash.get(receipt.transactionHash)!
            receipt.transactionIndex = toQty(idx)
            for (let log of receipt.logs) {
                log.transactionIndex = toQty(idx)
            }
        }
    }

    /**
     * Verifies a Cronos (Ethermint) block whose header logsBloom does not match
     * the bloom computed from the visible receipt logs.
     *
     * Due to an Ethermint EVM-module bug, phantom and reverted transactions on
     * Cronos could "leak" their pre-revert logs into the block's logsBloom even
     * though those logs never appear in any receipt. In that scenario the
     * header bloom contains *more* bits than the bloom computed from receipts.
     * To accept a block in that state we must prove:
     *   1. The header bloom is a superset of the bloom we computed from the
     *      receipts' logs — i.e. our receipts don't contain spurious logs the
     *      node didn't account for.
     *   2. Every extra bit in the header bloom can be attributed to logs that
     *      *would have been emitted* by phantom or reverted transactions in
     *      this block, as reconstructed by `debug_traceTransaction` with the
     *      callTracer + withLog option (which captures logs from every call
     *      frame, including reverted ones).
     * If either condition fails the data is inconsistent with the block header
     * in a way we can't explain via the known Ethermint bug — throw rather
     * than silently accept it.
     */
    private async verifyCronosLeakedLogsBloom(
        block: Block,
        logs: Log[],
        computed: string,
        phantomTxHashes: Bytes32[],
        receipts: Receipt[]
    ): Promise<void> {
        let errorContext = {
            cronosFix: true,
            rpcEndpoint: this.client.url,
            blockNumber: block.number,
            blockHash: block.hash,
            headerBloom: block.block.logsBloom,
            computedBloom: computed
        }

        if (!isBloomSuperset(block.block.logsBloom, computed)) {
            throw addErrorContext(
                new Error('Cronos fix: bloom computed from receipt logs has bits not present in the header bloom - refusing to accept (receipts likely contain spurious logs)'),
                errorContext
            )
        }

        // Collect transactions whose logs could have leaked into the header
        // bloom: phantom txs (stripped) and reverted txs (status = 0x0).
        let leakedTxHashes = new Set<Bytes32>(phantomTxHashes)
        for (let receipt of receipts) {
            if (qty2Int(receipt.status) === 0) {
                leakedTxHashes.add(receipt.transactionHash)
            }
        }

        if (leakedTxHashes.size === 0) {
            throw addErrorContext(
                new Error('Cronos fix: header logs bloom has extra bits but no phantom or reverted transactions were found to explain them - refusing to accept'),
                errorContext
            )
        }

        // Reconstruct the logs of leaked txs via debug_traceTransaction.
        // callTracer with withLog=true emits a `logs` array on every frame it
        // visits, including frames that later reverted.
        let traceCall = Array.from(leakedTxHashes).map(hash => ({
            method: 'debug_traceTransaction',
            params: [hash, {
                tracer: 'callTracer',
                tracerConfig: {
                    onlyTopCall: false,
                    withLog: true
                }
            }]
        }))

        let traceResults: any[]
        try {
            traceResults = await this.batchCall(traceCall)
        } catch (err: any) {
            throw addErrorContext(
                new Error(`Cronos fix: failed to reconstruct leaked logs via debug_traceTransaction: ${err.message}`),
                {...errorContext, leakedTxHashes: Array.from(leakedTxHashes)}
            )
        }

        let tracedLogs: {address: Bytes, topics: Bytes[]}[] = []
        for (let result of traceResults) {
            collectFrameLogs(result, tracedLogs)
        }

        let combinedBloom = logsBloom([...logs, ...tracedLogs] as Log[])
        if (combinedBloom !== block.block.logsBloom) {
            throw addErrorContext(
                new Error('Cronos fix: traced logs from phantom/reverted transactions do not fully explain the extra bits in the header logs bloom - refusing to accept'),
                {
                    ...errorContext,
                    leakedTxHashes: Array.from(leakedTxHashes),
                    tracedLogCount: tracedLogs.length,
                    combinedBloom
                }
            )
        }

        this.log.warn(
            {
                ...errorContext,
                leakedTxHashes: Array.from(leakedTxHashes),
                tracedLogCount: tracedLogs.length
            },
            'Cronos fix: header logs bloom mismatch explained by leaked logs from phantom/reverted transactions (verified via debug_traceTransaction)'
        )
    }

    private async addReceiptsByTx(blocks: Block[]) {
        let call = []
        for (let block of blocks) {
            for (let tx of block.block.transactions) {
                call.push({
                    method: 'eth_getTransactionReceipt',
                    params: [getTxHash(tx)]
                })
            }
        }

        let results = await this.reduceBatchOnRetry(call, {
            validateResult: getResultValidator(nullable(Receipt))
        })

        let receiptsByBlock = groupBy(
            results.filter(r => r != null) as Receipt[],
            r => r.blockHash
        )

        let utils = await this.getChainUtils()
        for (let block of blocks) {
            let receipts = receiptsByBlock.get(block.hash) || []
            let logs = receipts.flatMap(r => r.logs)

            if (receipts.length !== block.block.transactions.length) {
                block._isInvalid = true
                block._errorMessage = 'failed to get receipts for all transactions'
                continue
            }

            try {
                if (this.assertLogIndex) {
                    let logIndex = 0
                    for (let log of logs) {
                        assert.equal(qty2Int(log.logIndex), logIndex++)
                    }
                }

                if (this.verifyLogsBloom) {
                    let logsBloom = utils.calculateLogsBloom(block.block, logs)
                    assert.equal(block.block.logsBloom, logsBloom, 'failed to verify logs bloom')
                }

                if (this.verifyReceiptsRoot) {
                    let root = await utils.calculateReceiptsRoot(block.block, receipts)
                    assert.equal(block.block.receiptsRoot, root, 'failed to verify receipts root')
                }
            } catch (err: any) {
                throw addErrorContext(err, {
                    blockNumber: block.number,
                    blockHash: block.hash
                })
            }

            block.receipts = receipts
        }
    }

    private async addTraces(blocks: Block[], req: DataRequest) {
        blocks = blocks.filter(block => block.number != 0) // genesis is not traceable
        let tasks = []
        let replayTraces: TraceReplayTraces = {}

        if (req.stateDiffs) {
            if (req.useDebugApiForStateDiffs) {
                tasks.push(this.addDebugStateDiffs(blocks, req))
            } else {
                replayTraces.stateDiff = true
            }
        }

        if (req.traces) {
            if (req.useTraceApi) {
                if (isEmpty(replayTraces)) {
                    tasks.push(this.addTraceBlockTraces(blocks))
                } else {
                    replayTraces.trace = true
                }
            } else {
                tasks.push(this.addDebugFrames(blocks, req))
            }
        }

        if (!isEmpty(replayTraces)) {
            tasks.push(this.addTraceTxReplays(blocks, replayTraces))
        }

        await Promise.all(tasks)
    }

    /**
     * Fetches all trace/stateDiff data for a single block identified by hash.
     * All sub-requests that can run independently are issued in parallel.
     * Returns a raw bundle consumed by processTracesData.
     */
    private async fetchTracesData(hash: string, req: DataRequest): Promise<FetchedTracesData> {
        let replayTraces: TraceReplayTraces = {}

        let debugStateDiffsPromise: Promise<DebugStateDiffResult[] | null> = Promise.resolve(undefined as any)
        let debugFramesPromise: Promise<DebugFrameResult[] | null> = Promise.resolve(undefined as any)
        let traceBlockPromise: Promise<TraceFrame[] | undefined> = Promise.resolve(undefined)
        let traceTxReplaysPromise: Promise<any[] | null> = Promise.resolve(undefined as any)

        let fetchDebugStateDiffs = false
        let fetchDebugFrames = false
        let fetchTraceBlock = false
        let fetchTxReplays = false

        if (req.stateDiffs) {
            if (req.useDebugApiForStateDiffs) {
                fetchDebugStateDiffs = true
                debugStateDiffsPromise = this.fetchDebugStateDiffs(hash, req)
            } else {
                replayTraces.stateDiff = true
            }
        }

        if (req.traces) {
            if (req.useTraceApi) {
                if (isEmpty(replayTraces)) {
                    fetchTraceBlock = true
                    traceBlockPromise = this.fetchTraceBlockTraces(hash)
                } else {
                    replayTraces.trace = true
                }
            } else {
                fetchDebugFrames = true
                debugFramesPromise = this.fetchDebugFrames(hash, req)
            }
        }

        if (!isEmpty(replayTraces)) {
            fetchTxReplays = true
            traceTxReplaysPromise = this.fetchTraceTxReplays(hash, replayTraces)
        }

        let [debugStateDiffs, debugFrames, traceBlock, traceTxReplays] = await Promise.all([
            debugStateDiffsPromise,
            debugFramesPromise,
            traceBlockPromise,
            traceTxReplaysPromise,
        ])

        return {
            debugStateDiffs: fetchDebugStateDiffs ? debugStateDiffs : undefined,
            debugFrames: fetchDebugFrames ? debugFrames : undefined,
            traceBlock: fetchTraceBlock ? traceBlock : undefined,
            traceTxReplays: fetchTxReplays ? traceTxReplays : undefined,
            replayTraces
        }
    }

    /**
     * Applies fetched trace/stateDiff data (from fetchTracesData) onto a single block.
     */
    private async processTracesData(block: Block, data: FetchedTracesData, req: DataRequest): Promise<void> {
        let utils = await this.getChainUtils()

        if (data.debugStateDiffs !== undefined) {
            let diffs = data.debugStateDiffs
            if (diffs == null) {
                block._isInvalid = true
                block._errorMessage = 'got "block not found" from debug_traceBlockByHash'
            } else if (block.block.transactions.length === diffs.length) {
                block.debugStateDiffs = diffs
            } else {
                block.debugStateDiffs = this.matchDebugTrace('debug state diff', block, diffs, utils)
            }
        }

        if (data.debugFrames !== undefined) {
            let frames = data.debugFrames
            if (frames == null) {
                block._isInvalid = true
                block._errorMessage = 'got "block not found" from debug_traceBlockByHash'
            } else if (block.block.transactions.length === frames.length) {
                block.debugFrames = frames
            } else {
                block.debugFrames = this.matchDebugTrace('debug call frame', block, frames, utils)
            }
        }

        if (data.traceBlock !== undefined) {
            let frames = data.traceBlock!
            if (frames.length == 0) {
                if (block.block.transactions.length > 0) {
                    block._isInvalid = true
                    block._errorMessage = 'missing traces for some transactions'
                }
            } else {
                let wrongBlock = frames.some(f => f.blockHash !== block.block.hash)
                if (wrongBlock) {
                    block._isInvalid = true
                    block._errorMessage = 'trace_block returned a trace of a different block'
                } else {
                    block.traceReplays = []
                    let byTx = groupBy(frames, f => f.transactionHash)
                    for (let [transactionHash, txFrames] of byTx.entries()) {
                        if (transactionHash) {
                            block.traceReplays.push({
                                transactionHash,
                                trace: txFrames
                            })
                        }
                    }
                }
            }
        }

        if (data.traceTxReplays !== undefined) {
            let replays = data.traceTxReplays!
            let txs = new Set(block.block.transactions.map(getTxHash))

            for (let rep of replays) {
                if (!rep.transactionHash) {
                    let txHash: Bytes32 | null | undefined = undefined
                    for (let frame of rep.trace || []) {
                        assert(txHash == null || txHash === frame.transactionHash)
                        txHash = txHash || frame.transactionHash
                    }
                    assert(txHash, "can't match transaction replay with its transaction")
                    rep.transactionHash = txHash
                }

                if (!txs.has(rep.transactionHash)) {
                    block._isInvalid = true
                    block._errorMessage = 'trace_replayBlockTransactions returned a trace of a different block'
                }
            }

            block.traceReplays = replays
        }
    }

    private async fetchTraceBlockTraces(hash: string): Promise<TraceFrame[]> {
        let results = await this.reduceBatchOnRetry([{
            method: 'trace_block',
            params: [hash]
        }], {
            validateResult: getResultValidator(array(TraceFrame))
        })
        return results[0]
    }

    private async fetchDebugStateDiffs(hash: string, req: DataRequest): Promise<DebugStateDiffResult[] | null> {
        let traceConfig = {
            tracer: 'prestateTracer',
            tracerConfig: {
                onlyTopCall: false,
                diffMode: true,
            },
            timeout: req.debugTraceTimeout
        }

        let results = await this.reduceBatchOnRetry([{
            method: 'debug_traceBlockByHash',
            params: [hash, traceConfig]
        }], {
            validateResult: getResultValidator(array(DebugStateDiffResult)),
            validateError: info => {
                if (info.message.includes('not found')) return null
                if (info.message.includes('cannot query unfinalized data')) return null // Avalanche
                throw new RpcError(info)
            }
        })
        return results[0]
    }

    private async fetchDebugFrames(hash: string, req: DataRequest): Promise<DebugFrameResult[] | null> {
        let traceConfig = {
            tracer: 'callTracer',
            tracerConfig: {
                onlyTopCall: false,
                withLog: true,
            },
            timeout: req.debugTraceTimeout,
        }

        let validateFrameResult = getResultValidator(array(DebugFrameResult))

        let results = await this.reduceBatchOnRetry([{
            method: 'debug_traceBlockByHash',
            params: [hash, traceConfig]
        }], {
            validateResult: result => {
                if (Array.isArray(result)) {
                    // Moonbeam quirk
                    for (let i = 0; i < result.length; i++) {
                        if (!('result' in result[i])) {
                            result[i] = { result: result[i] }
                        }
                    }
                }
                return validateFrameResult(result)
            },
            validateError: info => {
                if (info.message.includes('not found')) return null
                if (info.message.includes('cannot query unfinalized data')) return null // Avalanche
                throw new RpcError(info)
            }
        })
        return results[0]
    }

    private async fetchTraceTxReplays(hash: string, traces: TraceReplayTraces): Promise<any[] | null> {
        let tracers: string[] = []

        if (traces.trace) {
            tracers.push('trace')
        }

        if (traces.stateDiff) {
            tracers.push('stateDiff')
        }

        if (tracers.length == 0) return null

        let results = await this.reduceBatchOnRetry([{
            method: 'trace_replayBlockTransactions',
            params: [hash, tracers]
        }], {
            validateResult: getResultValidator(
                array(getTraceTransactionReplayValidator(traces))
            )
        })
        return results[0]
    }

    private async addTraceBlockTraces(blocks: Block[]) {
        let call = blocks.map(block => ({
            method: 'trace_block',
            params: [block.block.hash]
        }))

        let results = await this.reduceBatchOnRetry(call, {
            validateResult: getResultValidator(array(TraceFrame))
        })

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let frames = results[i]

            if (frames.length == 0) {
                if (block.block.transactions.length > 0) {
                    block._isInvalid = true
                    block._errorMessage = 'missing traces for some transactions'
                }
                continue
            }

            for (let frame of frames) {
                if (frame.blockHash !== block.block.hash) {
                    block._isInvalid = true
                    block._errorMessage = 'trace_block returned a trace of a different block'
                    break
                }

                if (!block._isInvalid) {
                    block.traceReplays = []
                    let byTx = groupBy(frames, f => f.transactionHash)
                    for (let [transactionHash, txFrames] of byTx.entries()) {
                        if (transactionHash) {
                            block.traceReplays.push({
                                transactionHash,
                                trace: txFrames
                            })
                        }
                    }
                }
            }
        }
    }

    private async addDebugStateDiffs(blocks: Block[], req: DataRequest) {
        let traceConfig = {
            tracer: 'prestateTracer',
            tracerConfig: {
                onlyTopCall: false, // passing this option is incorrect, but required by Alchemy endpoints
                diffMode: true,
            },
            timeout: req.debugTraceTimeout
        }

        let call = blocks.map(block => ({
            method: 'debug_traceBlockByHash',
            params: [block.hash, traceConfig]
        }))

        let results = await this.reduceBatchOnRetry(call, {
            validateResult: getResultValidator(array(DebugStateDiffResult)),
            validateError: info => {
                if (info.message.includes('not found')) return null
                if (info.message.includes('cannot query unfinalized data')) return null // Avalanche
                throw new RpcError(info)
            }
        })

        let utils = await this.getChainUtils()
        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let diffs = results[i]
            if (diffs == null) {
                block._isInvalid = true
                block._errorMessage = 'got "block not found" from debug_traceBlockByHash'
            } else if (block.block.transactions.length === diffs.length) {
                block.debugStateDiffs = diffs
            } else {
                block.debugStateDiffs = this.matchDebugTrace('debug state diff', block, diffs, utils)
            }
        }
    }

    private async addDebugFrames(blocks: Block[], req: DataRequest): Promise<void> {
        let traceConfig = {
            tracer: 'callTracer',
            tracerConfig: {
                onlyTopCall: false,
                withLog: true,
            },
            timeout: req.debugTraceTimeout,
        }

        let call = blocks.map(block => ({
            method: 'debug_traceBlockByHash',
            params: [block.hash, traceConfig]
        }))

        let validateFrameResult = getResultValidator(array(DebugFrameResult))

        let results = await this.reduceBatchOnRetry(call, {
            validateResult: result => {
                if (Array.isArray(result)) {
                    // Moonbeam quirk
                    for (let i = 0; i < result.length; i++) {
                        if (!('result' in result[i])) {
                            result[i] = { result: result[i] }
                        }
                    }
                }
                return validateFrameResult(result)
            },
            validateError: info => {
                if (info.message.includes('not found')) return null
                if (info.message.includes('cannot query unfinalized data')) return null // Avalanche
                throw new RpcError(info)
            }
        })

        let utils = await this.getChainUtils()
        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let frames = results[i]
            if (frames == null) {
                block._isInvalid = true
                block._errorMessage = 'got "block not found" from debug_traceBlockByHash'
            } else if (block.block.transactions.length === frames.length) {
                block.debugFrames = frames
            } else {
                block.debugFrames = this.matchDebugTrace('debug call frame', block, frames, utils)
            }
        }
    }

    private matchDebugTrace<T extends { txHash?: Bytes | null }>(
        type: string,
        block: Block,
        trace: T[],
        utils: ChainUtils
    ): (T | undefined)[] {
        let mapping = new Map(trace.map(t => [t.txHash, t]))
        let out = new Array(block.block.transactions.length)
        for (let i = 0; i < block.block.transactions.length; i++) {
            let txHash = getTxHash(block.block.transactions[i])
            let rec = mapping.get(txHash)
            if (rec) {
                out[i] = rec
            } else {
                if (utils.isPolygonBased) continue
                throw new Error(`no ${type} for transaction`)
            }
        }
        return out
    }

    private async addTraceTxReplays(blocks: Block[], traces: TraceReplayTraces) {
        let tracers: string[] = []

        if (traces.trace) {
            tracers.push('trace')
        }

        if (traces.stateDiff) {
            tracers.push('stateDiff')
        }

        if (tracers.length == 0) return

        let call = blocks.map(block => ({
            method: 'trace_replayBlockTransactions',
            params: [block.block.hash, tracers]
        }))

        let replaysByBlock = await this.reduceBatchOnRetry(call, {
            validateResult: getResultValidator(
                array(getTraceTransactionReplayValidator(traces))
            )
        })

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let replays = replaysByBlock[i]
            let txs = new Set(block.block.transactions.map(getTxHash))

            for (let rep of replays) {
                if (!rep.transactionHash) {
                    let txHash: Bytes32 | null | undefined = undefined
                    for (let frame of rep.trace || []) {
                        assert(txHash == null || txHash === frame.transactionHash)
                        txHash = txHash || frame.transactionHash
                    }
                    assert(txHash, "can't match transaction replay with its transaction")
                    rep.transactionHash = txHash
                }

                if (!txs.has(rep.transactionHash)) {
                    block._isInvalid = true
                    block._errorMessage = 'trace_replayBlockTransactions returned a trace of a different block'
                }
            }

            block.traceReplays = replays
        }
    }

    private async reduceBatchOnRetry<T = any>(batch: { method: string, params?: any[] }[], options: CallOptions<T>): Promise<T[]> {
        if (batch.length <= 1) return this.batchCall(batch, options)

        let result = await this.batchCall(batch, { ...options, retryAttempts: 0 }).catch(err => {
            if (this.isBatchRetryableError(err)) {
                this.log.warn(err, 'will retry request with reduced batch')
            } else {
                throw err
            }
        })

        if (result != null) return result

        let pack = await Promise.all([
            this.reduceBatchOnRetry(batch.slice(0, Math.ceil(batch.length / 2)), options),
            this.reduceBatchOnRetry(batch.slice(Math.ceil(batch.length / 2)), options),
        ])

        return pack.flat()
    }

    private async getChainUtils(): Promise<ChainUtils> {
        if (this.chainUtils) return this.chainUtils
        let chainId: Qty = await this.call('eth_chainId')
        return this.chainUtils = new ChainUtils(chainId, {
            useGasUsedForReceiptsRoot: this.useGasUsedForReceiptsRoot
        })
    }

    isBatchRetryableError(err: any): boolean {
        if (this.client.isConnectionError(err)) return true
        if (err instanceof RpcProtocolError) return true
        if (err instanceof RpcError && err.message == 'response too large') return true
        if (err instanceof RpcError && err.code == -32000) return true
        return false
    }
}


const LatestBlockhash = object({
    number: NAT,
    hash: BYTES
})


export type LatestBlockhash = GetSrcType<typeof LatestBlockhash>


type GetReceiptsMethod = 'eth_getTransactionReceipt' | 'eth_getBlockReceipts'


interface FetchedTracesData {
    debugStateDiffs?: DebugStateDiffResult[] | null
    debugFrames?: DebugFrameResult[] | null
    traceBlock?: TraceFrame[]
    traceTxReplays?: any[] | null
    replayTraces: TraceReplayTraces
}


function getResultValidator<V extends Validator>(validator: V): (result: unknown) => GetSrcType<V> {
    return function (result: unknown) {
        let err = validator.validate(result)
        if (err) {
            throw new DataValidationError(`server returned unexpected result: ${err.toString()}`)
        } else {
            return result as any
        }
    }
}


function isEmpty(obj: object): boolean {
    for (let _ in obj) {
        return false
    }
    return true
}


/**
 * Recursively collects `logs` arrays from a callTracer frame and all its
 * nested sub-call frames. Only `address` and `topics` are needed by
 * `logsBloom`, but we preserve whatever shape the RPC returned (untyped).
 */
function collectFrameLogs(
    frame: any,
    out: {address: Bytes, topics: Bytes[]}[]
): void {
    if (frame == null || typeof frame !== 'object') return
    if (Array.isArray(frame.logs)) {
        for (let log of frame.logs) {
            if (log != null && typeof log === 'object' && typeof log.address === 'string' && Array.isArray(log.topics)) {
                out.push({address: log.address, topics: log.topics})
            }
        }
    }
    if (Array.isArray(frame.calls)) {
        for (let sub of frame.calls) {
            collectFrameLogs(sub, out)
        }
    }
}
