import {Logger} from '@subsquid/logger'
import {CallOptions, RpcClient, RpcError} from '@subsquid/rpc-client'
import {RpcErrorInfo} from '@subsquid/rpc-client/lib/interfaces'
import {groupBy, last} from '@subsquid/util-internal'
import {assertIsValid, BlockConsistencyError, trimInvalid} from '@subsquid/util-internal-ingest-tools'
import {FiniteRange, rangeToArray, SplitRequest} from '@subsquid/util-internal-range'
import {array, DataValidationError, GetSrcType, nullable, Validator} from '@subsquid/util-internal-validation'
import assert from 'assert'
import {Bytes, Bytes32, Qty} from '../interfaces/base'
import {isEmpty} from '../mapping/schema'
import {
    Block,
    DataRequest,
    DebugFrameResult,
    DebugStateDiffResult,
    GetBlock,
    GetBlockNoTransactions,
    GetBlockWithTransactions,
    getTraceTransactionReplayValidator,
    Log,
    TraceFrame,
    TraceReplayTraces,
    TransactionReceipt
} from './rpc-data'
import {getTxHash, qty2Int, toQty} from './util'


const NO_LOGS_BLOOM = '0x'+Buffer.alloc(256).toString('hex')


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


export interface RpcValidationFlags {
    /**
     * Checks the logs list is non-empty if logsBloom is non-zero
     */
    disableLogsBloomCheck?: boolean 
    /**
     * Checks the tx count matches the number tx receipts
     */
    disableTxReceiptsNumberCheck?: boolean,
    /**
     * Checks if the are no traces for a non-empty block
     */
    disableMissingTracesCheck?: boolean
    /**
     * Checks the block hash matches the trace blockHash field
     */
    disableTraceBlockHashCheck?: boolean
    /**
     * Checks the block hash matches the tx receipt blockHash field
     */
    disableTxReceiptBlockHashCheck?: boolean
}


export class Rpc {
    private props: RpcProps
    
    constructor(
        public readonly client: RpcClient,
        private log?: Logger,
        private validation: RpcValidationFlags = {},
        private genesisHeight: number = 0,
        private priority: number = 0,
        props?: RpcProps,
    ) {
        this.props = props || new RpcProps(this.client, this.genesisHeight)
        if (this.validation.disableLogsBloomCheck) {
            log?.warn(`Log bloom check is disabled`)
        }
        if (this.validation.disableMissingTracesCheck) {
            log?.warn(`Missing traces check is disabled`)
        }
        if (this.validation.disableTxReceiptsNumberCheck) {
            log?.warn(`Tx receipt number check is disabled`)
        }
    }

    withPriority(priority: number): Rpc {
        return new Rpc(this.client, this.log, this.validation, this.genesisHeight, priority, this.props)
    }

    call<T=any>(method: string, params?: any[], options?: CallOptions<T>): Promise<T> {
        return this.client.call(method, params, {priority: this.priority, ...options})
    }

    batchCall<T=any>(batch: {method: string, params?: any[]}[], options?: CallOptions<T>): Promise<T[]> {
        return this.client.batchCall(batch, {priority: this.priority, ...options})
    }

    getBlockByNumber(height: number, withTransactions: boolean): Promise<GetBlock | null> {
        return this.call('eth_getBlockByNumber', [
            toQty(height),
            withTransactions
        ], {
            validateResult: getResultValidator(
                withTransactions ? nullable(GetBlockWithTransactions) : nullable(GetBlockNoTransactions)
            )
        })
    }

    getBlockByHash(hash: Bytes, withTransactions: boolean): Promise<GetBlock | null> {
        return this.call('eth_getBlockByHash', [hash, withTransactions], {
            validateResult: getResultValidator(
                withTransactions ? nullable(GetBlockWithTransactions) : nullable(GetBlockNoTransactions)
            )
        })
    }

    async getBlockHash(height: number): Promise<Bytes | undefined> {
        let block = await this.getBlockByNumber(height, false)
        return block?.hash
    }

    async getHeight(): Promise<number> {
        let height: Qty = await this.call('eth_blockNumber')
        return qty2Int(height)
    }

