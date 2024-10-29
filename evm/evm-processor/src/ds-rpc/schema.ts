import {weakMemo} from '@subsquid/util-internal'
import {
    array,
    BYTES,
    cast,
    NAT,
    object,
    option,
    QTY,
    record,
    ref,
    SMALL_QTY,
    STRING,
    taggedUnion,
    ValidationFailure,
    Validator,
    withDefault
} from '@subsquid/util-internal-validation'
import {Bytes, Bytes20} from '../interfaces/base'
import {FieldSelection} from '../interfaces/data'
import {
    getBlockHeaderProps,
    getLogProps,
    getTraceFrameValidator,
    getTxProps,
    getTxReceiptProps,
    project
} from '../mapping/schema'
import {MappingRequest} from './request'
import {DebugStateDiffResult, TraceStateDiff} from './rpc-data'

// Here we must be careful to include all fields,
// that can potentially be used in item filters
// (no matter what field selection is telling us to omit)
export const getBlockValidator = weakMemo((req: MappingRequest) => {
    let Transaction = req.transactions
        ? object({
            ...getTxProps(req.fields.transaction, false),
            hash: BYTES,
            input: BYTES,
            from: BYTES,
            to: option(BYTES),
        })
        : BYTES

    let GetBlock = object({
        ...getBlockHeaderProps(req.fields.block, false),
        transactions: array(Transaction)
    })

    let Log = object({
        ...getLogProps(
            {...req.fields.log, address: true, topics: true},
            false
        ),
        address: BYTES,
        topics: array(BYTES)
    })

    let Receipt = object({
        transactionIndex: SMALL_QTY,
        transactionHash: BYTES,
        ...getTxReceiptProps(req.fields.transaction, false),
        logs: req.logList ? array(Log) : undefined
    })

    let TraceFrame = getTraceFrameValidator(req.fields.trace, false)

    let DebugFrame = getDebugFrameValidator(req.fields.trace)

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
        debugFrames: option(array(option(object({
            result: DebugFrame
        })))),
        debugStateDiffs: option(array(option(DebugStateDiffResult)))
    })
})


function getDebugFrameValidator(fields: FieldSelection['trace']) {
    let Frame: Validator<DebugFrame, unknown>

    let base = {
        calls: option(array(ref(() => Frame))),
        ...project(fields, {
            error: option(STRING),
            revertReason: option(STRING),
        })
    }

    let Create = object({
        ...base,
        from: BYTES,
        ...project({
            value: fields?.createValue,
            gas: fields?.createGas,
            input: fields?.createInit,
            gasUsed: fields?.createResultGasUsed,
            output: fields?.createResultCode,
            to: fields?.createResultAddress
        }, {
            value: QTY,
            gas: QTY,
            input: BYTES,
            gasUsed: QTY,
            output: withDefault('0x', BYTES),
            to: withDefault('0x0000000000000000000000000000000000000000', BYTES)
        })
    })

    let Call = object({
        ...base,
        to: withDefault('0x0000000000000000000000000000000000000000', BYTES),
        input: BYTES,
        ...project({
            from: fields?.callFrom,
            value: fields?.callValue,
            gas: fields?.callGas,
            output: fields?.callResultOutput,
            gasUsed: fields?.callResultGasUsed
        }, {
            from: BYTES,
            value: option(QTY),
            gas: withDefault(0n, QTY),
            gasUsed: withDefault(0n, QTY),
            output: withDefault('0x', BYTES)
        })
    })

    let Suicide = object({
        ...base,
        to: withDefault('0x0000000000000000000000000000000000000000', BYTES),
        ...project({
            from: fields?.suicideAddress,
            value: fields?.suicideBalance
        }, {
            from: BYTES,
            value: QTY
        })
    })

    let tagField = 'type'

    function getVariant(object: any) {
        if (typeof object != 'object' || !object) return new ValidationFailure(object, `{value} is not an object`)
        let tag = cast(STRING, object[tagField]).toUpperCase()
        object[tagField] = tag
        switch (tag) {
            case 'CALL':
            case 'CALLCODE':
            case 'STATICCALL':
            case 'DELEGATECALL':
            case 'INVALID':
                return Call
            case 'CREATE':
            case 'CREATE2':
                return Create
            case 'SELFDESTRUCT':
                return Suicide
            case 'STOP':
                return object({})
        }
        let failure = new ValidationFailure(tag, `got {value}, but expected one of ["CALL","CALLCODE","STATICCALL","DELEGATECALL","INVALID","CREATE","CREATE2","SELFDESTRUCT","STOP"]`)
        failure.path.push(tagField)
        return failure
    }

    Frame = {
        cast(value: any) {
            let variant = getVariant(value)
            if (variant instanceof ValidationFailure) return variant
            let result = variant.cast(value)
            if (result instanceof ValidationFailure) return result
            result[tagField] = value[tagField]
            return result
        },
        validate(value) {
            let variant = getVariant(value)
            if (variant instanceof ValidationFailure) return variant
            return variant.validate(value)
        },
        phantom() {
            throw new Error()
        }
    }

    return Frame
}





export type DebugFrame = DebugCreateFrame | DebugCallFrame | DebugSuicideFrame | DebugStopFrame


interface DebugCreateFrame extends DebugFrameBase {
    type: 'CREATE' | 'CREATE2'
    from: Bytes20
}


interface DebugCallFrame extends DebugFrameBase {
    type:  'CALL' | 'CALLCODE' | 'STATICCALL' | 'DELEGATECALL' | 'INVALID'
    to: Bytes20
    input: Bytes
}


interface DebugSuicideFrame extends DebugFrameBase {
    type: 'SELFDESTRUCT'
    to: Bytes20
}


interface DebugStopFrame extends DebugFrameBase {
    type: 'STOP'
}


interface DebugFrameBase {
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
