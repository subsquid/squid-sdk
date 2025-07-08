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
import {assertNotNull, groupBy} from '@subsquid/util-internal'
import assert from 'assert'
import {
    GetBlock,
    Receipt,
    TraceFrame,
    DebugStateDiffResult,
    DebugFrameResult,
    TraceReplayTraces,
    getTraceTransactionReplayValidator,
    Transaction
} from './rpc-data'
import {Block, DataRequest, Qty, Bytes, Bytes32} from './types'
import {qty2Int, toQty, getTxHash} from './util'
import {blockHash, logsBloom, transactionRoot} from './verification'


export function isEmpty(obj: object): boolean {
    for (let _ in obj) {
        return false
    }
    return true
}


export type Commitment = 'finalized' | 'latest'


export interface RpcOptions {
    client: RpcClient,
    finalityConfirmation?: number
    verifyTransactionsRoot?: boolean
    verifyBlockHash?: boolean
    verifyLogsBloom?: boolean
}


export class Rpc {
    private client: RpcClient
    private finalityConfirmation?: number
    private verifyBlockHash?: boolean
    private verifyTransactionsRoot?: boolean
    private verifyLogsBloom?: boolean
    private log: Logger

    constructor(options: RpcOptions) {
        this.client = options.client
        this.finalityConfirmation = options.finalityConfirmation
        this.verifyBlockHash = options.verifyBlockHash
        this.verifyTransactionsRoot = options.verifyTransactionsRoot
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
        let block = await this.call('eth_getBlockByNumber', [commitment, false], {
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

        for (let i = 0; i < chain.length; i++) {
            if (chain[i]._isInvalid) return chain.slice(0, i)
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
                // Avalanche
                if (/cannot query unfinalized data/i.test(info.message)) return null
                throw new RpcError(info)
            }
        })

        let blocks = new Array(results.length)
        for (let i = 0; i < results.length; i++) {
            let block = results[i]
            if (block == null) {
                blocks[i] = null
            } else {
                if (this.verifyBlockHash) {
                    assert(block.hash == blockHash(block))
                }
                if (this.verifyTransactionsRoot && withTransactions) {
                    let txRoot = await transactionRoot(block.transactions as Transaction[])
                    assert(txRoot == block.transactionsRoot)
                }
                blocks[i] = {
                    number: qty2Int(block.number),
                    hash: block.hash,
                    block
                }
            }
        }

        return blocks
    }

    private async addRequestedData(blocks: Block[], req?: DataRequest) {
        let subtasks = []

        if (req?.receipts) {
            subtasks.push(this.addReceipts(blocks))
        }

        if (req?.traces || req?.stateDiffs) {
            subtasks.push(this.addTraces(blocks, req))
        }

        await Promise.all(subtasks)
    }

    private async addReceipts(blocks: Block[]) {
        let call = blocks.map(block => ({
            method: 'eth_getBlockReceipts',
            params: [block.block.number]
        }))

        let results = await this.reduceBatchOnRetry(call, {
            validateResult: getResultValidator(nullable(array(Receipt)))
        })

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let receipts = results[i]
            if (receipts == null) {
                block._isInvalid = true
                continue
            }

            block.receipts = receipts

            let logs = []
            for (let receipt of receipts) {
                logs.push(...receipt.logs)
                if (receipt.blockHash !== block.block.hash) {
                    block._isInvalid = true
                }
            }

            if (this.verifyLogsBloom) {
                assert(block.block.logsBloom == logsBloom(logs))
            }

            if (block.block.transactions.length !== receipts.length) {
                block._isInvalid = true
            }
        }
    }

    private async addTraces(blocks: Block[], req: DataRequest) {
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
            params: [block.block.number]
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
                }
                continue
            }

            for (let frame of frames) {
                if (frame.blockHash !== block.block.hash) {
                    block._isInvalid = true
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
            validateError: captureNotFound
        })

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let diffs = results[i]
            if (diffs == null) {
                block._isInvalid = true
            } else if (block.block.transactions.length === diffs.length) {
                block.debugStateDiffs = diffs
            } else {
                block.debugStateDiffs = this.matchDebugTrace(block, diffs)
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

        let results = await this.batchCall(call, {
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
            validateError: captureNotFound
        })

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let frames = results[i]
            if (frames == null) {
                block._isInvalid = true
            } else if (block.block.transactions.length === frames.length) {
                block.debugFrames = frames
            } else {
                block.debugFrames = this.matchDebugTrace(block, frames)
            }
        }
    }

    private matchDebugTrace<T extends {txHash?: Bytes | null}>(block: Block, trace: T[]): T[] {
        let mapping = new Map(trace.map(t => [t.txHash, t]))
        let out = new Array(block.block.transactions.length)
        for (let i = 0; i < block.block.transactions.length; i++) {
            let txHash = getTxHash(block.block.transactions[i])
            let rec = assertNotNull(mapping.get(txHash))
            out[i] = rec
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
            params: [block.block.number, tracers]
        }))

        let replaysByBlock = await this.batchCall(call, {
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
                    assert(txHash, "Can't match transaction replay with its transaction")
                    rep.transactionHash = txHash
                }

                if (!txs.has(rep.transactionHash)) {
                    block._isInvalid = true
                }
            }

            block.traceReplays = replays
        }
    }

    private async reduceBatchOnRetry<T=any>(batch: {method: string, params?: any[]}[], options: CallOptions<T>): Promise<T[]>  {
        if (batch.length <= 1) return this.batchCall(batch, options)

        let result = await this.batchCall(batch, {...options, retryAttempts: 0}).catch(err => {
            if (this.client.isConnectionError(err) || err instanceof RpcProtocolError) {
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
}


const LatestBlockhash = object({
    number: NAT,
    hash: BYTES
})


export type LatestBlockhash = GetSrcType<typeof LatestBlockhash>


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


function captureNotFound(info: RpcErrorInfo): null {
    if (info.message.includes('not found')) return null
    throw new RpcError(info)
}
