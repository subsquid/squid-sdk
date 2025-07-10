import * as rpc from '@subsquid/evm-rpc'
import {qty2Int, toQty, getTxHash, isEmpty, Bytes, Bytes20, Bytes32} from '@subsquid/evm-rpc'
import {assertNotNull, unexpectedCase} from '@subsquid/util-internal'
import assert from 'assert'
import {
    Block,
    BlockHeader,
    Transaction,
    Access,
    EIP7702Authorization,
    Log,
    Trace,
    TraceCreateAction,
    TraceCallAction,
    TraceRewardAction,
    TraceSelfdestructAction,
    StateDiff,
    TraceCreateResult,
    TraceCallResult
} from './data'
import {RawBlock} from './raw'


function getSigHash(input: string): string | undefined {
    if (input.length < 10) return undefined
    return input.substring(0, 10)
}


function* traverseDebugFrame(frame: rpc.DebugFrame, traceAddress: number[]): Iterable<{
    traceAddress: number[]
    subtraces: number
    frame: rpc.DebugFrame
}> {
    let subcalls = frame.calls || []
    yield {traceAddress, subtraces: subcalls.length, frame}
    for (let i = 0; i < subcalls.length; i++) {
        yield* traverseDebugFrame(subcalls[i], [...traceAddress, i])
    }
}


function* mapDebugFrame(
    transactionIndex: number,
    debugFrameResult: {result: rpc.DebugFrame}
): Iterable<Trace> {
    if (debugFrameResult.result.type == 'STOP') {
        assert(!debugFrameResult.result.calls?.length)
        return
    }

    for (let {traceAddress, subtraces, frame} of traverseDebugFrame(debugFrameResult.result, [])) {
        let base = {
            transactionIndex,
            traceAddress,
            subtraces,
            error: frame.error ?? undefined,
            revertReason: frame.revertReason ?? undefined,
        }
        let trace: Trace

        switch(frame.type) {
            case 'CREATE':
            case 'CREATE2': {
                trace = {
                    ...base,
                    type: 'create',
                    action: {
                        from: frame.from,
                        value: assertNotNull(frame.value),
                        gas: frame.gas,
                        init: frame.input,
                    },
                }

                let result: Partial<TraceCreateResult> = {}
                if (frame.gasUsed) {
                    result.gasUsed = frame.gasUsed
                }
                if (frame.output) {
                    result.code = frame.output
                }
                if (frame.to) {
                    result.address = frame.to
                }
                if (!isEmpty(result)) {
                    assertNotNull(result.gasUsed)
                    trace.result = result as TraceCreateResult
                }
                break
            }
            case 'CALL':
            case 'CALLCODE':
            case 'DELEGATECALL':
            case 'STATICCALL':
            case 'INVALID': {
                trace = {
                    ...base,
                    type: 'call',
                    action: {
                        callType: frame.type.toLowerCase(),
                        from: frame.from,
                        to: assertNotNull(frame.to),
                        value: frame.value ?? undefined,
                        gas: frame.gas,
                        input: frame.input,
                        sighash: getSigHash(frame.input)
                    }
                }

                let result: Partial<TraceCallResult> = {}
                if (frame.gasUsed) {
                    result.gasUsed = frame.gasUsed
                }
                if (frame.output) {
                    result.output = frame.output
                }
                if (!isEmpty(result)) {
                    trace.result = result
                }
                break
            }
            case 'SELFDESTRUCT': {
                trace = {
                    ...base,
                    type: 'selfdestruct',
                    action: {
                        address: frame.to ?? undefined,
                        refundAddress: frame.from,
                        balance: frame.value ?? undefined
                    }
                }
                break
            }
            default:
                throw unexpectedCase(frame.type)
        }
    }
}


function* mapDebugStateDiff(
    transactionIndex: number,
    debugDiffResult: rpc.DebugStateDiffResult
): Iterable<StateDiff> {
    let {pre, post} = debugDiffResult.result
    for (let address in pre) {
        let prev = pre[address]
        let next = post[address] || {}
        yield* mapDebugStateMap(transactionIndex, address, prev, next)
    }
    for (let address in post) {
        if (pre[address] == null) {
            yield* mapDebugStateMap(transactionIndex, address, {}, post[address])
        }
    }
}


