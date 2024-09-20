import {addErrorContext, assertNotNull, unexpectedCase} from '@subsquid/util-internal'
import {cast, GetCastType} from '@subsquid/util-internal-validation'
import {GetPropsCast} from '@subsquid/util-internal-validation/lib/composite/object'
import assert from 'assert'
import {Bytes, Bytes20, Bytes32} from '../interfaces/base'
import {FieldSelection} from '../interfaces/data'
import {
    EvmTraceCallAction,
    EvmTraceCallResult,
    EvmTraceCreateAction,
    EvmTraceCreateResult,
    EvmTraceSuicideAction
} from '../interfaces/evm'
import {
    Block,
    BlockHeader,
    Log,
    StateDiff,
    StateDiffAdd,
    StateDiffChange,
    StateDiffDelete,
    StateDiffNoChange,
    Trace,
    TraceCall,
    TraceCreate,
    TraceReward,
    TraceSuicide,
    Transaction
} from '../mapping/entities'
import {setUpRelations} from '../mapping/relations'
import {getLogProps, getTraceFrameValidator, isEmpty} from '../mapping/schema'
import {filterBlock} from './filter'
import {MappingRequest} from './request'
import {Block as RpcBlock, DebugStateDiffResult, DebugStateMap, TraceDiff, TraceStateDiff} from './rpc-data'
import {DebugFrame, getBlockValidator} from './schema'
import {getTxHash} from './util'


export function mapBlock(rpcBlock: RpcBlock, req: MappingRequest): Block {
    try {
        return tryMapBlock(rpcBlock, req)
    } catch(err: any) {
        throw addErrorContext(err, {
            blockHash: rpcBlock.hash,
            blockHeight: rpcBlock.height
        })
    }
}


