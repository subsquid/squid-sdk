import {CallOptions, RetryError, RpcClient, RpcError, SubscriptionHandle} from '@subsquid/rpc-client'
import {RpcRequest} from '@subsquid/rpc-client/lib/interfaces'
import {groupBy, last} from '@subsquid/util-internal'
import {assertIsValid, BlockConsistencyError, trimInvalid} from '@subsquid/util-internal-ingest-tools'
import {FiniteRange, SplitRequest} from '@subsquid/util-internal-range'
import assert from 'assert'
import {NO_LOGS_BLOOM} from '../ds-archive/mapping'
import {Bytes, Bytes32, Qty} from '../interfaces/base'
import {
    Block,
    DataRequest,
    DebugStateDiffResult,
    Log,
    NewHeadNotification,
    TraceFrame,
    TraceTracers,
    TraceTransactionReplay,
    TransactionReceipt
} from './rpc-data'
import {getBlockHeight, getTxHash, qty2Int, toQty} from './util'


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

    getBlockByNumber(height: number, withTransactions: boolean): Promise<Block | null> {
        return this.call('eth_getBlockByNumber', [
            toQty(height),
            withTransactions
        ])
    }

    getBlockByHash(hash: Bytes, withTransactions: boolean): Promise<Block | null> {
        return this.call('eth_getBlockByHash', [hash, withTransactions])
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
        let block = await this.getBlockByHash(blockHash, req?.transactions || false)
        if (block == null) throw new BlockConsistencyError({hash: blockHash})
        if (req) {
            await this.addRequestedData([block], req, finalizedHeight)
        }
        if (block._isInvalid) throw new BlockConsistencyError(block)
        return block
    }

    async getColdSplit(req: SplitRequest<DataRequest>): Promise<Block[]> {
        let call = this.makeGetBlockBatchCall(req)

        let result: (Block | null)[] = await this.batchCall(call)
        for (let i = 0; i < result.length; i++) {
            if (result[i] == null) throw new BlockConsistencyError({height: req.range.from + i})
            if (i > 0 && result[i]!.parentHash !== result[i-1]!.hash) throw new BlockConsistencyError(result[i]!)
        }

        let blocks = result as Block[]

        await this.addRequestedData(blocks, req.request)

        assertIsValid(blocks)

        return blocks
    }

    async getHotSplit(req: SplitRequest<DataRequest> & {finalizedHeight: number}): Promise<Block[]> {
        let call = this.makeGetBlockBatchCall(req)

        let blocks: (Block | null)[] = await this.batchCall(call)
        let chain: Block[] = []

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            if (block == null) break
            if (i > 0 && chain[i - 1].hash !== block.parentHash) break
            chain.push(block)
        }

        await this.addRequestedData(chain, req.request, req.finalizedHeight)

        return trimInvalid(chain)
    }

    private makeGetBlockBatchCall(req: SplitRequest<DataRequest>) {
        let call = []
        for (let i = req.range.from; i <= req.range.to; i++) {
            call.push({
                method: 'eth_getBlockByNumber',
                params: [toQty(i), req.request.transactions || false]
            })
        }
        return call
    }

    private async addRequestedData(blocks: Block[], req: DataRequest, finalizedHeight?: number): Promise<void> {
        if (blocks.length == 0) return

        let subtasks = []

        if (req.logs && !req.receipts) {
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
        let logs = await this.getLogs(
            getBlockHeight(blocks[0]),
            getBlockHeight(last(blocks))
        )

        let logsByBlock = groupBy(logs, log => log.blockHash)

        for (let block of blocks) {
            let logs = logsByBlock.get(block.hash) || []
            if (logs.length == 0 && block.logsBloom !== NO_LOGS_BLOOM) {
                block._isInvalid = true
            } else {
                block._logs = logs
            }
        }
    }

    getLogs(from: number, to: number): Promise<Log[]> {
        return this.call('eth_getLogs', [{
            fromBlock: toQty(from),
            toBlock: toQty(to)
        }]).catch(async err => {
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
                    params: [block.number]
                }
            } else {
                return {
                    method,
                    params: [{blockHash: block.hash}]
                }
            }
        })

        let results: TransactionReceipt[][] = await this.batchCall(call, {
            validateResult: nonNull
        })

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let receipts = results[i]
            if (block.transactions.length === receipts.length) {
                for (let receipt of receipts) {
                    if (receipt.blockHash !== block.hash) {
                        block._isInvalid = true
                    }
                }
                block._receipts = receipts
            } else {
                block._isInvalid = true
            }
        }
    }

    private async addReceiptsByTx(blocks: Block[]): Promise<void> {
        let call = []
        for (let block of blocks) {
            for (let tx of block.transactions) {
                call.push({
                    method: 'eth_getTransactionReceipt',
                    params: [getTxHash(tx)]
                })
            }
        }

        let receipts: (TransactionReceipt | null)[] = await this.batchCall(call)

        let receiptsByBlock = groupBy(
            receipts.filter(r => r != null) as TransactionReceipt[],
            r => r.blockHash
        )

        for (let block of blocks) {
            let rs = receiptsByBlock.get(block.hash) || []
            if (rs.length === block.transactions.length) {
                block._receipts = rs
            } else {
                block._isInvalid = true
            }
        }
    }

    private async addTraceTxReplays(
        blocks: Block[],
        tracers: TraceTracers[],
        method: string = 'trace_replayBlockTransactions'
    ): Promise<void> {
        if (tracers.length == 0) return

        let call = blocks.map(block => ({
            method,
            params: [block.number, tracers]
        }))

        let replaysByBlock: TraceTransactionReplay[][] = await this.batchCall(call)

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let replays = replaysByBlock[i]
            let txs = new Set(block.transactions.map(getTxHash))

            for (let rep of replays) {
                if (!rep.transactionHash) { // FIXME: Who behaves like that? Arbitrum?
                    let txHash: Bytes32 | undefined = undefined
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

            block._traceReplays = replays
        }
    }

    private async addTraceBlockTraces(blocks: Block[]): Promise<void> {
        let call = blocks.map(block => ({
            method: 'trace_block',
            params: [block.number]
        }))

        let results: TraceFrame[][] = await this.batchCall(call)

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let frames = results[i]
            if (frames.length == 0) {
                if (block.transactions.length > 0) {
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
                    block._traceReplays = []
                    let byTx = groupBy(frames, f => f.transactionHash)
                    for (let [transactionHash, txFrames] of byTx.entries()) {
                        if (transactionHash) {
                            block._traceReplays.push({
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

        let results: any[][] = await this.batchCall(call)

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let frames = results[i]

            assert(block.transactions.length === frames.length)

            // Moonbeam quirk
            for (let j = 0; j < frames.length; j++) {
                if (!frames[j].result) {
                    frames[j] = {result: frames[j]}
                }
            }

            block._debugFrames = frames
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

        let results: DebugStateDiffResult[][] = await this.batchCall(call)

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let diffs = results[i]
            assert(block.transactions.length === diffs.length)
            block._debugStateDiffs = diffs
        }
    }

    private async addArbitrumOneTraces(blocks: Block[], req: DataRequest): Promise<void> {
        if (req.stateDiffs) {
            throw new Error('State diffs are not supported on Arbitrum One')
        }
        if (!req.traces) return

        let arbBlocks = blocks.filter(b => getBlockHeight(b) <= 22207815)
        let debugBlocks = blocks.filter(b => getBlockHeight(b) >= 22207818)

        if (arbBlocks.length) {
            await this.addTraceTxReplays(arbBlocks, ['trace'], 'arbtrace_replayBlockTransactions')
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
        let replayTracers: TraceTracers[] = []

        if (req.stateDiffs) {
            if (finalizedHeight < getBlockHeight(last(blocks)) || req.useDebugApiForStateDiffs) {
                tasks.push(this.addDebugStateDiffs(blocks))
            } else {
                replayTracers.push('stateDiff')
            }
        }

        if (req.traces) {
            if (req.preferTraceApi) {
                if (finalizedHeight < getBlockHeight(last(blocks)) || replayTracers.length == 0) {
                    tasks.push(this.addTraceBlockTraces(blocks))
                } else {
                    replayTracers.push('trace')
                }
            } else {
                tasks.push(this.addDebugFrames(blocks))
            }
        }

        if (replayTracers.length) {
            tasks.push(this.addTraceTxReplays(blocks, replayTracers))
        }

        await Promise.all(tasks)
    }

    subscribeNewHeads(sub: NewHeadsSubscription): SubscriptionHandle {
        return this.client.subscribe({
            method: 'eth_subscribe',
            params: ['newHeads'],
            notification: 'eth_subscription',
            unsubscribe: 'eth_unsubscribe',
            onMessage: sub.onNewHead,
            onError: sub.onError,
            resubscribeOnConnectionLoss: true
        })
    }
}


export interface NewHeadsSubscription {
    onNewHead: (head: NewHeadNotification) => void
    onError: (err: Error) => void
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

        let alchemy = await this.client.call('alchemy_getTransactionReceipts', [{blockNumber: '0x0'}]).then(
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


class UnexpectedResponse extends RetryError {
    get name(): string {
        return 'UnexpectedResponse'
    }
}


function nonNull(result: any, req: RpcRequest): any {
    if (result == null) throw new UnexpectedResponse(
        `Result of call ${JSON.stringify(req)} was null. Perhaps, you should find a better endpoint.`
    )
    return result
}