function* mapDebugStateMap(
    transactionIndex: number,
    address: Bytes20,
    prev: rpc.DebugStateMap,
    next: rpc.DebugStateMap
): Iterable<StateDiff> {
    if (next.code) {
        yield makeDebugStateDiffRecord(transactionIndex, address, 'code', prev.code, next.code)
    }
    if (next.balance) {
        yield makeDebugStateDiffRecord(
            transactionIndex,
            address,
            'balance',
            prev.balance,
            next.balance
        )
    }
    if (next.nonce) {
        yield makeDebugStateDiffRecord(
            transactionIndex,
            address,
            'nonce',
            toQty(prev.nonce ?? 0),
            toQty(next.nonce)
        )
    }
    for (let key in prev.storage) {
        yield makeDebugStateDiffRecord(transactionIndex, address, key, prev.storage[key], next.storage?.[key])
    }
    for (let key in next.storage) {
        if (prev.storage?.[key] == null) {
            yield makeDebugStateDiffRecord(transactionIndex, address, key, undefined, next.storage[key])
        }
    }
}


function makeDebugStateDiffRecord(
    transactionIndex: number,
    address: Bytes20,
    key: Bytes32,
    prev?: Bytes | null,
    next?: Bytes
): StateDiff {
    let base = {
        transactionIndex,
        address,
        key
    }

    if (prev == null) {
        return {
            ...base,
            kind: '+',
            next: assertNotNull(next)
        }
    }
    if (next == null) {
        return {
            ...base,
            kind: '-',
            prev: assertNotNull(prev)
        }
    }
    return {
        ...base,
        kind: '*',
        prev: assertNotNull(prev),
        next: assertNotNull(next)
    }
}


function makeStateDiffFromReplay(
    transactionIndex: number,
    address: rpc.Bytes20,
    key: string,
    diff: rpc.TraceDiff
): StateDiff {
    let base = {
        transactionIndex,
        address,
        key
    }

    if (diff === '=') {
        return {
            ...base,
            kind: '='
        }
    }
    if ('+' in diff) {
        return {
            ...base,
            kind: '+',
            next: diff['+']
        }
    }
    if ('*' in diff) {
        return {
            ...base,
            kind: '*',
            prev: diff['*'].from,
            next: diff['*'].to
        }
    }
    if ('-' in diff) {
        return {
            ...base,
            kind: '-',
            prev: diff['-']
        }
    }
    throw unexpectedCase()
}