function tryMapBlock(rpcBlock: RpcBlock, req: MappingRequest): Block {
    let src = cast(getBlockValidator(req), rpcBlock)

    let {number, hash, parentHash, transactions, ...headerProps} = src.block
    if (headerProps.timestamp) {
        headerProps.timestamp = headerProps.timestamp * 1000 // convert to ms
    }

    let header = new BlockHeader(number, hash, parentHash)
    Object.assign(header, headerProps)

    let block = new Block(header)

    if (req.transactionList) {
        for (let i = 0; i < transactions.length; i++) {
            let stx = transactions[i]
            let tx = new Transaction(header, i)
            if (typeof stx == 'string') {
                if (req.fields.transaction?.hash) {
                    tx.hash = stx
                }
            } else {
                let {transactionIndex, ...props} = stx
                Object.assign(tx, props)
                assert(transactionIndex === i)
                if (tx.input != null) {
                    tx.sighash = tx.input.slice(0, 10)
                }
            }
            block.transactions.push(tx)
        }
    }

    if (req.receipts) {
        let receipts = assertNotNull(src.receipts)
        for (let i = 0; i < receipts.length; i++) {
            let {transactionIndex, transactionHash, logs, ...props} = receipts[i]
            
            let transaction = block.transactions[i]
            assert(transactionHash === transaction.hash)
            Object.assign(transaction, props)

            if (req.logList) {
                for (let log of assertNotNull(logs)) {
                    block.logs.push(makeLog(header, log))
                }
            }
        }
    }

    if (src.logs) {
        assert(block.logs.length == 0)
        for (let log of src.logs) {
            block.logs.push(makeLog(header, log))
        }
    }

    if (src.traceReplays) {
        let txIndex = new Map(src.block.transactions.map((tx, idx) => {
            return [getTxHash(tx), idx]
        }))
        for (let rep of src.traceReplays) {
            let transactionIndex = assertNotNull(txIndex.get(rep.transactionHash))
            if (rep.trace) {
                for (let frame of rep.trace) {
                    block.traces.push(
                        makeTraceRecordFromReplayFrame(header, transactionIndex, frame)
                    )
                }
            }
            if (rep.stateDiff) {
                for (let diff of mapReplayStateDiff(header, transactionIndex, rep.stateDiff)) {
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
            let frame = src.debugFrames[i]
            if (frame == null) continue
            for (let trace of mapDebugFrame(header, i, frame, req.fields)) {
                block.traces.push(trace)
            }
        }
    }

    if (src.debugStateDiffs) {
        assert(block.stateDiffs.length == 0)
        for (let i = 0; i < src.debugStateDiffs.length; i++) {
            for (let diff of mapDebugStateDiff(header, i, src.debugStateDiffs[i])) {
                block.stateDiffs.push(diff)
            }
        }
    }

    setUpRelations(block)
    filterBlock(block, req.dataRequest)

    return block
}


function makeLog(blockHeader: BlockHeader, src: GetPropsCast<ReturnType<typeof getLogProps>>): Log {
    let {logIndex, transactionIndex, ...props} = src
    let log = new Log(blockHeader, logIndex, transactionIndex)
    Object.assign(log, props)
    return log
}


function makeTraceRecordFromReplayFrame(
    header: BlockHeader,
    transactionIndex: number,
    frame: GetCastType<ReturnType<typeof getTraceFrameValidator>>
): Trace {
    let {traceAddress, type, ...props} = frame
    let trace: Trace
    switch(type) {
        case 'create':
            trace = new TraceCreate(header, transactionIndex, traceAddress)
            break
        case 'call':
            trace = new TraceCall(header, transactionIndex, traceAddress)
            break
        case 'suicide':
            trace = new TraceSuicide(header, transactionIndex, traceAddress)
            break
        case 'reward':
            trace = new TraceReward(header, transactionIndex, traceAddress)
            break
        default:
            throw unexpectedCase(type)
    }
    Object.assign(trace, props)
    if (trace.type == 'call' && trace.action?.input != null) {
        trace.action.sighash = trace.action.input.slice(0, 10)
    }
    return trace
}


function* mapReplayStateDiff(
    header: BlockHeader,
    transactionIndex: number,
    stateDiff: Record<Bytes20, TraceStateDiff>
): Iterable<StateDiff> {
    for (let address in stateDiff) {
        let diffs = stateDiff[address]
        yield makeStateDiffFromReplay(header, transactionIndex, address, 'code', diffs.code)
        yield makeStateDiffFromReplay(header, transactionIndex, address, 'balance', diffs.balance)
        yield makeStateDiffFromReplay(header, transactionIndex, address, 'nonce', diffs.nonce)
        for (let key in diffs.storage) {
            yield makeStateDiffFromReplay(header, transactionIndex, address, key, diffs.storage[key])
        }
    }
}


function makeStateDiffFromReplay(
    header: BlockHeader,
    transactionIndex: number,
    address: Bytes20,
    key: string,
    diff: TraceDiff
): StateDiff {
    if (diff === '=') {
        return new StateDiffNoChange(header, transactionIndex, address, key)
    }
    if (diff['+']) {
        let rec = new StateDiffAdd(header, transactionIndex, address, key)
        rec.next = diff['+']
        return rec
    }
    if (diff['*']) {
        let rec = new StateDiffChange(header, transactionIndex, address, key)
        rec.prev = diff['*'].from
        rec.next = diff['*'].to
        return rec
    }
    if (diff['-']) {
        let rec = new StateDiffDelete(header, transactionIndex, address, key)
        rec.prev = diff['-']
        return rec
    }
    throw unexpectedCase()
}


function* mapDebugFrame(
    header: BlockHeader,
    transactionIndex: number,
    debugFrameResult: {result: DebugFrame},
    fields: FieldSelection | undefined
): Iterable<Trace> {
    if (debugFrameResult.result.type == 'STOP') {
        assert(!debugFrameResult.result.calls?.length)
        return
    }
    let projection = fields?.trace || {}
    for (let {traceAddress, subtraces, frame} of traverseDebugFrame(debugFrameResult.result, [])) {
        let trace: Trace
        switch(frame.type) {
            case 'CREATE':
            case 'CREATE2': {
                trace = new TraceCreate(header, transactionIndex, traceAddress)
                let action: Partial<EvmTraceCreateAction> = {}

                action.from = frame.from

                if (projection.createValue) {
                    action.value = frame.value
                }
                if (projection.createGas) {
                    action.gas = frame.gas
                }
                if (projection.createInit) {
                    action.init = frame.input
                }
                if (!isEmpty(action)) {
                    trace.action = action
                }
                let result: Partial<EvmTraceCreateResult> = {}
                if (projection.createResultGasUsed) {
                    result.gasUsed = frame.gasUsed
                }
                if (projection.createResultCode) {
                    result.code = frame.output
                }
                if (projection.createResultAddress) {
                    result.address = frame.to
                }
                if (!isEmpty(result)) {
                    trace.result = result
                }
                break
            }
            case 'CALL':
            case 'CALLCODE':
            case 'DELEGATECALL':
            case 'STATICCALL':
            case 'INVALID': {
                trace = new TraceCall(header, transactionIndex, traceAddress)
                let action: Partial<EvmTraceCallAction> = {}
                let hasAction = false
                if (projection.callCallType) {
                    action.callType = frame.type.toLowerCase()
                }
                if (projection.callFrom) {
                    action.from = frame.from
                }

                action.to = frame.to

                if (projection.callValue) {
                    hasAction = true
                    if (frame.value != null) {
                        action.value = frame.value
                    }
                }
                if (projection.callGas) {
                    action.gas = frame.gas
                }
                if (projection.callInput) {
                    action.input = frame.input
                }

                action.sighash = frame.input.slice(0, 10)

                if (hasAction || !isEmpty(action)) {
                    trace.action = action
                }
                let result: Partial<EvmTraceCallResult> = {}
                if (projection.callResultGasUsed) {
                    result.gasUsed = frame.gasUsed
                }
                if (projection.callResultOutput) {
                    result.output = frame.output
                }
                if (!isEmpty(result)) {
                    trace.result = result
                }
                break
            }
            case 'SELFDESTRUCT': {
                trace = new TraceSuicide(header, transactionIndex, traceAddress)
                let action: Partial<EvmTraceSuicideAction> = {}
                if (projection.suicideAddress) {
                    action.address = frame.from
                }
                if (projection.suicideBalance) {
                    action.balance = frame.value
                }

                action.refundAddress = frame.to

                if (!isEmpty(action)) {
                    trace.action = action
                }
                break
            }
            default:
                throw unexpectedCase(frame.type)
        }
        if (projection.subtraces) {
            trace.subtraces = subtraces
        }
        if (frame.error != null) {
            trace.error = frame.error
        }
        if (frame.revertReason != null) {
            trace.revertReason = frame.revertReason
        }
        yield trace
    }
}


function* traverseDebugFrame(frame: DebugFrame, traceAddress: number[]): Iterable<{
    traceAddress: number[]
    subtraces: number
    frame: DebugFrame
}> {
    let subcalls = frame.calls || []
    yield {traceAddress, subtraces: subcalls.length, frame}
    for (let i = 0; i < subcalls.length; i++) {
        yield* traverseDebugFrame(subcalls[i], [...traceAddress, i])
    }
}


function* mapDebugStateDiff(
    header: BlockHeader,
    transactionIndex: number,
    debugDiffResult: GetCastType<typeof DebugStateDiffResult> | undefined | null
): Iterable<StateDiff> {
    if (debugDiffResult == null) return
    let {pre, post} = debugDiffResult.result
    for (let address in pre) {
        let prev = pre[address]
        let next = post[address] || {}
        yield* mapDebugStateMap(header, transactionIndex, address, prev, next)
    }
    for (let address in post) {
        if (pre[address] == null) {
            yield* mapDebugStateMap(header, transactionIndex, address, {}, post[address])
        }
    }
}


function* mapDebugStateMap(
    header: BlockHeader,
    transactionIndex: number,
    address: Bytes20,
    prev: GetCastType<typeof DebugStateMap>,
    next: GetCastType<typeof DebugStateMap>
): Iterable<StateDiff> {
    if (next.code) {
        yield makeDebugStateDiffRecord(header, transactionIndex, address, 'code', prev.code, next.code)
    }
    if (next.balance) {
        yield makeDebugStateDiffRecord(
            header,
            transactionIndex,
            address,
            'balance',
            '0x'+(prev.balance || 0).toString(16),
            '0x'+next.balance.toString(16)
        )
    }
    if (next.nonce) {
        yield makeDebugStateDiffRecord(
            header,
            transactionIndex,
            address,
            'nonce',
            '0x'+(prev.nonce ?? 0).toString(16),
            '0x'+next.nonce.toString(16)
        )
    }
    for (let key in prev.storage) {
        yield makeDebugStateDiffRecord(header, transactionIndex, address, key, prev.storage[key], next.storage?.[key])
    }
    for (let key in next.storage) {
        if (prev.storage?.[key] == null) {
            yield makeDebugStateDiffRecord(header, transactionIndex, address, key, undefined, next.storage[key])
        }
    }
}


function makeDebugStateDiffRecord(
    header: BlockHeader,
    transactionIndex: number,
    address: Bytes20,
    key: Bytes32,
    prev?: Bytes,
    next?: Bytes
): StateDiff {
    if (prev == null) {
        let diff = new StateDiffAdd(header, transactionIndex, address, key)
        diff.next = assertNotNull(next)
        return diff
    }
    if (next == null) {
        let diff = new StateDiffDelete(header, transactionIndex, address, key)
        diff.prev = assertNotNull(prev)
        return diff
    }
    {
        let diff = new StateDiffChange(header, transactionIndex, address, key)
        diff.prev = prev
        diff.next = next
        return diff
    }
}
