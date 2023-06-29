import {addErrorContext, assertNotNull, unexpectedCase} from '@subsquid/util-internal'
import {HashAndHeight} from '@subsquid/util-internal-processor-tools'
import assert from 'assert'
import {AllFields, BlockData, BlockHeader, FieldSelection, Transaction} from '../interfaces/data'
import {DataRequest} from '../interfaces/data-request'
import {
    Bytes,
    Bytes20,
    Bytes32,
    EvmStateDiff,
    EvmTrace,
    EvmTraceBase,
    EvmTraceCall,
    EvmTraceCreate,
    Qty
} from '../interfaces/evm'
import {formatId} from '../util'
import * as rpc from './rpc'


export function mapBlock(block: rpc.Block, transactionsRequested: boolean): BlockData<AllFields> {
    try {
        return tryMapBlock(block, transactionsRequested)
    } catch(err: any) {
        throw addErrorContext(err, {
            blockHeight: getBlockHeight(block),
            blockHash: block.hash
        })
    }
}


function tryMapBlock(src: rpc.Block, transactionsRequested: boolean): BlockData<AllFields> {
    let block: BlockData<AllFields> = {
        header: mapBlockHeader(src),
        transactions: [],
        logs: [],
        traces: [],
        stateDiffs: []
    }

    if (transactionsRequested) {
        for (let i = 0; i < src.transactions.length; i++) {
            let stx = src.transactions[i]
            let tx: Transaction<AllFields>
            let id = formatId(block.header.height, block.header.hash, i)
            if (typeof stx == 'string') {
                tx = {
                    id,
                    transactionIndex: i,
                    hash: stx,
                    block: block.header
                } as Transaction<AllFields>
            } else {
                tx = {
                    id,
                    transactionIndex: i,
                    hash: stx.hash,
                    from: stx.from,
                    to: stx.to || undefined,
                    input: stx.input,
                    nonce: qty2Int(stx.nonce),
                    v: stx.v == null ? undefined : BigInt(stx.v),
                    r: stx.r,
                    s: stx.s,
                    value: BigInt(stx.value),
                    gas: BigInt(stx.gas),
                    gasPrice: BigInt(stx.gasPrice),
                    chainId: stx.chainId == null ? undefined : qty2Int(stx.chainId),
                    sighash: stx.input.slice(0, 10),
                    block: block.header
                }
            }

            if (src._receipts) {
                let receipt = src._receipts[i]
                assert(receipt.transactionHash === tx.hash)
                tx.gasUsed = BigInt(receipt.gasUsed)
                tx.cumulativeGasUsed = BigInt(receipt.cumulativeGasUsed)
                tx.effectiveGasPrice = BigInt(receipt.effectiveGasPrice)
                tx.contractAddress = receipt.contractAddress || undefined
                tx.type = qty2Int(receipt.type)
                tx.status = qty2Int(receipt.status)
            }

            block.transactions.push(tx)
        }
    }

    for (let log of iterateLogs(src)) {
        let logIndex = qty2Int(log.logIndex)
        let transactionIndex = qty2Int(log.transactionIndex)
        block.logs.push({
            id: formatId(block.header.height, block.header.hash, logIndex),
            logIndex,
            transactionIndex,
            transactionHash: log.transactionHash,
            address: log.address,
            topics: log.topics,
            data: log.data,
            block: block.header,
            transaction: block.transactions[transactionIndex]
        })
    }

    if (src._traceReplays) {
        let hash2idx = new Map(src.transactions.map((tx, idx) => [getTxHash(tx), idx]))
        for (let rep of src._traceReplays) {
            let transactionIndex = assertNotNull(hash2idx.get(rep.transactionHash))
            if (rep.trace) {
                for (let frame of rep.trace) {
                    block.traces.push({
                        ...mapTraceFrame(transactionIndex, frame),
                        block: block.header,
                        transaction: block.transactions[transactionIndex]
                    })
                }
            }
            if (rep.stateDiff) {
                for (let diff of iterateTraceStateDiffs(transactionIndex, rep.stateDiff)) {
                    block.stateDiffs.push({
                        ...diff,
                        block: block.header,
                        transaction: block.transactions[transactionIndex]
                    })
                }
            }
        }
    }

    if (src._debugFrames) {
        assert(block.traces.length == 0)
        assert(src._debugFrames.length === src.transactions.length)
        for (let i = 0; i < src._debugFrames.length; i++) {
            for (let frame of mapDebugFrame(i, src._debugFrames[i])) {
                block.traces.push({
                    ...frame,
                    block: block.header,
                    transaction: block.transactions[i]
                })
            }
        }
    }

    if (src._debugStateDiffs) {
        assert(block.stateDiffs.length == 0)
        assert(src._debugStateDiffs.length === src.transactions.length)
        for (let i = 0; i < src._debugStateDiffs.length; i++) {
            for (let diff of mapDebugStateDiff(i, src._debugStateDiffs[i])) {
                block.stateDiffs.push({
                    ...diff,
                    block: block.header,
                    transaction: block.transactions[i]
                })
            }
        }
    }

    return block
}


