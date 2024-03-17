import {assertNotNull, unexpectedCase} from '@subsquid/util-internal'
import assert from 'assert'
import * as rpc from '../schema'
import {Block, BlockHeader, Transaction, Log, Trace, StateDiff, TraceSuicide, TraceCreate, TraceCall, TraceReward} from './data'
import {Bytes20} from '../base'


export function mapRpcBlock(src: rpc.Block): Block {
    let header = mapBlockHeader(src.block)
    let transactions: Transaction[] = []
    let logs: Log[] = []
    let traces: Trace[] = []
    let stateDiffs: StateDiff[] = []

    let txByHash: Record<string, rpc.Transaction> = {}
    for (let i = 0; i < src.block.transactions.length; i++) {
        let tx = src.block.transactions[i]
        if (typeof tx == 'string') continue

        txByHash[tx.hash] = tx

        let receipt = src.receipts?.[i]
        if (receipt) {
            assert(receipt.transactionIndex == tx.transactionIndex)
        }

        let transaction = mapTransaction(tx, receipt)
        transactions.push(transaction)

        for (let log of receipt?.logs || []) {
            logs.push(mapLog(log))
        }
    }

    if (src.logs) {
        assert(logs.length == 0)
        for (let log of src.logs) {
            logs.push(mapLog(log))
        }
    }

    for (let replay of src.traceReplays || []) {
        let transactionHash = assertNotNull(replay.transactionHash)
        let transactionIndex = parseInt(txByHash[transactionHash].transactionIndex)

        for (let trace of replay.trace || []) {
            let transactionHash = assertNotNull(replay.transactionHash || trace.transactionHash)
            let transactionIndex = parseInt(txByHash[transactionHash].transactionIndex)
            traces.push(mapReplayTrace(trace, transactionIndex))
        }

        if (replay.stateDiff) {
            for (let diff of mapReplayStateDiff(replay.stateDiff, transactionIndex)) {
                if (diff.kind != '=') {
                    stateDiffs.push(diff)
                }
            }
        }
    }

    // for (let frame of src.debugFrames || []) {
    //     traces.push(mapDebugFrame(frame))
    // }

    // for (let result of src.debugStateDiffs || []) {
    //     stateDiffs.push(mapDebugStateDiff(result))
    // }

    return {
        header,
        transactions,
        logs,
        traces,
        stateDiffs
    }
}


function* mapReplayStateDiff(
    src: Record<Bytes20, rpc.TraceStateDiff>,
    transactionIndex: number,
): Iterable<StateDiff> {
    for (let address in src) {
        let diffs = src[address]
        yield makeStateDiffFromReplay(transactionIndex, address, 'code', diffs.code)
        yield makeStateDiffFromReplay(transactionIndex, address, 'balance', diffs.balance)
        yield makeStateDiffFromReplay(transactionIndex, address, 'nonce', diffs.nonce)
        for (let key in diffs.storage) {
            yield makeStateDiffFromReplay(transactionIndex, address, key, diffs.storage[key])
        }
    }
}


function makeStateDiffFromReplay(
    transactionIndex: number,
    address: Bytes20,
    key: string,
    diff: rpc.TraceDiff
): StateDiff {
    let base = {
        address,
        key,
        transactionIndex
    }
    if (diff === '=') {
        return {
            ...base,
            kind: '='
        }
    }
    if (diff['+']) {
        return {
            ...base,
            kind: '+',
            next: diff['+']
        }
    }
    if (diff['*']) {
        return {
            ...base,
            kind: '*',
            prev: diff['*'].from,
            next: diff['*'].to,
        }
    }
    if (diff['-']) {
        return {
            ...base,
            kind: '-',
            prev: diff['-']
        }
    }
    throw unexpectedCase()
}


