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
    DebugFrame,
    DebugStateDiff,
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
import {
    checkCallFrameTree,
    checkDebugFrameStructure,
} from './verification'
import { RpcErrorInfo } from '@subsquid/rpc-client/lib/interfaces'


export type Commitment = 'finalized' | 'latest'
export const CALL_FRAME_VALIDATION_MODES = ['off', 'observe', 'reject'] as const
const CALL_FRAME_VIOLATION_SAMPLE_LIMIT = 3

/**
 * Controls semantic call-frame consistency checks. Structural requirements needed
 * by normalization are enforced independently in every mode.
 */
export type CallFrameValidationMode = (typeof CALL_FRAME_VALIDATION_MODES)[number]


interface CallFrameViolationSample {
    transactionIndex: number
    transactionHash: Bytes32
    violation: string
}


export interface RpcOptions {
    client: EvmRpcClient,
    finalityConfirmation?: number
    verifyBlockHash?: boolean
    verifyExtDataHash?: boolean
    verifyTxSender?: boolean
    verifyTxRoot?: boolean
    verifyReceiptsRoot?: boolean
    verifyWithdrawalsRoot?: boolean
    verifyLogsBloom?: boolean
    /**
     * `off` skips semantic checks, `observe` logs one bounded violation summary
     * per block while accepting it, and `reject` marks violations invalid.
     * `reject` requires transaction root and sender verification.
     */
    callFrameValidation?: CallFrameValidationMode
    checkLogIndex?: boolean
    checkCumulativeGasUsed?: boolean
    useGasUsedForReceiptsRoot?: boolean
}


export class Rpc {
    private client: EvmRpcClient
    private finalityConfirmation?: number
    private verifyBlockHash?: boolean
    private verifyExtDataHash?: boolean
    private verifyTxSender?: boolean
    private verifyTxRoot?: boolean
    private verifyReceiptsRoot?: boolean
    private verifyWithdrawalsRoot?: boolean
    private verifyLogsBloom?: boolean
    private callFrameValidation: CallFrameValidationMode
    private checkLogIndex?: boolean
    private checkCumulativeGasUsed?: boolean
    private useGasUsedForReceiptsRoot?: boolean
    private log: Logger
    private receiptsMethod?: GetReceiptsMethod
    private chainUtils?: ChainUtils

    constructor(options: RpcOptions) {
        this.client = options.client
        this.finalityConfirmation = options.finalityConfirmation
        this.verifyBlockHash = options.verifyBlockHash
        this.verifyExtDataHash = options.verifyExtDataHash
        this.verifyTxSender = options.verifyTxSender
        this.verifyTxRoot = options.verifyTxRoot
        this.verifyReceiptsRoot = options.verifyReceiptsRoot
        this.verifyWithdrawalsRoot = options.verifyWithdrawalsRoot
        this.verifyLogsBloom = options.verifyLogsBloom
        this.callFrameValidation = options.callFrameValidation ?? 'off'
        if (!CALL_FRAME_VALIDATION_MODES.includes(this.callFrameValidation)) {
            throw new Error(`unsupported callFrameValidation mode: ${this.callFrameValidation}`)
        }
        if (this.callFrameValidation === 'reject' && (!options.verifyTxRoot || !options.verifyTxSender)) {
            throw new Error(
                "callFrameValidation 'reject' requires verifyTxRoot and verifyTxSender"
            )
        }
        this.checkLogIndex = options.checkLogIndex
        this.checkCumulativeGasUsed = options.checkCumulativeGasUsed
        this.useGasUsedForReceiptsRoot = options.useGasUsedForReceiptsRoot
        this.log = createLogger('sqd:evm-rpc')
    }

