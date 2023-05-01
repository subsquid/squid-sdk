import {addErrorContext, unexpectedCase} from '@subsquid/util-internal'
import {BatchRequest, BatchResponse, HashAndHeight, HotDataSource} from '@subsquid/util-internal-processor-tools'
import {RpcClient} from '@subsquid/util-internal-resilient-rpc'
import assert from 'assert'
import {AllFields, BlockData, Log, StateDiff, Trace, Transaction} from '../interfaces/data'
import {DataRequest} from '../interfaces/data-request'
import {Bytes20, EvmBlock, EvmStateDiff, EvmTrace, EvmTraceCall, EvmTraceCreate, Qty} from '../interfaces/evm'
import * as rpc from './rpc'


export interface EvmRpcDataSourceOptions {
    rpc: RpcClient
    finalityConfirmation?: number
}


export class EvmRpcDataSource implements HotDataSource<DataRequest> {
    private rpc: RpcClient
    private batchSize: number
    private finalityConfirmation: number
    private lastFinalizedHeight = 0
    private lastFinalizedHead?: HashAndHeight
    private lastBlock?: rpc.Block

    constructor(options: EvmRpcDataSourceOptions) {
        this.rpc = options.rpc
        this.batchSize = 1
        this.finalityConfirmation = options.finalityConfirmation ?? 10
    }

    async getFinalizedHeight(): Promise<number> {
        let height = await this.getHeight()
        return this.lastFinalizedHeight = Math.max(0, height - this.finalityConfirmation)
    }

    private async getHeight(): Promise<number> {
        let qty: Qty = await this.rpc.call('eth_blockNumber')
        let height = parseInt(qty)
        assert(Number.isSafeInteger(height))
        return height
    }

    async getFinalizedHead(): Promise<HashAndHeight> {
        let height = await this.getFinalizedHeight()
        if (this.lastFinalizedHead?.height === height) return this.lastFinalizedHead
        let block: rpc.Block = await this.rpc.call('eth_getBlockByNumber', ['0x'+height.toString(16), false])
        return this.lastFinalizedHead = {
            hash: block.hash,
            height: qty2Int(block.number)
        }
    }

    async getBestHead(): Promise<HashAndHeight> {
        this.lastBlock = await this.rpc.call('eth_getBlockByNumber', ['latest', true])
        return {
            height: qty2Int(this.lastBlock.number),
            hash: this.lastBlock.hash
        }
    }

    async getFinalizedBatch(request: BatchRequest<DataRequest>): Promise<BatchResponse> {
        let firstBlock = request.range.from
        let lastBlock = Math.min(request.range.to ?? Infinity, firstBlock + this.batchSize)

        assert(firstBlock <= lastBlock)

        let height = this.lastFinalizedHeight
        if (height < lastBlock) {
            height = await this.getFinalizedHeight()
        }

        assert(firstBlock <= height, 'requested blocks from non-finalized range')
        lastBlock = Math.min(height, lastBlock)

        let needsTransactions = transactionsRequested(request.request)

        let blockPromises: Promise<rpc.Block>[] = []
        for (let i = firstBlock; i <= lastBlock; i++) {
            blockPromises.push(
                this.rpc.call(i, 'eth_getBlockByNumber', ['0x'+i.toString(16), needsTransactions])
            )
        }

        let batchBlocks: BlockData<AllFields>[] = await Promise.all(
            blockPromises.map(p => p.then(
                block => this.mapBlock(block, request.request).catch(err => {
                    throw addBlockContext(err, block)
                })
            ))
        )

        assertBlockChain(batchBlocks)

        return {
            range: {from: firstBlock, to: lastBlock},
            blocks: batchBlocks,
            chainHeight: height
        }
    }

    async getBlock(blockHash: string, request?: DataRequest): Promise<BlockData<AllFields>> {
        let block: rpc.Block
        if (this.lastBlock?.hash === blockHash) {
            block = this.lastBlock
        } else {
            block = await this.rpc.call('eth_getBlockByHash', [blockHash, transactionsRequested(request)])
        }
        return this.mapBlock(block, request).catch(err => {
            throw addBlockContext(err, block)
        })
    }

