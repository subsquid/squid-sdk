import {RpcClient, RpcError} from '@subsquid/rpc-client'
import {assertNotNull, concurrentMap, def, groupBy, last, splitParallelWork, wait} from '@subsquid/util-internal'
import {
    Batch,
    BatchRequest,
    DataSplit,
    ForkNavigator,
    generateFetchStrides,
    getHeightUpdates,
    HotDatabaseState,
    HotDataSource,
    HotUpdate,
    PollingHeightTracker,
    RequestsTracker
} from '@subsquid/util-internal-processor-tools'
import assert from 'assert'
import {NO_LOGS_BLOOM} from '../ds-archive/mapping'
import {AllFields, BlockData} from '../interfaces/data'
import {DataRequest} from '../interfaces/data-request'
import {Bytes32, Qty} from '../interfaces/evm'
import {getBlockHeight, getBlockName, getTxHash, mapBlock, qty2Int, toRpcDataRequest} from './mapping'
import * as rpc from './rpc'


type Block = BlockData<AllFields>


export interface EvmRpcDataSourceOptions {
    rpc: RpcClient
    finalityConfirmation: number
    pollInterval?: number
    strideSize?: number
    preferTraceApi?: boolean
    useDebugApiForStateDiffs?: boolean
}


export class EvmRpcDataSource implements HotDataSource<Block, DataRequest> {
    private rpc: RpcClient
    private strideSize: number
    private finalityConfirmation: number
    private pollInterval: number
    private useDebugApiForStateDiffs: boolean
    private preferTraceApi: boolean

    constructor(options: EvmRpcDataSourceOptions) {
        this.rpc = options.rpc
        this.finalityConfirmation = options.finalityConfirmation
        this.strideSize = options.strideSize ?? 10
        this.pollInterval = options.pollInterval ?? 1000
        this.useDebugApiForStateDiffs = options.useDebugApiForStateDiffs ?? false
        this.preferTraceApi = options.preferTraceApi ?? false
    }

    async getFinalizedHeight(): Promise<number> {
        let height = await this.getHeight()
        return Math.max(0, height - this.finalityConfirmation)
    }

    private async getHeight(): Promise<number> {
        let height: Qty = await this.rpc.call('eth_blockNumber')
        return qty2Int(height)
    }

    async getBlockHash(height: number): Promise<string> {
        let block: rpc.Block = await this.rpc.call(
            'eth_getBlockByNumber',
            ['0x'+height.toString(16), false]
        )
        return block.hash
    }

    @def
    getGenesisHash(): Promise<string> {
        return this.getBlockHash(0)
    }

    async *getHotBlocks(requests: BatchRequest<DataRequest>[], state: HotDatabaseState): AsyncIterable<HotUpdate<Block>> {
        let requestsTracker = new RequestsTracker(
            requests.map(toRpcBatchRequest)
        )

        let heightTracker = new PollingHeightTracker(
            () => this.getHeight(),
            this.pollInterval
        )

        let nav = new ForkNavigator(
            state,
            ref => {
                let height = assertNotNull(ref.height)
                let withTransactions = !!requestsTracker.getRequestAt(height)?.transactions
                if (ref.hash) {
                    return this.getBlock0(ref.hash, withTransactions)
                } else {
                    return this.getBlock0(height, withTransactions)
                }
            },
            block => ({
                height: qty2Int(block.number),
                hash: block.hash,
                parentHash: block.parentHash
            })
        )

        for await (let top of getHeightUpdates(heightTracker, nav.getHeight() + 1)) {
            let update: HotUpdate<Block>
            let retries = 3
            while (true) {
                try {
                    update = await nav.transact(async () => {
                        let {baseHead, finalizedHead, blocks: blocks0} = await nav.move({
                            best: top,
                            finalized: top - this.finalityConfirmation
                        })
                        let blocks = await requestsTracker.processBlocks(
                            blocks0,
                            getBlockHeight,
                            (blocks0, req) => splitParallelWork(
                                10,
                                blocks0,
                                bks0 => this.processBlocks(bks0, req, finalizedHead.height)
                            )
                        )
                        return {
                            blocks,
                            baseHead,
                            finalizedHead
                        }
                    })
                    break
                } catch(err: any) {
                    if (isConsistencyError(err) && retries) {
                        retries -= 1
                        await wait(200)
                    } else {
                        throw err
                    }
                }
            }
            yield update
            if (!requestsTracker.hasRequestsAfter(update.finalizedHead.height)) return
        }
    }

    getFinalizedBlocks(
        requests: BatchRequest<DataRequest>[],
        stopOnHead?: boolean
    ): AsyncIterable<Batch<Block>> {
        return concurrentMap(
            5,
            generateFetchStrides({
                requests: requests.map(toRpcBatchRequest),
                heightTracker: new PollingHeightTracker(() => this.getFinalizedHeight(), this.pollInterval),
                strideSize: this.strideSize,
                stopOnHead
            }),
            async s => {
                let blocks0 = await this.getStride0(s)
                let blocks = await this.processBlocks(blocks0, s.request)
                return {
                    blocks,
                    isHead: s.range.to === s.chainHeight
                }
            }
        )
    }