    /** RPC endpoint URL — exposed so error paths outside this class can name
     * the failing provider in logs and error context. */
    get endpoint(): string {
        return this.client.url
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

    async getBlockBatch(numbers: number[], req?: DataRequest): Promise<Block[]> {
        let transactionsRequested = req?.transactions ?? false
        // Semantic checks need the sender and target from full transaction
        // objects. Fetch those details internally even when the caller only
        // requested transaction hashes, then restore the requested shape.
        let needsTransactionsForCallFrameValidation =
            !!req?.traces &&
            !req.useTraceApi &&
            this.callFrameValidation !== 'off'
        let withTransactions = transactionsRequested || needsTransactionsForCallFrameValidation
        let blocks = await this.getBlocks(numbers, withTransactions)

        let chain: Block[] = []

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            if (block == null) break
            if (i > 0 && chain[i - 1].block.hash !== block.block.parentHash) break
            chain.push(block)
        }

        await this.addRequestedData(chain, req)

        if (!transactionsRequested && withTransactions) {
            for (let block of chain) {
                block.block.transactions = block.block.transactions.map(getTxHash)
            }
        }

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

        if (this.verifyExtDataHash && block.extDataHash != null) {
            let extDataHash = utils.calculateExtDataHash(block)
            assert.equal(block.extDataHash, extDataHash, 'failed to verify extData hash')
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

            if (utils.isStable) {
                this.fixLogIndexes(logs)
            }

            try {
                if (this.checkLogIndex) {
                    let logIndex = 0
                    for (let log of logs) {
                        assert.equal(qty2Int(log.logIndex), logIndex++, 'unexpected log index in eth_getLogs response')
                    }
                }

                if (this.verifyLogsBloom) {
                    let logsBloom = utils.calculateLogsBloom(block.block, logs)
                    assert.equal(block.block.logsBloom, logsBloom, 'failed to verify logs bloom')
                }
            } catch (err: any) {
                throw addErrorContext(err, {
                    blockNumber: block.number,
                    blockHash: block.hash,
                    rpcUrl: this.client.url,
                    rpcMethod: 'eth_getLogs'
                })
            }

            block.logs = logs
        }
    }