    private async mapBlock(block: rpc.Block, request?: DataRequest): Promise<BlockData<AllFields>> {
        let receipts: rpc.TransactionReceipt[] | undefined
        let logs: rpc.Log[] | undefined
        let replay: rpc.TransactionReplay[] | undefined

        if (receiptsRequested(request)) {
            receipts = await Promise.all(
                block.transactions.map(tx => {
                    assert(typeof tx == 'object')
                    return this.rpc.call('eth_getTransactionReceipt', [tx.hash])
                })
            )
        } else if (logsRequested(request)) {
            logs = await this.rpc.call<rpc.Log[]>('eth_getLogs', [block.number, block.number])
            for (let log of logs) {
                assert.strictEqual(log.blockHash, block.hash)
            }
        }

        let replayTypes = []
        if (tracesRequested(request)) {
            replayTypes.push('trace')
        }
        if (stateDiffsRequested(request)) {
            replayTypes.push('stateDiff')
        }
        if (replayTypes.length) {
            replay = await this.rpc.call<rpc.TransactionReplay[]>(
                'trace_replayBlockTransactions',
                [block.number, replayTypes]
            )
            assert(replay.length === block.transactions.length)
            for (let i = 0; i < block.transactions.length; i++) {
                let tx = block.transactions[i]
                assert(typeof tx == 'object')
                assert(tx.hash === replay[i].transactionHash)
            }
        }

        let header = mapBlockHeader(block)

        let data: BlockData<AllFields> = {
            header,
            transactions: [],
            logs: [],
            traces: [],
            stateDiffs: []
        }

        let txIndex = new Map<Transaction['transactionIndex'], Transaction<AllFields>>()

        for (let i = 0; i < block.transactions.length; i++) {
            let rpcTx = block.transactions[i]
            if (typeof rpcTx == 'string') {
                break
            }

            let receipt = receipts?.[i]
            if (receipt) {
                assert(receipt.transactionHash === rpcTx.hash)
            }

            let tx: Transaction<AllFields> = {
                transactionIndex: qty2Int(rpcTx.transactionIndex),
                hash: rpcTx.hash,
                from: rpcTx.from,
                to: rpcTx.to || undefined,
                input: rpcTx.input,
                nonce: qty2Int(rpcTx.nonce),
                v: rpcTx.v == null ? undefined : BigInt(rpcTx.v),
                r: rpcTx.r,
                s: rpcTx.s,
                value: BigInt(rpcTx.value),
                gas: BigInt(rpcTx.gas),
                gasPrice: BigInt(rpcTx.gasPrice),
                chainId: rpcTx.chainId == null ? undefined : qty2Int(rpcTx.chainId),
                sighash: rpcTx.input.slice(0, 10),
                block: header
            }

            if (receipt) {
                tx.gasUsed = BigInt(receipt.gasUsed)
                tx.cumulativeGasUsed = BigInt(receipt.cumulativeGasUsed)
                tx.effectiveGasPrice = BigInt(receipt.effectiveGasPrice)
                tx.contractAddress = receipt.contractAddress || undefined
                tx.type = qty2Int(receipt.type)
                tx.status = qty2Int(receipt.status)
            }

            txIndex.set(tx.transactionIndex, tx)
            data.transactions.push(tx)
        }

        for (let rpcLog of iterateLogs(receipts, logs)) {
            let log: Log<AllFields> = {
                logIndex: qty2Int(rpcLog.logIndex),
                transactionIndex: qty2Int(rpcLog.transactionIndex),
                transactionHash: rpcLog.transactionHash,
                address: rpcLog.address,
                topics: rpcLog.topics,
                data: rpcLog.data,
                block: header
            }

            let transaction = txIndex.get(log.transactionIndex)
            if (transaction) {
                log.transaction = transaction
            }

            data.logs.push(log)
        }

        if (replay) {
            assert.strictEqual(replay.length, block.transactions.length)
            for (let i = 0; i < replay.length; i++) {
                let rep: rpc.TransactionReplay = replay[i]
                let tx = block.transactions[i]
                assert.strictEqual(
                    rep.transactionHash,
                    typeof tx == 'string' ? tx : tx.hash
                )
                let transactionIndex = i
                let transaction = txIndex.get(transactionIndex)

                for (let rpcTrace of rep.trace || []) {
                    let trace: Trace<AllFields> = {
                        ...mapTrace(transactionIndex, rpcTrace),
                        block: header
                    }
                    if (transaction) {
                        trace.transaction = transaction
                    }
                    data.traces.push(trace)
                }

                for (let diff of iterateStateDiffs(transactionIndex, rep.stateDiff)) {
                    let diffRec: StateDiff<AllFields> = {
                        ...diff,
                        block: header
                    }
                    if (transaction) {
                        diffRec.transaction = transaction
                    }
                    data.stateDiffs.push(diffRec)
                }
            }
        }

        return data
    }

