import {
    array,
    BYTES,
    NAT,
    object,
    option,
    QTY,
    SMALL_QTY,
    STRING,
    taggedUnion,
    withDefault
} from '@subsquid/util-internal-validation'
import * as schema from '@subsquid/evm-data/lib/schema'
import {FieldSelection} from '../interfaces/data'


export function getLogValidator(fields: FieldSelection['log'], forArchive: boolean) {
    let natural = forArchive ? NAT : SMALL_QTY
    return object({
        address: forArchive ? undefined : BYTES,
        topics: forArchive ? undefined : array(BYTES),
        ...project(fields, schema.Log.props),
        logIndex: natural,
        transactionIndex: natural,
    })
}


export function getTraceFrameValidator(fields: FieldSelection['trace'], forArchive: boolean) {
    let traceBase = {
        transactionIndex: forArchive ? NAT : undefined,
        traceAddress: array(NAT),
        ...project(fields, {
            subtraces: NAT,
            error: option(STRING),
            revertReason: option(STRING)
        })
    }

    let traceCreateAction = project({
        from: fields?.createFrom || !forArchive,
        value: fields?.createValue,
        gas: fields?.createGas,
        init: fields?.createInit
    }, {
        from: BYTES,
        value: QTY,
        gas: QTY,
        init: BYTES
    })

    let traceCreateResult = project({
        gasUsed: fields?.createResultGasUsed,
        code: fields?.createResultCode,
        address: fields?.createResultAddress
    }, {
        gasUsed: QTY,
        code: withDefault('0x', BYTES),
        address: withDefault('0x0000000000000000000000000000000000000000', BYTES)
    })

    let TraceCreate = object({
        ...traceBase,
        action: isEmpty(traceCreateAction) ? undefined : object(traceCreateAction),
        result: isEmpty(traceCreateResult) ? undefined : option(object(traceCreateResult))
    })

    let traceCallAction = project({
        callType: fields?.callCallType,
        from: forArchive ? fields?.callFrom : true,
        to: forArchive ? fields?.callTo : true,
        value: fields?.callValue,
        gas: fields?.callGas,
        input: forArchive ? fields?.callInput : true,
        sighash: forArchive ? fields?.callSighash : false
    }, {
        callType: STRING,
        from: BYTES,
        to: BYTES,
        value: option(QTY),
        gas: QTY,
        input: BYTES,
        sighash: withDefault('0x', BYTES)
    })

    let traceCallResult = project({
        gasUsed: fields?.callResultGasUsed,
        output: fields?.callResultOutput
    }, {
        gasUsed: QTY,
        output: withDefault('0x', BYTES)
    })

    let TraceCall = object({
        ...traceBase,
        action: isEmpty(traceCallAction) ? undefined : object(traceCallAction),
        result: isEmpty(traceCallResult) ? undefined : option(object(traceCallResult))
    })

    let traceSuicideAction = project({
        address: fields?.suicideAddress,
        refundAddress: forArchive ? fields?.suicideRefundAddress : true,
        balance: fields?.suicideBalance
    }, {
        address: BYTES,
        refundAddress: BYTES,
        balance: QTY
    })

    let TraceSuicide = object({
        ...traceBase,
        action: isEmpty(traceSuicideAction) ? undefined : object(traceSuicideAction)
    })

    let traceRewardAction = project({
        author: forArchive ? fields?.rewardAuthor : true,
        value: fields?.rewardValue,
        type: fields?.rewardType
    }, {
        author: BYTES,
        value: QTY,
        type: STRING
    })

    let TraceReward = object({
        ...traceBase,
        action: isEmpty(traceRewardAction) ? undefined : object(traceRewardAction)
    })

    return taggedUnion('type', {
        create: TraceCreate,
        call: TraceCall,
        suicide: TraceSuicide,
        reward: TraceReward
    })
}


export function project<T extends object, F extends {[K in keyof T]?: boolean}>(
    fields: F | undefined,
    obj: T
): Partial<T> {
    if (fields == null) return {}
    let result: Partial<T> = {}
    let key: keyof T
    for (key in obj) {
        if (fields[key]) {
            result[key] = obj[key]
        }
    }
    return result
}


export function isEmpty(obj: object): boolean {
    for (let _ in obj) {
        return false
    }
    return true
}
