import {CallOptions, RpcClient, RpcError} from '@subsquid/rpc-client'
import {groupBy, last} from '@subsquid/util-internal'
import {assertIsValid, BlockConsistencyError, trimInvalid} from '@subsquid/util-internal-ingest-tools'
import {FiniteRange, SplitRequest} from '@subsquid/util-internal-range'
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


export class Rpc {
    private props: RpcProps

    constructor(
        public readonly client: RpcClient,
        private genesisHeight: number = 0,
        private priority: number = 0,
        props?: RpcProps
    ) {
        this.props = props || new RpcProps(this.client, this.genesisHeight)
    }

    withPriority(priority: number): Rpc {
        return new Rpc(this.client, this.genesisHeight, priority, this.props)
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
        if (block._isInvalid) throw new BlockConsistencyError(block)
        return block
    }

    async getColdSplit(req: SplitRequest<DataRequest>): Promise<Block[]> {
        let result = await this.getBlockSplit(req)

        for (let i = 0; i < result.length; i++) {
            if (result[i] == null) throw new BlockConsistencyError({height: req.range.from + i})
            if (i > 0 && result[i - 1]!.hash !== result[i]!.block.parentHash)
                throw new BlockConsistencyError(result[i]!)
        }

        let blocks = result as Block[]

        await this.addRequestedData(blocks, req.request)

        assertIsValid(blocks)

        return blocks
    }

    async getHotSplit(req: SplitRequest<DataRequest> & {finalizedHeight: number}): Promise<Block[]> {
        let blocks = await this.getBlockSplit(req)

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

    private async getBlockSplit(req: SplitRequest<DataRequest>): Promise<(Block | undefined)[]> {
        let call = []
        for (let i = req.range.from; i <= req.range.to; i++) {
            call.push({
                method: 'eth_getBlockByNumber',
                params: [toQty(i), req.request.transactions || false]
            })
        }
        let blocks = await this.batchCall(call, {
            validateResult: getResultValidator(
                req.request.transactions ? nullable(GetBlockWithTransactions) : nullable(GetBlockNoTransactions)
            )
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
            if (logs.length == 0 && block.block.logsBloom !== NO_LOGS_BLOOM) {
                block._isInvalid = true
            } else {
                block.logs = logs
            }
        }
    }

    getLogs(from: number, to: number): Promise<Log[]> {
        return this.call('eth_getLogs', [{
            fromBlock: toQty(from),
            toBlock: toQty(to)
        }], {
            validateResult: getResultValidator(array(Log))
        }).catch(async err => {
            let range = asTryAnotherRangeError(err)
            if (range && range.from == from && from <= range.to && range.to < to) {
                let result = await Promise.all([
                    this.getLogs(range.from, range.to),
                    this.getLogs(range.to + 1, to)
                ])
                return result[0].concat(result[1])
            } else {
                throw err
            }
        })
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
            if (receipts != null && block.block.transactions.length === receipts.length) {
                for (let receipt of receipts) {
                    if (receipt.blockHash !== block.hash) {
                        block._isInvalid = true
                    }
                }
                block.receipts = receipts
            } else {
                block._isInvalid = true
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
            if (rs.length === block.block.transactions.length) {
                block.receipts = rs
            } else {
                block._isInvalid = true
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
                if (block.block.transactions.length > 0) {
                    block._isInvalid = true
                }
            } else {
                for (let frame of frames) {
                    if (frame.blockHash !== block.hash) {
                        block._isInvalid = true
                        break
                    }
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

    private async addDebugFrames(blocks: Block[]): Promise<void> {
        let traceConfig = {
            tracer: 'callTracer',
            tracerConfig: {
                onlyTopCall: false,
                withLog: false // will study log <-> frame matching problem later
            }
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
            }
        })

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let frames = results[i]
            assert(block.block.transactions.length === frames.length)
            block.debugFrames = frames
        }
    }

    private async addDebugStateDiffs(blocks: Block[]): Promise<void> {
        let traceConfig = {
            tracer: 'prestateTracer',
            tracerConfig: {
                onlyTopCall: false, // passing this option is incorrect, but required by Alchemy endpoints
                diffMode: true
            }
        }

        let call = blocks.map(block => ({
            method: 'debug_traceBlockByHash',
            params: [block.hash, traceConfig]
        }))

        let results = await this.batchCall(call, {
            validateResult: getResultValidator(array(DebugStateDiffResult))
        })

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let diffs = results[i]
            assert(block.block.transactions.length === diffs.length)
            block.debugStateDiffs = diffs
        }
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
            await this.addDebugFrames(debugBlocks)
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
                tasks.push(this.addDebugStateDiffs(blocks))
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
                tasks.push(this.addDebugFrames(blocks))
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