    async getColdBlock(blockHash: Bytes32, req?: DataRequest, finalizedHeight?: number): Promise<Block> {
        let block = await this.getBlockByHash(blockHash, req?.transactions || false).then(toBlock)
        if (block == null) throw new BlockConsistencyError({hash: blockHash})
        if (req) {
            await this.addRequestedData([block], req, finalizedHeight)
        }
        if (block._isInvalid) throw new BlockConsistencyError(block, block._errorMessage)
        return block
    }

    async getColdSplit(req: SplitRequest<DataRequest>): Promise<Block[]> {
        let blocks = await this.getColdBlockBatch(
            rangeToArray(req.range),
            req.request.transactions ?? false,
            1
        )
        return this.addColdRequestedData(blocks, req.request, 1)
    }

    private async addColdRequestedData(blocks: Block[], req: DataRequest, depth: number): Promise<Block[]> {
        let result = blocks.map(b => ({...b}))

        await this.addRequestedData(result, req)

        if (depth > 9) {
            assertIsValid(result)
            return result
        }

        let missing: number[] = []
        for (let i = 0; i < result.length; i++) {
            if (result[i]._isInvalid) {
                missing.push(i)
            }
        }

        if (missing.length == 0) return result

        let missed = await this.addColdRequestedData(
            missing.map(i => blocks[i]),
            req,
            depth + 1
        )

        for (let i = 0; i < missing.length; i++) {
            result[missing[i]] = missed[i]
        }

        return result
    }

    private async getColdBlockBatch(numbers: number[], withTransactions: boolean, depth: number): Promise<Block[]> {
        let result = await this.getBlockBatch(numbers, withTransactions)
        let missing: number[] = []
        for (let i = 0; i < result.length; i++) {
            if (result[i] == null) {
                missing.push(i)
            }
        }

        if (missing.length == 0) return result as Block[]

        if (depth > 9) throw new BlockConsistencyError({
            height: numbers[missing[0]]
        }, `failed to get finalized block after ${depth} attempts`)

        let missed = await this.getColdBlockBatch(
            missing.map(i => numbers[i]),
            withTransactions,
            depth + 1
        )

        for (let i = 0; i < missing.length; i++) {
            result[missing[i]] = missed[i]
        }

        return result as Block[]
    }

    async getHotSplit(req: SplitRequest<DataRequest> & {finalizedHeight: number}): Promise<Block[]> {
        let blocks = await this.getBlockBatch(rangeToArray(req.range), req.request.transactions ?? false)

        let chain: Block[] = []

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            if (block == null) break
            if (i > 0 && chain[i - 1].hash !== block.block.parentHash) break
            chain.push(block)
        }

        await this.addRequestedData(chain, req.request, req.finalizedHeight)