    private async getBlock0(ref: number | string, withTransactions: boolean): Promise<rpc.Block> {
        let block: rpc.Block | null
        if (typeof ref == 'string') {
            block = await this.rpc.call('eth_getBlockByHash', [ref, withTransactions])
        } else {
            block = await this.rpc.call('eth_getBlockByNumber', ['0x'+ref.toString(16), withTransactions])
        }
        if (block == null) {
            throw new ConsistencyError(ref)
        } else {
            return block
        }
    }

    private async getStride0(s: DataSplit<rpc.DataRequest>): Promise<rpc.Block[]> {
        let call = []
        for (let i = s.range.from; i <= s.range.to; i++) {
            call.push({
                method: 'eth_getBlockByNumber',
                params: ['0x'+i.toString(16), s.request.transactions]
            })
        }
        let blocks: rpc.Block[] = await this.rpc.batchCall(call, {
            priority: s.range.from
        })
        for (let i = 1; i < blocks.length; i++) {
            assert.strictEqual(
                blocks[i - 1].hash,
                blocks[i].parentHash,
                'perhaps finality confirmation was not large enough'
            )
        }
        return blocks
    }

    private async processBlocks(blocks: rpc.Block[], request?: rpc.DataRequest, finalizedHeight?: number): Promise<Block[]> {
        if (blocks.length == 0) return []
        let req = request ?? toRpcDataRequest()
        await this.fetchRequestedData(blocks, req, finalizedHeight)
        return blocks.map(b => mapBlock(b, !!req.transactionList))
    }

    private async fetchRequestedData(blocks: rpc.Block[], req: rpc.DataRequest, finalizedHeight?: number): Promise<void> {
        let subtasks = []

        if (req.logs && !req.receipts) {
            subtasks.push(this.fetchLogs(blocks))
        }

        if (req.receipts) {
            let byBlockMethod = await this.getBlockReceiptsMethod()
            if (byBlockMethod) {
                subtasks.push(this.fetchReceiptsByBlock(blocks, byBlockMethod))
            } else {
                subtasks.push(this.fetchReceiptsByTx(blocks))
            }
        }

        if (req.traces || req.stateDiffs) {
            let isArbitrumOne = await this.getGenesisHash() === '0x7ee576b35482195fc49205cec9af72ce14f003b9ae69f6ba0faef4514be8b442'
            if (isArbitrumOne) {
                subtasks.push(this.fetchArbitrumOneTraces(blocks, req))
            } else {
                subtasks.push(this.fetchTraces(blocks, req, finalizedHeight ?? Number.MAX_SAFE_INTEGER))
            }
        }

        await Promise.all(subtasks)
    }

    private async fetchLogs(blocks: rpc.Block[]): Promise<void> {
        let logs: rpc.Log[] = await this.rpc.call('eth_getLogs', [{
            fromBlock: blocks[0].number,
            toBlock: last(blocks).number
        }], {
            priority: getBlockHeight(blocks[0])
        })

        let logsByBlock = groupBy(logs, log => log.blockHash)

        for (let block of blocks) {
            let logs = logsByBlock.get(block.hash) || []
            if (logs.length == 0 && block.logsBloom !== NO_LOGS_BLOOM) {
                throw new ConsistencyError(block)
            } else {
                block._logs = logs
            }
        }
    }