function mapBlockHeader(block: rpc.Block): BlockHeader<AllFields> {
    let height = qty2Int(block.number)
    return {
        id: formatId(height, block.hash),
        height,
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


function* iterateLogs(block: rpc.Block): Iterable<rpc.Log> {
    if (block._receipts) {
        for (let receipt of block._receipts) {
            yield* receipt.logs
        }
    } else if (block._logs) {
        yield* block._logs
    }
}


function mapTraceFrame(transactionIndex: number, src: rpc.TraceFrame): EvmTrace {
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
                    callType: src.action.callType,
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


function* iterateTraceStateDiffs(
    transactionIndex: number,
    stateDiff?: Record<Bytes20, rpc.TraceStateDiff>
): Iterable<EvmStateDiff> {
    if (stateDiff == null) return
    for (let address in stateDiff) {
        let diffs = stateDiff[address]
        yield mapTraceStateDiff(transactionIndex, address, 'code', diffs.code)
        yield mapTraceStateDiff(transactionIndex, address, 'balance', diffs.balance)
        yield mapTraceStateDiff(transactionIndex, address, 'nonce', diffs.nonce)
        for (let key in diffs.storage) {
            yield mapTraceStateDiff(transactionIndex, address, key, diffs.storage[key])
        }
    }
}


function mapTraceStateDiff(transactionIndex: number, address: Bytes20, key: string, diff: rpc.TraceDiff): EvmStateDiff {
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


function* mapDebugFrame(transactionIndex: number, debugFrameResult: rpc.DebugFrameResult): Iterable<EvmTrace> {
    for (let rec of traverseDebugFrame(debugFrameResult.result, [])) {
        let base: EvmTraceBase = {
            transactionIndex,
            traceAddress: rec.traceAddress,
            subtraces: rec.subtraces,
            error: rec.frame.error ?? null,
            revertReason: rec.frame.revertReason
        }
        switch(rec.frame.type) {
            case 'CREATE':
            case 'CREATE2':
                yield {
                    ...base,
                    type: 'create',
                    action: {
                        from: rec.frame.from,
                        value: BigInt(assertNotNull(rec.frame.value)),
                        gas: BigInt(rec.frame.gas),
                        init: rec.frame.input
                    },
                    result: {
                        gasUsed: BigInt(rec.frame.gasUsed),
                        code: rec.frame.output,
                        address: rec.frame.to
                    }
                }
                break
            case 'CALL':
            case 'STATICCALL':
            case 'DELEGATECALL':
            case 'INVALID':
                yield {
                    ...base,
                    type: 'call',
                    action: {
                        callType: rec.frame.type.toLowerCase(),
                        from: rec.frame.from,
                        to: rec.frame.to,
                        value: rec.frame.value == null ? undefined : BigInt(rec.frame.value),
                        gas: BigInt(rec.frame.gas),
                        input: rec.frame.input,
                        sighash: rec.frame.input.slice(0, 10)
                    },
                    result: {
                        gasUsed: BigInt(rec.frame.gasUsed),
                        output: rec.frame.output
                    }
                }
                break
            case 'SELFDESTRUCT':
                yield {
                    ...base,
                    type: 'suicide',
                    action: {
                        address: rec.frame.from,
                        refundAddress: rec.frame.to,
                        balance: BigInt(assertNotNull(rec.frame.value))
                    }
                }
                break
            default:
                throw unexpectedCase(rec.frame.type)
        }
    }
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


function* mapDebugStateDiff(transactionIndex: number, debugDiffResult: rpc.DebugStateDiffResult): Iterable<EvmStateDiff> {
    let {pre, post} = debugDiffResult.result
    for (let address in pre) {
        let prev = pre[address]
        let next = post[address] || {}
        yield* mapDebugDiff(transactionIndex, address, prev, next)
    }
    for (let address in post) {
        if (pre[address] == null) {
            yield* mapDebugDiff(transactionIndex, address, {}, post[address])
        }
    }
}


function* mapDebugDiff(
    transactionIndex: number,
    address: Bytes20,
    prev: rpc.DebugStateMap,
    next: rpc.DebugStateMap
): Iterable<EvmStateDiff> {
    if (next.code) {
        yield makeDiffRecord(transactionIndex, address, 'code', prev.code, next.code)
    }
    if (next.balance) {
        yield makeDiffRecord(transactionIndex, address, 'balance', prev.balance, next.balance)
    }
    if (next.nonce) {
        yield makeDiffRecord(
            transactionIndex,
            address,
            'nonce',
            '0x'+prev.nonce?.toString(16),
            '0x'+next.nonce?.toString(16)
        )
    }
    for (let key in prev.storage) {
        yield makeDiffRecord(transactionIndex, address, key, prev.storage[key], next.storage?.[key])
    }
    for (let key in next.storage) {
        if (prev.storage?.[key] == null) {
            yield makeDiffRecord(transactionIndex, address, key, undefined, next.storage[key])
        }
    }
}


function makeDiffRecord(transactionIndex: number, key: Bytes32, address: Bytes20, prev?: Bytes, next?: Bytes20): EvmStateDiff {
    if (prev == null) {
        return {
            transactionIndex,
            address,
            key,
            kind: '+',
            next: assertNotNull(next)
        }
    }
    if (next == null) {
        return {
            transactionIndex,
            address,
            key,
            kind: '-',
            prev
        }
    }
    return {
        transactionIndex,
        address,
        key,
        kind: '*',
        prev,
        next
    }
}

export function qty2Int(qty: Qty): number {
    let i = parseInt(qty, 16)
    assert(Number.isSafeInteger(i))
    return i
}


export function toQty(i: number): Qty {
    return '0x'+i.toString(16)
}


export function toRpcDataRequest(req?: DataRequest): rpc.DataRequest {
    return {
        transactionList: transactionsRequested(req),
        transactions: transactionsRequested(req) && transactionRequired(req),
        logs: !!req?.logs?.length,
        receipts: receiptsRequested(req),
        traces: tracesRequested(req),
        stateDiffs: stateDiffsRequested(req)
    }
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


function transactionRequired(req?: DataRequest): boolean {
    let f: keyof Exclude<FieldSelection['transaction'], undefined>
    for (f in req?.fields?.transaction) {
        switch(f) {
            case 'hash':
            case 'status':
            case 'type':
            case 'gasUsed':
            case 'cumulativeGasUsed':
            case 'effectiveGasPrice':
            case 'contractAddress':
                break
            default:
                return true
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


export function getTxHash(tx: Bytes32 | rpc.Transaction): Bytes32 {
    if (typeof tx == 'string') {
        return tx
    } else {
        return tx.hash
    }
}


export function getBlockName(block: rpc.Block | {height: number, hash?: string, number?: undefined}): string {
    let height: number
    let hash: string | undefined
    if (block.number == null) {
        height = block.height
        hash = block.hash
    } else {
        height = qty2Int(block.number)
        hash = block.hash
    }
    if (hash) {
        return `${height}#${hash.slice(2, 8)}`
    } else {
        return ''+height
    }
}


export function getBlockHeight(block: rpc.Block): number {
    return qty2Int(block.number)
}