        return trimInvalid(chain)
    }

    private async getBlockBatch(numbers: number[], withTransactions: boolean): Promise<(Block | undefined)[]> {
        let call = numbers.map(height => {
            return {
                method: 'eth_getBlockByNumber',
                params: [toQty(height), withTransactions]
            }
        })
        let blocks = await this.batchCall(call, {
            validateResult: getResultValidator(
                withTransactions ? nullable(GetBlockWithTransactions) : nullable(GetBlockNoTransactions)
            ),
            validateError: info => {
                // Avalanche
                if (/cannot query unfinalized data/i.test(info.message)) return null
                throw new RpcError(info)
            }
        })
        return blocks.map(toBlock)
    }

    private async addRequestedData(blocks: Block[], req: DataRequest, finalizedHeight?: number): Promise<void> {
        if (blocks.length == 0) return

        let subtasks = []

        if (req.logs) {
            subtasks.push(this.addLogs(blocks))
        }

        if (req.receipts) {
            subtasks.push(this.addReceipts(blocks))
        }

        if (req.traces || req.stateDiffs) {
            subtasks.push(this.addTraces(blocks, req, finalizedHeight))
        }

        await Promise.all(subtasks)
    }

    private async addLogs(blocks: Block[]): Promise<void> {
        if (blocks.length == 0) return

        let logs = await this.getLogs(
            blocks[0].height,
            last(blocks).height
        )

        let logsByBlock = groupBy(logs, log => log.blockHash)

        for (let block of blocks) {
            let logs = logsByBlock.get(block.hash) || []
            block.logs = logs

            if (!this.validation.disableLogsBloomCheck && (logs.length === 0 && block.block.logsBloom !== NO_LOGS_BLOOM)) {
                block._isInvalid = true
                block._errorMessage = 'got 0 log records from eth_getLogs, but logs bloom is not empty'
            } 
        }
    }

    getLogs(from: number, to: number): Promise<Log[]> {
        return this.call('eth_getLogs', [{
            fromBlock: toQty(from),
            toBlock: toQty(to)
        }], {
            validateResult: getResultValidator(array(Log)),
            validateError: info => {
                if (info.message.includes('after last accepted block')) {
                    // Regular RVM networks simply return an empty array in case
                    // of out of range request, but Avalanche returns an error.
                    return []
                }
                throw new RpcError(info)
            }
        }).catch(async err => {
            if (isQueryReturnedMoreThanNResultsError(err)) {
                let range = asTryAnotherRangeError(err)
                if (range == null) {
                    range = {from, to: Math.floor(from + (to - from) / 2)}
                }

                if (range.from == from && from <= range.to && to > range.to) {
                    let result = await Promise.all([this.getLogs(range.from, range.to), this.getLogs(range.to + 1, to)])
                    return result[0].concat(result[1])
                } else {
                    this.log?.warn(
                        {range: [from, to]},
                        `unable to fetch logs with eth_getLogs, fallback to eth_getTransactionReceipt`
                    )

                    let result = await Promise.all(rangeToArray({from, to}).map(n => this.getLogsByReceipts(n)))
                    return result.flat()
                }
            }
            throw err
        })
    }

    private async getLogsByReceipts(blockHeight: number): Promise<Log[]> {
        let header = await this.getBlockByNumber(blockHeight, false)
        if (header == null) return []

        let validateResult = getResultValidator(nullable(TransactionReceipt))
        let receipts = await Promise.all(
            header.transactions.map((tx) =>
                this.call('eth_getTransactionReceipt', [getTxHash(tx)], {validateResult})
            )
        )

        let logs: Log[] = []
        for (let receipt of receipts) {
            if (receipt == null || receipt.blockHash !== header.hash) return []
            logs.push(...receipt.logs)
        }

        return logs
    }

    private async addReceipts(blocks: Block[]): Promise<void> {
        let method = await this.props.getReceiptsMethod()
        switch(method) {
            case 'alchemy_getTransactionReceipts':
            case 'eth_getBlockReceipts':
                return this.addReceiptsByBlock(blocks, method)
            default:
                return this.addReceiptsByTx(blocks)
        }
    }

    private async addReceiptsByBlock(
        blocks: Block[],
        method: 'eth_getBlockReceipts' | 'alchemy_getTransactionReceipts'
    ): Promise<void> {
        let call = blocks.map(block => {
            if (method == 'eth_getBlockReceipts') {
                return {
                    method,
                    params: [block.block.number]
                }
            } else {
                return {
                    method,
                    params: [{blockHash: block.hash}]
                }
            }
        })

        let results: (TransactionReceipt[] | null)[] = await this.batchCall(call, {
            validateResult: getResultValidator(nullable(array(TransactionReceipt)))
        })

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let receipts = results[i]
            if (receipts == null) {
                block._isInvalid = true
                block._errorMessage = `${method} returned null`
                continue
            } 

            block.receipts = receipts
            
            // block hash check
            if (!this.validation.disableTxReceiptBlockHashCheck) {
                for (let receipt of receipts) {
                    if (receipt.blockHash !== block.hash) {
                        // for the hash mismatch, fail anyway
                        block._isInvalid = true
                        block._errorMessage = `${method} returned receipts for a different block`
                    }
                }
            }

            // count match check
            if (!this.validation.disableTxReceiptsNumberCheck && (block.block.transactions.length !== receipts.length)) {
                block._isInvalid = true
                block._errorMessage = `got invalid number of receipts from ${method}`
            } 
                     
        }
    }

    private async addReceiptsByTx(blocks: Block[]): Promise<void> {
        let call = []
        for (let block of blocks) {
            for (let tx of block.block.transactions) {
                call.push({
                    method: 'eth_getTransactionReceipt',
                    params: [getTxHash(tx)]
                })
            }
        }

        let receipts = await this.batchCall(call, {
            validateResult: getResultValidator(nullable(TransactionReceipt))
        })

        let receiptsByBlock = groupBy(
            receipts.filter(r => r != null) as TransactionReceipt[],
            r => r.blockHash
        )

        for (let block of blocks) {
            let rs = receiptsByBlock.get(block.hash) || []
            block.receipts = rs

            if (!this.validation.disableTxReceiptsNumberCheck && (rs.length !== block.block.transactions.length)) {
                block._isInvalid = true
                block._errorMessage = 'failed to get receipts for all transactions'
            }
        }
    }

    private async addTraceTxReplays(
        blocks: Block[],
        traces: TraceReplayTraces,
        method: string = 'trace_replayBlockTransactions'
    ): Promise<void> {
        let tracers: string[] = []

        if (traces.trace) {
            tracers.push('trace')
        }

        if (traces.stateDiff) {
            tracers.push('stateDiff')
        }

        if (tracers.length == 0) return

        let call = blocks.map(block => ({
            method,
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
                if (!rep.transactionHash) { // FIXME: Who behaves like that? Arbitrum?
                    let txHash: Bytes32 | null | undefined = undefined
                    for (let frame of rep.trace || []) {
                        assert(txHash == null || txHash === frame.transactionHash)
                        txHash = txHash || frame.transactionHash
                    }
                    assert(txHash, "Can't match transaction replay with its transaction")
                    rep.transactionHash = txHash
                }
                // Sometimes replays might be missing. FIXME: when?
                if (!txs.has(rep.transactionHash)) {
                    block._isInvalid = true
                    block._errorMessage = `${method} returned a trace of a different block`
                }
            }

            block.traceReplays = replays
        }
    }

    private async addTraceBlockTraces(blocks: Block[]): Promise<void> {
        let call = blocks.map(block => ({
            method: 'trace_block',
            params: [block.block.number]
        }))

        let results = await this.batchCall(call, {
            validateResult: getResultValidator(array(TraceFrame))
        })

        
        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let frames = results[i]
            
            if (frames.length == 0) {
                if (!this.validation.disableMissingTracesCheck && (block.block.transactions.length > 0)) {
                    block._isInvalid = true
                    block._errorMessage = 'missing traces for some transactions'
                }
                continue
            }  
            
            for (let frame of frames) {
                if (!this.validation.disableTraceBlockHashCheck && frame.blockHash !== block.hash) {
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

    private async addDebugFrames(blocks: Block[], req: DataRequest): Promise<void> {
        let traceConfig = {
            tracer: 'callTracer',
            tracerConfig: {
                onlyTopCall: false,
                withLog: false, // will study log <-> frame matching problem later
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
                block._errorMessage = 'got "block not found" from debug_traceBlockByHash'
            } else if (block.block.transactions.length === frames.length) {
                block.debugFrames = frames
            } else {
                block.debugFrames = this.matchDebugTrace(
                    'debug call frame',
                    block,
                    frames
                )
            }
        }
    }

    private async addDebugStateDiffs(blocks: Block[], req: DataRequest): Promise<void> {
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

        let results = await this.batchCall(call, {
            validateResult: getResultValidator(array(DebugStateDiffResult)),
            validateError: captureNotFound
        })

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let diffs = results[i]
            if (diffs == null) {
                block._isInvalid = true
                block._errorMessage = 'got "block not found" from debug_traceBlockByHash'
            } else if (block.block.transactions.length === diffs.length) {
                block.debugStateDiffs = diffs
            } else {
                block.debugStateDiffs = this.matchDebugTrace(
                    'debug state diff',
                    block,
                    diffs
                )
            }
        }
    }

    private matchDebugTrace<T extends {txHash?: Bytes | null}>(type: string, block: Block, trace: T[]): (T | undefined)[] {
        let mapping = new Map(trace.map(t => [t.txHash, t]))
        let out = new Array(block.block.transactions.length)
        for (let i = 0; i < block.block.transactions.length; i++) {
            let txHash = getTxHash(block.block.transactions[i])
            let rec = mapping.get(txHash)
            if (rec) {
                out[i] = rec
            } else {
                this.log?.warn({
                    blockHeight: block.height,
                    blockHash: block.hash,
                    transactionIndex: i,
                    transactionHash: txHash
                }, `no ${type} for transaction`)
            }
        }
        return out
    }

    private async addArbitrumOneTraces(blocks: Block[], req: DataRequest): Promise<void> {
        if (req.stateDiffs) {
            throw new Error('State diffs are not supported on Arbitrum One')
        }
        if (!req.traces) return

        let arbBlocks = blocks.filter(b => b.height <= 22207815)
        let debugBlocks = blocks.filter(b => b.height >= 22207818)

        if (arbBlocks.length) {
            await this.addTraceTxReplays(arbBlocks, {trace: true}, 'arbtrace_replayBlockTransactions')
        }

        if (debugBlocks.length) {
            await this.addDebugFrames(debugBlocks, req)
        }
    }

    private async addTraces(
        blocks: Block[],
        req: DataRequest,
        finalizedHeight: number = Number.MAX_SAFE_INTEGER
    ): Promise<void> {
        let isArbitrumOne = await this.props.getGenesisHash() === '0x7ee576b35482195fc49205cec9af72ce14f003b9ae69f6ba0faef4514be8b442'
        if (isArbitrumOne) return this.addArbitrumOneTraces(blocks, req)

        let tasks: Promise<void>[] = []
        let replayTraces: TraceReplayTraces = {}

        if (req.stateDiffs) {
            if (finalizedHeight < last(blocks).height || req.useDebugApiForStateDiffs) {
                tasks.push(this.addDebugStateDiffs(blocks, req))
            } else {
                replayTraces.stateDiff = true
            }
        }

        if (req.traces) {
            if (req.preferTraceApi) {
                if (finalizedHeight < last(blocks).height || isEmpty(replayTraces)) {
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
}


type GetReceiptsMethod =
    'eth_getTransactionReceipt' |
    'eth_getBlockReceipts' |
    'alchemy_getTransactionReceipts'


class RpcProps {
    private genesisHash?: Bytes
    private receiptsMethod?: GetReceiptsMethod

    constructor(
        private client: RpcClient,
        private genesisHeight: number = 0
    ) {}

    async getGenesisHash(): Promise<Bytes> {
        if (this.genesisHash) return this.genesisHash
        let rpc = new Rpc(this.client)
        let hash = await rpc.getBlockHash(this.genesisHeight)
        if (hash == null) throw new Error(`block ${this.genesisHeight} is not known to ${this.client.url}`)
        return this.genesisHash = hash
    }

    async getReceiptsMethod(): Promise<GetReceiptsMethod> {
        if (this.receiptsMethod) return this.receiptsMethod

        let alchemy = await this.client.call('alchemy_getTransactionReceipts', [{blockNumber: '0x1'}]).then(
            res => Array.isArray(res),
            () => false
        )
        if (alchemy) return this.receiptsMethod = 'alchemy_getTransactionReceipts'

        let eth = await this.client.call('eth_getBlockReceipts', ['latest']).then(
            res => Array.isArray(res),
            () => false
        )
        if (eth) return this.receiptsMethod = 'eth_getBlockReceipts'

        return this.receiptsMethod = 'eth_getTransactionReceipt'
    }
}

function isQueryReturnedMoreThanNResultsError(err: unknown) {
    if (!(err instanceof RpcError)) return false
    return /query returned more than/i.test(err.message)
}

function asTryAnotherRangeError(err: unknown): FiniteRange | undefined {
    if (!(err instanceof RpcError)) return
    let m = /Try with this block range \[(0x[0-9a-f]+), (0x[0-9a-f]+)]/i.exec(err.message)
    if (m == null) return
    let from = qty2Int(m[1])
    let to = qty2Int(m[2])
    if (from <= to) return {from, to}
}


function toBlock(getBlock: GetBlock): Block
function toBlock(getBlock?: null): undefined
function toBlock(getBlock?: GetBlock | null): Block | undefined
function toBlock(getBlock?: GetBlock | null): Block | undefined {
    if (getBlock == null) return
    return {
        height: qty2Int(getBlock.number),
        hash: getBlock.hash,
        block: getBlock
    }
}


function captureNotFound(info: RpcErrorInfo): null {
    if (info.message.includes('not found')) return null
    throw new RpcError(info)
}