    private async getReceiptsMethod() {
        if (this.receiptsMethod) return this.receiptsMethod

        let utils = await this.getChainUtils()
        if (utils.isTac) {
            // tac network may fail on `eth_getBlockReceipts` request to early blocks
            return this.receiptsMethod = 'eth_getTransactionReceipt'
        }

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

        let results = await this.reduceBatchOnRetry<Receipt[] | null | typeof RESPONSE_TOO_BIG>(call, {
            validateResult: getResultValidator(nullable(array(Receipt))),
            validateError: info => {
                if (info.message.includes('invalid block height')) throw new RetryError() // Hyperliquid
                if (isResponseTooBig(info)) return RESPONSE_TOO_BIG
                throw new RpcError(info)
            }
        })

        let utils = await this.getChainUtils()
        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let receipts = results[i]
            if (receipts == RESPONSE_TOO_BIG) {
                this.log.warn({
                    blockNumber: block.number,
                    blockHash: block.hash,
                    transactionCount: block.block.transactions.length
                }, 'block receipts response too big, fetching receipts per transaction')
                receipts = await this.getReceiptsByTransaction(block)
            }
            if (receipts == null) {
                block._isInvalid = true
                block._errorMessage = 'eth_getBlockReceipts returned null'
                continue
            }

            if (utils.isHederaMainnet) {
                // eth_getBlockReceipts may return duplicated receipts for hedera
                // so we filter out those that do not match any transaction by its index
                let transactions = block.block.transactions as Transaction[]
                let txIndices = transactions.map(tx => tx.transactionIndex)
                receipts = receipts.filter(r => txIndices.includes(r.transactionIndex))
            }

            for (let receipt of receipts) {
                if (receipt.blockHash !== block.block.hash) {
                    block._isInvalid = true
                    block._errorMessage = 'eth_getBlockReceipts returned receipts for a different block'
                }
            }

            block.receipts = receipts

            let logs = []
            for (let receipt of receipts) {
                logs.push(...receipt.logs)
            }

            if (utils.isStable) {
                this.fixLogIndexes(logs)
            }

            try {
                if (this.checkLogIndex) {
                    let logIndex = 0
                    for (let log of logs) {
                        assert.equal(qty2Int(log.logIndex), logIndex++, 'unexpected log index in receipt logs')
                    }
                }

                if (this.checkCumulativeGasUsed) {
                    let prevCumulativeGasUsed = 0n
                    for (let receipt of receipts) {
                        let cumulativeGasUsed = BigInt(receipt.cumulativeGasUsed)
                        // This assertion used to fire bare ("0n == 77629n") with no
                        // hint of the failing data — name the receipt so it is
                        // identifiable from a single log line.
                        assert.equal(
                            cumulativeGasUsed,
                            prevCumulativeGasUsed + BigInt(receipt.gasUsed),
                            `cumulativeGasUsed mismatch at receipt of tx ${receipt.transactionHash}`
                        )
                        prevCumulativeGasUsed = cumulativeGasUsed
                    }
                }

                if (this.verifyLogsBloom) {
                    let computed = utils.calculateLogsBloom(block.block, logs)
                    if (computed !== block.block.logsBloom) {
                        assert.equal(block.block.logsBloom, computed, 'failed to verify logs bloom')
                    }
                }

                if (this.verifyReceiptsRoot) {
                    let root = await utils.calculateReceiptsRoot(block.block, receipts)
                    assert.equal(block.block.receiptsRoot, root, 'failed to verify receipts root')
                }
            } catch (err: any) {
                throw addErrorContext(err, {
                    blockNumber: block.number,
                    blockHash: block.hash,
                    rpcUrl: this.client.url,
                    rpcMethod: 'receipts validation (receipts-by-block path)'
                })
            }

            if (block.block.transactions.length !== receipts.length) {
                block._isInvalid = true
                block._errorMessage = `got invalid number of receipts from eth_getBlockReceipts`
            }
        }
    }

    private async getReceiptsByTransaction(block: Block): Promise<Receipt[]> {
        let call = block.block.transactions.map(tx => ({
            method: 'eth_getTransactionReceipt',
            params: [getTxHash(tx)]
        }))

        return this.reduceBatchOnRetry(call, {
            validateResult: getResultValidator(Receipt)
        })
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

            if (utils.isStable) {
                this.fixLogIndexes(logs)
            }

            try {
                if (this.checkLogIndex) {
                    let logIndex = 0
                    for (let log of logs) {
                        assert.equal(qty2Int(log.logIndex), logIndex++)
                    }
                }

                if (this.checkCumulativeGasUsed) {
                    let prevCumulativeGasUsed = 0n
                    for (let receipt of receipts) {
                        let cumulativeGasUsed = BigInt(receipt.cumulativeGasUsed)
                        assert.equal(
                            cumulativeGasUsed,
                            prevCumulativeGasUsed + BigInt(receipt.gasUsed),
                            `cumulativeGasUsed mismatch at receipt of tx ${receipt.transactionHash}`
                        )
                        prevCumulativeGasUsed = cumulativeGasUsed
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
                    blockHash: block.hash,
                    rpcUrl: this.client.url,
                    rpcMethod: 'receipts validation (eth_getTransactionReceipt path)'
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

    private async addTraceBlockTraces(blocks: Block[]) {
        // Pass the block number rather than the hash: the hash form is not
        // universally supported (e.g. Alchemy silently responds with just the
        // reward frame). Reorg consistency is ensured by the frame.blockHash
        // check below.
        let call = blocks.map(block => ({
            method: 'trace_block',
            params: [block.block.number]
        }))

        let results = await this.reduceBatchOnRetry(call, {
            validateResult: getResultValidator(array(TraceFrame))
        })

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let frames = results[i]

            for (let frame of frames) {
                if (frame.blockHash !== block.block.hash) {
                    block._isInvalid = true
                    block._errorMessage = 'trace_block returned a trace of a different block'
                    break
                }
            }
            if (block._isInvalid) continue

            let byTx = groupBy(frames, f => f.transactionHash)

            // Providers may return traces for only a subset of transactions
            // (or reward frames alone)
            for (let tx of block.block.transactions) {
                if (!byTx.has(getTxHash(tx))) {
                    block._isInvalid = true
                    block._errorMessage = 'missing traces for some transactions'
                    break
                }
            }
            if (block._isInvalid) continue

            block.traceReplays = []
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

    private async addDebugStateDiffs(blocks: Block[], req: DataRequest) {
        let traceConfig = {
            tracer: 'prestateTracer',
            tracerConfig: {
                onlyTopCall: false, // passing this option is incorrect, but required by Alchemy endpoints
                diffMode: true,
            },
            timeout: req.debugTraceTimeout
        }

        let call = blocks.map(block => {
            if (req.useDebugTraceBlockByNumber) {
                return {
                    method: 'debug_traceBlockByNumber',
                    params: [block.block.number, traceConfig]
                }
            } else {
                return {
                    method: 'debug_traceBlockByHash',
                    params: [block.hash, traceConfig]
                }
            }
        })

        let results = await this.reduceBatchOnRetry<DebugStateDiffResult[] | null | typeof RESPONSE_TOO_BIG>(call, {
            validateResult: getResultValidator(array(DebugStateDiffResult)),
            validateError: info => {
                if (info.message.includes('not found')) return null
                if (info.message.includes('cannot query unfinalized data')) return null // Avalanche
                if (isResponseTooBig(info)) return RESPONSE_TOO_BIG
                throw new RpcError(info)
            }
        })

        let utils = await this.getChainUtils()
        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let diffs = results[i]

            if (diffs == RESPONSE_TOO_BIG) {
                this.log.warn({
                    blockNumber: block.number,
                    blockHash: block.hash,
                    transactionCount: block.block.transactions.length
                }, 'state diff response too big, tracing per transaction')
                diffs = await this.getDebugStateDiffsByTransaction(block, traceConfig)
            }

            if (diffs == null) {
                block._isInvalid = true
                block._errorMessage = "failed to get debug state diffs for a block"
            } else if (block.block.transactions.length === diffs.length) {
                block.debugStateDiffs = diffs
            } else {
                block.debugStateDiffs = this.matchDebugTrace('debug state diff', block, diffs, utils)
            }
        }
    }

    private async getDebugStateDiffsByTransaction(block: Block, traceConfig: unknown): Promise<DebugStateDiffResult[]> {
        let txHashes = block.block.transactions.map(getTxHash)
        let call = txHashes.map(txHash => ({
            method: 'debug_traceTransaction',
            params: [txHash, traceConfig]
        }))

        let results = await this.reduceBatchOnRetry(call, {
            validateResult: getResultValidator(DebugStateDiff)
        })

        return results.map((result, i) => ({
            result,
            txHash: txHashes[i]
        }))
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

        let utils = await this.getChainUtils()
        if (utils.isTac) {
            // tac network doesn't accept traceConfig parameter
            delete (traceConfig as any).tracerConfig
        }

        let call = blocks.map(block => {
            if (req.useDebugTraceBlockByNumber) {
                return {
                    method: 'debug_traceBlockByNumber',
                    params: [block.block.number, traceConfig]
                }
            } else {
                return {
                    method: 'debug_traceBlockByHash',
                    params: [block.hash, traceConfig]
                }
            }
        })

        let validateFrameResult = getResultValidator(array(DebugFrameResult))

        let results = await this.reduceBatchOnRetry<DebugFrameResult[] | null | typeof RESPONSE_TOO_BIG>(call, {
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
                if (isResponseTooBig(info)) return RESPONSE_TOO_BIG
                throw new RpcError(info)
            }
        })

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let frames = results[i]

            if (frames == RESPONSE_TOO_BIG) {
                this.log.warn({
                    blockNumber: block.number,
                    blockHash: block.hash,
                    transactionCount: block.block.transactions.length
                }, 'call frame response too big, tracing per transaction')
                frames = await this.getDebugFramesByTransaction(block, traceConfig)
            }

            if (frames == null) {
                block._isInvalid = true
                block._errorMessage = "failed to get debug call frames for a block"
            } else if (block.block.transactions.length === frames.length) {
                block.debugFrames = frames
            } else {
                block.debugFrames = this.matchDebugTrace('debug call frame', block, frames, utils)
            }
            this.validateDebugFrames(block)
        }
    }

    private async getDebugFramesByTransaction(block: Block, traceConfig: unknown): Promise<DebugFrameResult[]> {
        let txHashes = block.block.transactions.map(getTxHash)
        let call = txHashes.map(txHash => ({
            method: 'debug_traceTransaction',
            params: [txHash, traceConfig]
        }))

        let results = await this.reduceBatchOnRetry(call, {
            validateResult: getResultValidator(DebugFrame)
        })

        return results.map((result, i) => ({
            result,
            txHash: txHashes[i]
        }))
    }

    private validateDebugFrames(block: Block): void {
        if (block._isInvalid || block.debugFrames == null) return

        let violatingTransactionCount = 0
        let violationSamples: CallFrameViolationSample[] = []

        for (let i = 0; i < block.debugFrames.length; i++) {
            let frame = block.debugFrames[i]
            let tx = block.block.transactions[i]
            if (frame == null || tx == null) continue

            let transactionHash = getTxHash(tx)

            if (frame.txHash != null && frame.txHash.toLowerCase() !== transactionHash.toLowerCase()) {
                block._isInvalid = true
                block._errorMessage =
                    `invalid debug call frames for transaction ${transactionHash}: ` +
                    `response is labelled with transaction ${frame.txHash}`
                return
            }

            let structuralViolation = checkDebugFrameStructure(frame.result)
            if (structuralViolation) {
                block._isInvalid = true
                block._errorMessage =
                    `invalid debug call frames for transaction ${transactionHash}: ${structuralViolation}`
                return
            }

            if (this.callFrameValidation === 'off') continue

            if (typeof tx === 'string') {
                block._isInvalid = true
                let context = `cannot validate debug call frames for transaction ${transactionHash}`
                block._errorMessage = `${context}: full transaction details are missing`
                return
            }

            let violation = checkCallFrameTree(tx, frame.result)
            if (violation === undefined) continue

            if (this.callFrameValidation === 'observe') {
                violatingTransactionCount += 1
                if (violationSamples.length < CALL_FRAME_VIOLATION_SAMPLE_LIMIT) {
                    violationSamples.push({
                        transactionIndex: i,
                        transactionHash,
                        violation
                    })
                }
            } else {
                // Rejection keeps an unsafe response out of the archive and lets the
                // existing retry/fallback path ask another upstream.
                block._isInvalid = true
                block._errorMessage =
                    `invalid debug call frames for transaction ${transactionHash}: ${violation}`
                return
            }
        }

        if (violatingTransactionCount > 0) {
            let transactionLabel = violatingTransactionCount === 1 ? 'transaction' : 'transactions'
            let transactionSummary = `${violatingTransactionCount} ${transactionLabel}`
            this.log.warn(
                {
                    rpcEndpoint: this.client.url,
                    blockNumber: block.number,
                    blockHash: block.hash,
                    callFrameValidation: this.callFrameValidation,
                    violatingTransactionCount,
                    violationSamples,
                    omittedViolationCount: violatingTransactionCount - violationSamples.length
                },
                `debug call frame consistency violations observed in ${transactionSummary}; block accepted`
            )
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
                nullable(array(getTraceTransactionReplayValidator(traces)))
            )
        })

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let replays = replaysByBlock[i]
            // A provider can transiently return `null` for a freshly produced
            // (tip) block whose trace index isn't ready yet. Treat it like the
            // debug_trace* paths do — flag the block for retry instead of
            // crashing ingestion with a fatal "null is not an array" error.
            if (replays == null) {
                block._isInvalid = true
                block._errorMessage = 'failed to get trace replays for a block'
                continue
            }
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
        if (err instanceof RpcError && /response.*too large/i.test(err.message)) return true
        if (err instanceof RpcError && err.code == -32000) return true
        return false
    }

    private fixLogIndexes(logs: Log[]) {
        let logIndex = 0
        for (let log of logs) {
            log.logIndex = toQty(logIndex++)
        }
    }
}


const LatestBlockhash = object({
    number: NAT,
    hash: BYTES
})


export type LatestBlockhash = GetSrcType<typeof LatestBlockhash>


type GetReceiptsMethod = 'eth_getTransactionReceipt' | 'eth_getBlockReceipts'


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


const RESPONSE_TOO_BIG = Symbol('RESPONSE_TOO_BIG')


// Matches oversized responses from a single RPC call. Batch-level errors are
// handled by reduceBatchOnRetry(), which splits the batch before this check is used.
function isResponseTooBig(err: RpcErrorInfo): boolean {
    if (/response is too big/i.test(err.message)) return true
    if (/response is too large/i.test(err.message)) return true
    if (/response too large/i.test(err.message)) return true
    return false
}