    private async fetchReceiptsByBlock(
        blocks: rpc.Block[],
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

        let results: rpc.TransactionReceipt[][] = await this.rpc.batchCall(call, {
            priority: getBlockHeight(blocks[0])
        })

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let receipts = results[i]
            if (block.transactions.length !== receipts.length) throw new ConsistencyError(block)
            for (let receipt of receipts) {
                if (receipt.blockHash !== block.hash) throw new ConsistencyError(block)
            }
            block._receipts = receipts
        }
    }

    @def
    private async getBlockReceiptsMethod(): Promise<'eth_getBlockReceipts' | 'alchemy_getTransactionReceipts' | undefined> {
        let eth = await this.rpc.call('eth_getBlockReceipts', ['latest']).then(
            res => Array.isArray(res),
            () => false
        )
        if (eth) return 'eth_getBlockReceipts'

        let alchemy = await this.rpc.call('alchemy_getTransactionReceipts', [{blockNumber: '0x0'}]).then(
            res => Array.isArray(res),
            () => false
        )
        if (alchemy) return 'alchemy_getTransactionReceipts'

        return undefined
    }

    private async fetchReceiptsByTx(blocks: rpc.Block[]): Promise<void> {
        let call = []
        for (let block of blocks) {
            for (let tx of block.transactions) {
                call.push({
                    method: 'eth_getTransactionReceipt',
                    params: [getTxHash(tx)]
                })
            }
        }

        let receipts: rpc.TransactionReceipt[] = await this.rpc.batchCall(call, {
            priority: getBlockHeight(blocks[0])
        })

        let receiptsByBlock = groupBy(receipts, r => r.blockHash)

        for (let block of blocks) {
            let rs = receiptsByBlock.get(block.hash) || []
            if (rs.length !== block.transactions.length) {
                throw new ConsistencyError(block)
            }
            block._receipts = rs
        }
    }

    private fetchTraces(blocks: rpc.Block[], req: rpc.DataRequest, finalizedHeight: number): Promise<void> {
        let tasks: Promise<void>[] = []
        let replayTracers: rpc.TraceTracers[] = []

        if (req.stateDiffs) {
            if (finalizedHeight < getBlockHeight(last(blocks)) || this.useDebugApiForStateDiffs) {
                tasks.push(this.fetchDebugStateDiffs(blocks))
            } else {
                replayTracers.push('stateDiff')
            }
        }

        if (req.traces) {
            if (this.preferTraceApi) {
                if (finalizedHeight < getBlockHeight(last(blocks)) || replayTracers.length == 0) {
                    tasks.push(this.fetchTraceBlock(blocks))
                } else {
                    replayTracers.push('trace')
                }
            } else {
                tasks.push(this.fetchDebugFrames(blocks))
            }
        }

        if (replayTracers.length) {
            tasks.push(this.fetchReplays(blocks, replayTracers))
        }

        return Promise.all(tasks).then()
    }

    private async fetchReplays(
        blocks: rpc.Block[],
        tracers: rpc.TraceTracers[],
        method: string = 'trace_replayBlockTransactions'
    ): Promise<void> {
        if (tracers.length == 0) return

        let call = blocks.map(block => ({
            method,
            params: [block.number, tracers]
        }))

        let replaysByBlock: rpc.TraceTransactionReplay[][] = await this.rpc.batchCall(call, {
            priority: getBlockHeight(blocks[0])
        })

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
                    throw new ConsistencyError(block)
                }
            }

            block._traceReplays = replays
        }
    }

    private async fetchTraceBlock(blocks: rpc.Block[]): Promise<void> {
        let call = blocks.map(block => ({
            method: 'trace_block',
            params: [block.number]
        }))

        let results: rpc.TraceFrame[][] = await this.rpc.batchCall(call, {
            priority: getBlockHeight(blocks[0])
        })

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let frames = results[i]
            if (frames.length == 0) {
                if (block.transactions.length > 0) throw new ConsistencyError(block)
            } else {
                for (let frame of frames) {
                    if (frame.blockHash !== block.hash) throw new ConsistencyError(block)
                }
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

    private async fetchDebugFrames(blocks: rpc.Block[]): Promise<void> {
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

        let results: any[][] = await this.rpc.batchCall(call, {
            priority: getBlockHeight(blocks[0])
        })

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

    private async fetchDebugStateDiffs(blocks: rpc.Block[]): Promise<void> {
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

        let results: rpc.DebugStateDiffResult[][] = await this.rpc.batchCall(call, {
            priority: getBlockHeight(blocks[0])
        })

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            let diffs = results[i]
            assert(block.transactions.length === diffs.length)
            block._debugStateDiffs = diffs
        }
    }

    private async fetchArbitrumOneTraces(blocks: rpc.Block[], req: rpc.DataRequest): Promise<void> {
        if (req.stateDiffs) {
            throw new Error('State diffs are not supported on Arbitrum One')
        }
        if (!req.traces) return

        let arbBlocks = blocks.filter(b => getBlockHeight(b) <= 22207815)
        let debugBlocks = blocks.filter(b => getBlockHeight(b) >= 22207818)

        if (arbBlocks.length) {
            await this.fetchReplays(arbBlocks, ['trace'], 'arbtrace_replayBlockTransactions')
        }

        if (debugBlocks.length) {
            await this.fetchDebugFrames(debugBlocks)
        }
    }
}


class ConsistencyError extends Error {
    constructor(block: rpc.Block | number | string) {
        let name = typeof block == 'object' ? getBlockName(block) : block
        super(`Seems like the chain node navigated to another branch while we were fetching block ${name}`)
    }
}


function toRpcBatchRequest(request: BatchRequest<DataRequest>): BatchRequest<rpc.DataRequest> {
    return {
        range: request.range,
        request: toRpcDataRequest(request.request)
    }
}


function isConsistencyError(err: unknown): boolean {
    if (err instanceof ConsistencyError) return true
    if (err instanceof RpcError) {
        // eth_gelBlockByNumber on Moonbeam reacts like that when block is not present
        if (/Expect block number from id/i.test(err.message)) return true
    }
    return false
}
