import {Logger, createLogger} from '@subsquid/logger'
import {CallOptions, RpcClient, RpcError, RpcProtocolError} from '@subsquid/rpc-client'
import {RpcErrorInfo} from '@subsquid/rpc-client/lib/interfaces'
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
import {addErrorContext, groupBy, last} from '@subsquid/util-internal'
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
import {Block, DataRequest, Qty, Bytes, Bytes32} from './types'
import {qty2Int, toQty, getTxHash} from './util'
import {ChainUtils} from './chain-utils'


export type Commitment = 'finalized' | 'latest'


export interface RpcOptions {
    client: RpcClient,
    finalityConfirmation?: number
    verifyBlockHash?: boolean
    verifyTxSender?: boolean
    verifyTxRoot?: boolean
    verifyReceiptsRoot?: boolean
    verifyLogsBloom?: boolean
}


export class Rpc {
    private client: RpcClient
    private finalityConfirmation?: number
    private verifyBlockHash?: boolean
    private verifyTxSender?: boolean
    private verifyTxRoot?: boolean
    private verifyReceiptsRoot?: boolean
    private verifyLogsBloom?: boolean
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
        this.verifyLogsBloom = options.verifyLogsBloom
        this.log = createLogger('sqd:evm-rpc')
    }

    getConcurrency(): number {
        return this.client.getConcurrency()
    }

    call<T=any>(method: string, params?: any[], options?: CallOptions<T>): Promise<T> {
        return this.client.call(method, params, options)
    }

    batchCall<T=any>(batch: {method: string, params?: any[]}[], options?: CallOptions<T>): Promise<T[]> {
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
        let blocks = await this.getBlocks(numbers, req?.transactions ?? false)

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
                // Avalanche
                if (info.message.includes('cannot query unfinalized data')) return null // Avalanche
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

            try {
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
        switch(method) {
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
            validateResult: getResultValidator(nullable(array(Receipt)))
        })

        let utils = await this.getChainUtils()
        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let receipts = results[i]
            if (receipts == null) {
                block._isInvalid = true
                block._errorMessage = 'eth_getBlockReceipts returned null'
                continue
            }

            block.receipts = receipts

            let logs = []
            for (let receipt of receipts) {
                logs.push(...receipt.logs)
                if (receipt.blockHash !== block.block.hash) {
                    block._isInvalid = true
                    block._errorMessage = 'eth_getBlockReceipts returned receipts for a different block'
                }
            }

            try {
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

            if (block.block.transactions.length !== receipts.length) {
                block._isInvalid = true
                block._errorMessage = 'got invalid number of receipts from eth_getBlockReceipts'
            }
        }
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

            if (receipts.length !== block.block.transactions.length) {
                block._isInvalid = true
                block._errorMessage = 'failed to get receipts for all transactions'
                continue
            }

            try {
                if (this.verifyLogsBloom) {
                    let logs = receipts.flatMap(r => r.logs)
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
                            result[i] = {result: result[i]}
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

    private matchDebugTrace<T extends {txHash?: Bytes | null}>(
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
                if (utils.isPolygonMainnet) continue
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

    private async reduceBatchOnRetry<T=any>(batch: {method: string, params?: any[]}[], options: CallOptions<T>): Promise<T[]>  {
        if (batch.length <= 1) return this.batchCall(batch, options)

        let result = await this.batchCall(batch, {...options, retryAttempts: 0}).catch(err => {
            if (this.isRetryableError(err)) {
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
        return this.chainUtils = new ChainUtils(chainId)
    }

    isRetryableError(err: any): boolean {
        if (this.client.isConnectionError(err)) return true
        if (err instanceof RpcProtocolError) return true
        if (err instanceof RpcError && err.message == 'response too large') return true
        if (err instanceof RpcError && err.code == 429) return true
        return false
    }
}


const LatestBlockhash = object({
    number: NAT,
    hash: BYTES
})


export type LatestBlockhash = GetSrcType<typeof LatestBlockhash>


type GetReceiptsMethod = 'eth_getTransactionReceipt' | 'eth_getBlockReceipts'


function getResultValidator<V extends Validator>(validator: V): (result: unknown) => GetSrcType<V> {
    return function(result: unknown) {
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