function mapReplayTrace(src: rpc.TraceFrame, transactionIndex: number): Trace {
    let base = {
        transactionIndex,
        traceAddress: src.traceAddress,
        subtraces: src.subtraces,
        error: src.error ?? null,
    }

    switch (src.type) {
        case 'create': {
            let trace: TraceCreate = {
                ...base,
                type: src.type,
                action: {
                    from: src.action.from,
                    value: BigInt(src.action.value),
                    gas: BigInt(src.action.gas),
                    init: src.action.init
                }
            }
            if (src.result) {
                trace.result = {
                    gasUsed: BigInt(src.result.gasUsed),
                    code: src.result.code,
                    address: src.result.address,
                }
            }
            return trace
        }
        case 'call': {
            let trace: TraceCall = {
                ...base,
                type: src.type,
                action: {
                    from: src.action.from,
                    to: src.action.to,
                    value: BigInt(src.action.value),
                    gas: BigInt(src.action.gas),
                    input: src.action.input,
                    sighash: src.action.input.slice(0, 10),
                    callType: src.action.callType
                }
            }
            if (src.result) {
                trace.result = {
                    gasUsed: BigInt(src.result?.gasUsed),
                    output: src.result.output
                }
            }
            return trace
        }
        case 'reward': {
            let trace: TraceReward = {
                ...base,
                type: src.type,
                action: {
                    author: src.action.author,
                    value: BigInt(src.action.value),
                    type: src.action.rewardType
                },
            }
            return trace 
        }
        case 'suicide': {
            let trace: TraceSuicide = {
                ...base,
                type: src.type,
                action: {
                    address: src.action.address,
                    refundAddress: src.action.refundAddress,
                    balance: BigInt(src.action.balance)
                }
            }
            return trace
        }
        default:
            throw unexpectedCase()
    }
}


function mapBlockHeader(src: rpc.GetBlock) {
    let header: BlockHeader = {
        hash: src.hash,
        height: parseInt(src.number),
        parentHash: src.parentHash,
        logsBloom: src.logsBloom ?? undefined,
        extraData: src.extraData ?? undefined,
        miner: src.miner ?? undefined,
        receiptsRoot: src.receiptsRoot ?? undefined,
        sha3Uncles: src.sha3Uncles ?? undefined,
        stateRoot: src.stateRoot ?? undefined,
        transactionsRoot: src.transactionsRoot ?? undefined,
        mixHash: src.mixHash ?? undefined,
        nonce: src.nonce ?? undefined,
    }

    if (src.gasLimit) {
        header.gasLimit = BigInt(src.gasLimit)
    }
    if (src.gasUsed) {
        header.gasUsed = BigInt(src.gasUsed)
    }
    if (src.size) {
        header.size = BigInt(src.size)
    }
    if (src.timestamp) {
        header.timestamp = parseInt(src.timestamp)
    }
    if (src.baseFeePerGas) {
        header.baseFeePerGas = BigInt(src.baseFeePerGas)
    }
    if (src.difficulty) {
        header.difficulty = BigInt(src.difficulty)
    }
    if (src.totalDifficulty) {
        header.totalDifficulty = BigInt(src.totalDifficulty)
    }
    if (src.l1BlockNumber) {
        header.l1BlockNumber = parseInt(src.l1BlockNumber)
    }

    return header
}


function mapTransaction(src: rpc.Transaction, receipt?: rpc.TransactionReceipt): Transaction {
    let tx: Transaction = {
        transactionIndex: parseInt(src.transactionIndex),
        sighash: src.input.slice(0, 10),
        hash: src.hash,
        from: src.from,
        input: src.input,
        to: src.to ?? undefined,
        r: src.r ?? undefined,
        s: src.s ?? undefined,
        contractAddress: receipt?.contractAddress ?? undefined
    }

    if (src.maxFeePerGas) {
        tx.maxFeePerGas = BigInt(src.maxFeePerGas)
    }
    if (src.maxPriorityFeePerGas) {
        tx.maxPriorityFeePerGas = BigInt(src.maxPriorityFeePerGas)
    }
    if (src.gas) {
        tx.gas = BigInt(src.gas)
    }
    if (src.gasPrice) {
        tx.gasPrice = BigInt(src.gasPrice)
    }
    if (src.nonce) {
        tx.nonce = parseInt(src.nonce)
    }
    if (src.value) {
        tx.value = BigInt(src.value)
    }
    if (src.v) {
        tx.v = BigInt(src.v)
    }
    if (src.yParity) {
        tx.yParity = parseInt(src.yParity)
    }
    if (src.chainId) {
        tx.chainId = parseInt(src.chainId)
    }

    if (receipt?.gasUsed) {
        tx.gasUsed = BigInt(receipt.gasUsed)
    }
    if (receipt?.cumulativeGasUsed) {
        tx.cumulativeGasUsed = BigInt(receipt.cumulativeGasUsed)
    }
    if (receipt?.effectiveGasPrice) {
        tx.effectiveGasPrice = BigInt(receipt.effectiveGasPrice)
    }
    if (receipt?.type) {
        tx.type = parseInt(receipt.type)
    }
    if (receipt?.status) {
        tx.status = parseInt(receipt.status)
    }

    return tx
}


function mapLog(src: rpc.Log): Log {
    return {
        logIndex: parseInt(src.logIndex),
        transactionIndex: parseInt(src.transactionIndex),
        transactionHash: src.transactionHash,
        address: src.address,
        data: src.data,
        topics: src.topics,
    }
}