    async getBlockHash(height: number): Promise<string> {
        let block: rpc.Block = await this.rpc.call('eth_getBlockByNumber', ['0x'+height.toString(16), false])
        return block.hash
    }
}


function mapBlockHeader(block: rpc.Block): EvmBlock {
    return {
        height: qty2Int(block.number),
        hash: block.hash,
        parentHash: block.parentHash,
        timestamp: qty2Int(block.timestamp) * 1000,
        stateRoot: block.stateRoot,
        transactionsRoot: block.transactionsRoot,
        receiptsRoot: block.receiptsRoot,
        logsBloom: block.logsBloom,
        extraData: block.extraData,
        sha3Uncles: block.sha3Uncles,
        miner: block.miner,
        nonce: block.nonce,
        size: BigInt(block.size),
        gasLimit: BigInt(block.gasLimit),
        gasUsed: BigInt(block.gasUsed),
        difficulty: block.difficulty == null ? undefined : BigInt(block.difficulty)
    }
}


function mapTrace(transactionIndex: number, src: rpc.Trace): EvmTrace {
    switch(src.type) {
        case 'create': {
            let rec: EvmTraceCreate = {
                transactionIndex,
                traceAddress: src.traceAddress,
                subtraces: src.subtraces,
                error: src.error,
                type: src.type,
                action: {
                    from: src.action.from,
                    value: BigInt(src.action.value),
                    gas: BigInt(src.action.gas),
                    init: src.action.init
                }
            }
            if (src.result) {
                rec.result = {
                    address: src.result.address,
                    code: src.result.code,
                    gasUsed: BigInt(src.result.gasUsed)
                }
            }
            return rec
        }
        case 'call': {
            let rec: EvmTraceCall = {
                transactionIndex,
                traceAddress: src.traceAddress,
                subtraces: src.subtraces,
                error: src.error,
                type: src.type,
                action: {
                    from: src.action.from,
                    to: src.action.to,
                    value: BigInt(src.action.value),
                    gas: BigInt(src.action.gas),
                    input: src.action.input,
                    sighash: src.action.input.slice(0, 10)
                }
            }
            if (src.result) {
                rec.result = {
                    gasUsed: BigInt(src.result.gasUsed),
                    output: src.result.output
                }
            }
            return rec
        }
        case 'suicide': {
            return {
                transactionIndex,
                traceAddress: src.traceAddress,
                subtraces: src.subtraces,
                error: src.error,
                type: src.type,
                action: {
                    address: src.action.address,
                    refundAddress: src.action.refundAddress,
                    balance: BigInt(src.action.balance)
                }
            }
        }
        case 'reward': {
            return {
                transactionIndex,
                traceAddress: src.traceAddress,
                subtraces: src.subtraces,
                error: src.error,
                type: src.type,
                action: {
                    author: src.action.author,
                    value: BigInt(src.action.value),
                    type: src.action.type
                }
            }
        }
        default:
            throw unexpectedCase((src as any).type)
    }
}