function* mapReplayStateDiff(
    src: Record<Bytes20, rpc.TraceStateDiff>,
    transactionIndex: number
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


function mapAction(action: rpc.TraceActionCreate | rpc.TraceActionCall | rpc.TraceActionReward | rpc.TraceActionSelfdestruct): TraceCreateAction | TraceCallAction | TraceRewardAction | TraceSelfdestructAction {
    if ('init' in action) {
        return {
            from: action.from,
            value: action.value,
            gas: action.gas,
            init: action.init,
            creationMethod: action.creation_method ?? undefined
        }
    }
    if ('callType' in action) {
        return {
            from: action.from,
            to: action.to,
            value: action.value,
            gas: action.gas,
            input: action.input,
            callType: action.callType,
            sighash: getSigHash(action.input)
        }
    }
    if ('rewardType' in action) {
        return {
            author: action.author,
            value: action.value,
            rewardType: action.rewardType
        }
    }
    return {
        address: action.address,
        refundAddress: action.refundAddress,
        balance: action.balance
    }
}


function mapResult(result: rpc.TraceResultCall | rpc.TraceResultCreate | undefined | null): TraceCallResult | TraceCreateResult | undefined {
    if (result === undefined || result === null) {
        return undefined
    }
    if ('output' in result) {
        return {
            gasUsed: result.gasUsed,
            output: result.output
        }
    }
    return {
        gasUsed: result.gasUsed,
        code: result.code,
        address: result.address
    }
}


function extractRevertReason(result: rpc.TraceResultCall | rpc.TraceResultCreate | undefined | null): string | undefined {
    if (result === undefined || result === null) {
        return undefined
    }
    if ('code' in result) {
        return undefined
    }
    let output = result.output
    let offset = 136
    if (!output.startsWith('0x')) {
        offset -= 2
    }
    let buff = Buffer.from(output.substring(offset), 'hex')
    let len = buff[0]
    return buff.subarray(1, len + 1).toString()
}


function mapTrace(src: rpc.TraceFrame, transactionIndex: number): Trace {
    return {
        transactionIndex,
        traceAddress: src.traceAddress,
        type: src.type == 'suicide' ? 'selfdestruct' : src.type,
        subtraces: src.subtraces,
        error: src.error ?? undefined,
        revertReason: src.error ? extractRevertReason(src.result) : undefined,
        action: mapAction(src.action),
        result: mapResult(src.result)
    }
}


function mapLog(src: rpc.Log): Log {
    assert(!src.removed)
    return {
        logIndex: qty2Int(src.logIndex),
        transactionIndex: qty2Int(src.transactionIndex),
        transactionHash: src.transactionHash,
        address: src.address,
        data: src.data,
        topics: src.topics
    }
}


function mapAccess(src: rpc.Access): Access {
    return {
        address: src.address,
        storageKeys: src.storageKeys
    }
}


function mapEIP7702Authorization(src: rpc.EIP7702Authorization): EIP7702Authorization {
    return {
        chainId: qty2Int(src.chainId),
        address: src.address,
        nonce: qty2Int(src.nonce),
        yParity: qty2Int(src.yParity),
        r: src.r,
        s: src.s
    }
}


function mapTransaction(src: rpc.Transaction, receipt?: rpc.Receipt): Transaction {
    return {
        transactionIndex: qty2Int(src.transactionIndex),
        hash: src.hash,
        nonce: qty2Int(src.nonce),
        from: src.from,
        to: src.to ?? undefined,
        input: src.input,
        sighash: getSigHash(src.input),
        value: src.value,
        type: qty2Int(src.type),
        gas: src.gas,
        gasPrice: src.gasPrice ?? undefined,
        maxFeePerGas: src.maxFeePerGas ?? undefined,
        maxPriorityFeePerGas: src.maxPriorityFeePerGas ?? undefined,
        v: src.v ?? undefined,
        r: src.r ?? undefined,
        s: src.s ?? undefined,
        yParity: src.yParity ? qty2Int(src.yParity) : undefined,
        accessList: src.accessList?.map(mapAccess),
        chainId: src.chainId ? qty2Int(src.chainId) : undefined,
        maxFeePerBlobGas: src.maxFeePerBlobGas ?? undefined,
        blobVersionedHashes: src.blobVersionedHashes ?? undefined,
        authorizationList: src.authorizationList?.map(mapEIP7702Authorization),
        contractAddress: receipt?.contractAddress ?? undefined,
        cumulativeGasUsed: receipt?.cumulativeGasUsed,
        effectiveGasPrice: receipt?.effectiveGasPrice,
        gasUsed: receipt?.gasUsed,
        status: receipt?.status ? qty2Int(receipt.status) : undefined,
        l1BaseFeeScalar: receipt?.l1BaseFeeScalar ? qty2Int(receipt.l1BaseFeeScalar) : undefined,
        l1BlobBaseFee: receipt?.l1BlobBaseFee ?? undefined,
        l1BlobBaseFeeScalar: receipt?.l1BlobBaseFeeScalar ? qty2Int(receipt.l1BlobBaseFeeScalar) : undefined,
        l1Fee: receipt?.l1Fee ?? undefined,
        l1FeeScalar: receipt?.l1FeeScalar ? parseInt(receipt.l1FeeScalar) : undefined,
        l1GasPrice: receipt?.l1GasPrice ?? undefined,
        l1GasUsed: receipt?.l1GasUsed ?? undefined,
    }
}


function mapBlockHeader(src: rpc.GetBlock): BlockHeader {
    return {
        number: qty2Int(src.number),
        hash: src.hash,
        parentHash: src.parentHash,
        timestamp: qty2Int(src.timestamp),
        transactionsRoot: src.transactionsRoot,
        receiptsRoot: src.receiptsRoot,
        stateRoot: src.stateRoot,
        logsBloom: src.logsBloom,
        sha3Uncles: src.sha3Uncles,
        extraData: src.extraData,
        miner: src.miner,
        nonce: src.nonce ?? undefined,
        mixHash: src.mixHash ?? undefined,
        size: qty2Int(src.size),
        gasLimit: src.gasLimit,
        gasUsed: src.gasUsed,
        difficulty: src.difficulty ?? undefined,
        totalDifficulty: src.totalDifficulty ?? undefined,
        baseFeePerGas: src.baseFeePerGas ?? undefined,
        uncles: src.uncles ?? undefined,
        withdrawals: src.withdrawals ?? undefined,
        withdrawalsRoot: src.withdrawalsRoot ?? undefined,
        blobGasUsed: src.blobGasUsed ?? undefined,
        excessBlobGas: src.excessBlobGas ?? undefined,
        parentBeaconBlockRoot: src.parentBeaconBlockRoot ?? undefined,
        requestsHash: src.requestsHash ?? undefined,
        l1BlockNumber: src.l1BlockNumber ? qty2Int(src.l1BlockNumber) : undefined
    }
}


export function mapRpcBlock(src: rpc.Block): Block {
    let block: Block = {
        header: mapBlockHeader(src.block),
        transactions: [],
        logs: [],
        traces: [],
        stateDiffs: []
    }

    for (let i = 0; i < src.block.transactions.length; i++) {
        let tx = src.block.transactions[i] as rpc.Transaction
        assert(typeof tx !== 'string')
        let receipt = src.receipts?.[i]
        if (receipt) {
            assert(tx.hash == receipt.transactionHash)
        }
        block.transactions.push(mapTransaction(tx, receipt))
    }

    if (src.logs) {
        for (let i = 0; i < src.logs.length; i++) {
            let log = src.logs[i]
            block.logs.push(mapLog(log))
        }
    }

    if (src.receipts) {
        assert(block.logs.length == 0)
        for (let i = 0; i < src.receipts.length; i++) {
            let receipt = src.receipts[i]
            for (let j = 0; j < receipt.logs.length; j++) {
                let log = receipt.logs[j]
                block.logs.push(mapLog(log))
            }
        }
    }

    if (src.traceReplays) {
        let txIndex = new Map(src.block.transactions.map((tx, idx) => {
            return [getTxHash(tx), idx]
        }))
        for (let rep of src.traceReplays) {
            let transactionHash = assertNotNull(rep.transactionHash)
            let transactionIndex = assertNotNull(txIndex.get(transactionHash))
            if (rep.trace) {
                for (let frame of rep.trace) {
                    block.traces.push(mapTrace(frame, transactionIndex))
                }
            }

            if (rep.stateDiff) {
                for (let diff of mapReplayStateDiff(rep.stateDiff, transactionIndex)) {
                    if (diff.kind != '=') {
                        block.stateDiffs.push(diff)
                    }
                }
            }
        }
    }

    if (src.debugFrames) {
        assert(block.traces.length == 0)
        for (let i = 0; i < src.debugFrames.length; i++) {
            for (let trace of mapDebugFrame(i, src.debugFrames[i])) {
                block.traces.push(trace)
            }
        }
    }

    if (src.debugStateDiffs) {
        assert(block.stateDiffs.length == 0)
        for (let i = 0; i < src.debugStateDiffs.length; i++) {
            for (let diff of mapDebugStateDiff(i, src.debugStateDiffs[i])) {
                block.stateDiffs.push(diff)
            }
        }
    }

    return block
}


export function mapRawBlock(raw: RawBlock): Block {
    let block: Block = {
        header: mapBlockHeader(raw),
        transactions: [],
        logs: [],
        traces: [],
        stateDiffs: []
    }

    for (let tx of raw.transactions) {
        let transactionIndex = qty2Int(tx.transactionIndex)
        block.transactions.push(mapTransaction(tx, tx.receipt_))

        if (tx.receipt_) {
            for (let log of tx.receipt_.logs) {
                block.logs.push(mapLog(log))
            }
        }

        if (tx.traceReplay_) {
            if (tx.traceReplay_.trace) {
                for (let frame of tx.traceReplay_.trace) {
                    block.traces.push(mapTrace(frame, transactionIndex))
                }
            }

            if (tx.traceReplay_.stateDiff) {
                for (let diff of mapReplayStateDiff(tx.traceReplay_.stateDiff, transactionIndex)) {
                    if (diff.kind != '=') {
                        block.stateDiffs.push(diff)
                    }
                }
            }
        }

        if (tx.debugFrame_) {
            assert(!tx.traceReplay_?.trace)
            for (let frame of mapDebugFrame(transactionIndex, tx.debugFrame_)) {
                block.traces.push(frame)
            }
        }

        if (tx.debugStateDiff_) {
            assert(!tx.traceReplay_?.stateDiff)
            for (let diff of mapDebugStateDiff(transactionIndex, tx.debugStateDiff_)) {
                block.stateDiffs.push(diff)
            }
        }
    }

    if (raw.logs_) {
        assert(block.logs.length == 0)
        for (let log of raw.logs_) {
            block.logs.push(mapLog(log))
        }
    }

    return block
}
