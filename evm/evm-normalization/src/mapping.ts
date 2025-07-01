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
                        address: assertNotNull(frame.to),
                        refundAddress: frame.from,
                        balance: assertNotNull(frame.value)
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
    src: rpc.TraceTransactionReplay['stateDiff'],
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


function mapTrace(src: rpc.TraceFrame): Trace {
    return {
        transactionIndex: src.transactionPosition,
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


export function mapRpcBlock(src: rpc.Block): Block {
    let header: BlockHeader = {
        number: src.number,
        hash: src.hash,
        parentHash: src.block.parentHash,
        timestamp: qty2Int(src.block.timestamp),
        transactionsRoot: src.block.transactionsRoot,
        receiptsRoot: src.block.receiptsRoot,
        stateRoot: src.block.stateRoot,
        logsBloom: src.block.logsBloom,
        sha3Uncles: src.block.sha3Uncles,
        extraData: src.block.extraData,
        miner: src.block.miner,
        nonce: src.block.nonce ?? undefined,
        mixHash: src.block.mixHash ?? undefined,
        size: qty2Int(src.block.size),
        gasLimit: src.block.gasLimit,
        gasUsed: src.block.gasUsed,
        difficulty: src.block.difficulty ?? undefined,
        totalDifficulty: src.block.totalDifficulty ?? undefined,
        baseFeePerGas: src.block.baseFeePerGas ?? undefined,
        uncles: src.block.uncles ?? undefined,
        withdrawals: src.block.withdrawals ?? undefined,
        withdrawalsRoot: src.block.withdrawalsRoot ?? undefined,
        blobGasUsed: src.block.blobGasUsed ?? undefined,
        excessBlobGas: src.block.excessBlobGas ?? undefined,
        parentBeaconBlockRoot: src.block.parentBeaconBlockRoot ?? undefined,
        requestsHash: src.block.requestsHash ?? undefined,
        l1BlockNumber: src.block.l1BlockNumber ? qty2Int(src.block.l1BlockNumber) : undefined
    }

    let transactions = []
    for (let i = 0; i < src.block.transactions.length; i++) {
        let tx = src.block.transactions[i] as unknown as rpc.Transaction
        assert(typeof tx !== 'string')
        let receipt = src.receipts?.[i]
        if (receipt) {
            assert(tx.hash == receipt.transactionHash)
        }
        transactions.push(mapTransaction(tx, receipt))
    }

    let logs: Log[] = []
    src.receipts?.forEach(receipt => {
        receipt.logs.forEach(log => {
            logs.push(mapLog(log))
        })
    })

    let traces: Trace[] = []
    let stateDiffs: StateDiff[] = []

    if (src.traceReplays) {
        let txIndex = new Map(src.block.transactions.map((tx, idx) => {
            return [getTxHash(tx), idx]
        }))
        for (let rep of src.traceReplays) {
            let transactionHash = assertNotNull(rep.transactionHash)
            let transactionIndex = assertNotNull(txIndex.get(transactionHash))
            if (rep.trace) {
                for (let frame of rep.trace) {
                    traces.push(mapTrace(frame))
                }
            }

            if (rep.stateDiff) {
                for (let diff of mapReplayStateDiff(rep.stateDiff, transactionIndex)) {
                    if (diff.kind != '=') {
                        stateDiffs.push(diff)
                    }
                }
            }
        }
    }

    if (src.debugFrames) {
        assert(traces.length == 0)
        for (let i = 0; i < src.debugFrames.length; i++) {
            for (let trace of mapDebugFrame(i, src.debugFrames[i])) {
                traces.push(trace)
            }
        }
    }

    if (src.debugStateDiffs) {
        assert(stateDiffs.length == 0)
        for (let i = 0; i < src.debugStateDiffs.length; i++) {
            for (let diff of mapDebugStateDiff(i, src.debugStateDiffs[i])) {
                stateDiffs.push(diff)
            }
        }
    }

    return {
        header,
        transactions,
        logs,
        traces,
        stateDiffs
    }
}