function* iterateStateDiffs(
    transactionIndex: number,
    stateDiff?: Record<Bytes20, rpc.StateDiff>
): Iterable<EvmStateDiff> {
    if (stateDiff == null) return
    for (let address in stateDiff) {
        let diffs = stateDiff[address]
        yield mapStateDiff(transactionIndex, address, 'code', diffs.code)
        yield mapStateDiff(transactionIndex, address, 'balance', diffs.balance)
        yield mapStateDiff(transactionIndex, address, 'nonce', diffs.nonce)
        for (let key in diffs.storage) {
            yield mapStateDiff(transactionIndex, address, key, diffs.storage[key])
        }
    }
}


function mapStateDiff(transactionIndex: number, address: Bytes20, key: string, diff: rpc.Diff): EvmStateDiff {
    if (diff === '=') {
        return {
            transactionIndex,
            address,
            key,
            kind: '='
        }
    }
    if (diff['+']) {
        return {
            transactionIndex,
            address,
            key,
            kind: '+',
            next: diff['+']
        }
    }
    if (diff['*']) {
        return {
            transactionIndex,
            address,
            key,
            kind: '*',
            prev: diff['*'].from,
            next: diff['*'].to
        }
    }
    if (diff['-']) {
        return {
            transactionIndex,
            address,
            key,
            kind: '-',
            prev: diff['-']
        }
    }
    throw unexpectedCase()
}


function assertBlockChain(blocks: BlockData[]): void {
    if (blocks.length == 0) return
    for (let i = 1; i < blocks.length; i++) {
        assert.strictEqual(blocks[i-1].header.hash, blocks[i].header.parentHash)
        assert.strictEqual(blocks[i-1].header.height + 1, blocks[i].header.height)
    }
}


function addBlockContext(err: Error, block: rpc.Block): Error {
    let ctx: any = {
        blockHash: block.hash
    }
    try {
        ctx.blockHeight = qty2Int(block.number)
    } catch(e: any) {
        ctx.blockNumber = block.number
    }
    return addErrorContext(err, ctx)
}


function qty2Int(qty: Qty): number {
    let i = parseInt(qty, 16)
    assert(Number.isSafeInteger(i))
    return i
}


function* iterateLogs(receipts?: rpc.TransactionReceipt[], logs?: rpc.Log[]): Iterable<rpc.Log> {
    if (receipts) {
        for (let receipt of receipts) {
            yield* receipt.logs
        }
    } else if (logs) {
        yield* logs
    }
}


function logsRequested(req?: DataRequest): boolean {
    return !!req?.logs?.length
}


function transactionsRequested(req?: DataRequest): boolean {
    if (req == null) return false
    if (req.transactions?.length) return true
    for (let items of [req.logs, req.traces, req.stateDiffs]) {
        if (items) {
            for (let it of items) {
                if (it.transaction) return true
            }
        }
    }
    return false
}


function receiptsRequested(req?: DataRequest): boolean {
    if (!transactionsRequested(req)) return false
    let fields = req?.fields?.transaction
    if (fields == null) return false
    return !!(
        fields.status ||
        fields.type ||
        fields.gasUsed ||
        fields.cumulativeGasUsed ||
        fields.effectiveGasPrice ||
        fields.contractAddress
    )
}


function tracesRequested(req?: DataRequest): boolean {
    if (req == null) return false
    if (req.traces?.length) return true
    for (let tx of req.transactions || []) {
        if (tx.traces) return true
    }
    return false
}


function stateDiffsRequested(req?: DataRequest): boolean {
    if (req == null) return false
    if (req.stateDiffs?.length) return true
    for (let tx of req.transactions || []) {
        if (tx.stateDiffs) return true
    }
    return false
}
