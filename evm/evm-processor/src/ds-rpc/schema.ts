import {weakMemo} from '@subsquid/util-internal'
import {Bytes, Bytes20} from '../interfaces/base'
import {FieldSelection} from '../interfaces/data'
import {
    getBlockHeaderProps,
    getLogValidator,
    getTraceFrameValidator,
    getTxProps,
    getTxReceiptProps,
    project
} from '../mapping/schema'
import {
    array,
    BYTES,
    NAT,
    object,
    option,
    QTY,
    record,
    ref,
    SMALL_QTY,
    STRING,
    taggedUnion,
    Validator
} from '../validation'
import {MappingRequest} from './request'
import {DebugStateDiffResult, TraceStateDiff} from './rpc-data'


export const getBlockValidator = weakMemo((req: MappingRequest) => {
    let Transaction = req.transactions
        ? object({
            hash: BYTES,
            ...getTxProps(req.fields, false)
        })
        : BYTES

    let GetBlock = object({
        ...getBlockHeaderProps(req.fields, false),
        transactions: array(Transaction)
    })

    let Log = getLogValidator(req.fields, false)

    let Receipt = object({
        transactionIndex: SMALL_QTY,
        ...getTxReceiptProps(req.fields, false),
        logs: req.logList ? array(Log) : undefined
    })

    let TraceFrame = getTraceFrameValidator(req.fields, false)

    let DebugFrame = getDebugFrameValidator(req.fields)

    return object({
        height: NAT,
        hash: BYTES,
        block: GetBlock,
        ...project({
            logs: req.logs,
            receipts: req.receipts
        }, {
            logs: array(Log),
            receipts: array(Receipt)
        }),
        traceReplays: option(array(object({
            transactionHash: BYTES,
            trace: option(array(TraceFrame)),
            stateDiff: option(record(BYTES, TraceStateDiff))
        }))),
        debugFrames: option(array(object({
            result: DebugFrame
        }))),
        debugStateDiffs: option(array(DebugStateDiffResult))
    })
})


function getDebugFrameValidator(fields: FieldSelection | undefined) {
    let Frame: Validator<DebugFrame, unknown>

    let base = project(fields?.trace, {
        error: option(STRING),
        revertReason: option(STRING),
        calls: option(array(ref(() => Frame)))
    })

    let Create = object({
        ...base,
        ...project({
            from: fields?.trace?.createFrom,
            value: fields?.trace?.createValue,
            gas: fields?.trace?.createGas,
            input: fields?.trace?.createInit,
            gasUsed: fields?.trace?.createResultGasUsed,
            output: fields?.trace?.createResultCode,
            to: fields?.trace?.createResultAddress
        }, {
            from: BYTES,
            value: QTY,
            gas: QTY,
            input: BYTES,
            gasUsed: QTY,
            output: BYTES,
            to: BYTES
        })
    })

    let Call = object({
        ...base,
        ...project({
            from: fields?.trace?.callFrom,
            to: fields?.trace?.callTo,
            value: fields?.trace?.callValue,
            gas: fields?.trace?.callGas,
            input: fields?.trace?.callInput
        }, {
            from: BYTES,
            to: BYTES,
            value: option(QTY),
            gas: QTY,
            input: BYTES
        })
    })

    let Suicide = object({
        ...base,
        ...project({
            from: fields?.trace?.suicideAddress,
            to: fields?.trace?.suicideRefundAddress,
            value: fields?.trace?.suicideBalance
        }, {
            from: BYTES,
            to: BYTES,
            value: QTY
        })
    })

    Frame = taggedUnion('type', {
        CALL: Call,
        CALLCODE: Call,
        STATICCALL: Call,
        DELEGATECALL: Call,
        CREATE: Create,
        CREATE2: Create,
        SELFDESTRUCT: Suicide,
        INVALID: object({}),
        STOP: object({})
    })

    return Frame
}


export interface DebugFrame {
    type: 'CALL' | 'CALLCODE' | 'STATICCALL' | 'DELEGATECALL' | 'CREATE' | 'CREATE2' | 'SELFDESTRUCT' | 'INVALID' | 'STOP'
    error?: string
    revertReason?: string
    from?: Bytes20
    to?: Bytes20
    value?: bigint
    gas?: bigint
    gasUsed?: bigint
    input?: Bytes
    output?: Bytes
    calls?: DebugFrame[]
}
