import {FieldSelection} from '../interfaces/data'
import {array, BYTES, NAT, object, option, QTY, SMALL_QTY, STRING, taggedUnion, withSentinel} from '../validation'


export function getBlockHeaderProps(fields: FieldSelection | undefined, forArchive: boolean) {
    let natural = forArchive ? NAT : SMALL_QTY
    return {
        number: natural,
        hash: BYTES,
        parentHash: BYTES,
        ...project(fields?.block, {
            nonce: withSentinel('0x', BYTES),
            sha3Uncles: withSentinel('0x', BYTES),
            logsBloom: withSentinel('0x', BYTES),
            transactionsRoot: withSentinel('0x', BYTES),
            stateRoot: withSentinel('0x', BYTES),
            receiptsRoot: withSentinel('0x', BYTES),
            mixHash: withSentinel('0x', BYTES),
            miner: withSentinel('0x', BYTES),
            difficulty: withSentinel(-1n, QTY),
            totalDifficulty: withSentinel(-1n, QTY),
            extraData: withSentinel('0x', BYTES),
            size: withSentinel(-1, SMALL_QTY),
            gasLimit: withSentinel(-1n, QTY),
            gasUsed: withSentinel(-1n, QTY),
            baseFeePerGas: withSentinel(-1n, QTY),
            timestamp: withSentinel(0, natural)
        })
    }
}


export function getTxProps(fields: FieldSelection | undefined, forArchive: boolean) {
    let natural = forArchive ? NAT : SMALL_QTY
    let projection = {...fields?.transaction}
    if (projection.sighash && !forArchive) {
        projection.input = true
    }
    return {
        transactionIndex: natural,
        ...project(projection, {
            from: BYTES,
            to: option(BYTES),
            gas: withSentinel(-1n, QTY),
            gasPrice: withSentinel(-1n, QTY),
            maxFeePerGas: option(QTY),
            maxPriorityFeePerGas: option(QTY),
            input: BYTES,
            nonce: withSentinel(-1, NAT),
            value: withSentinel(-1n, QTY),
            v: withSentinel(-1n, QTY),
            r: withSentinel('0x', BYTES),
            s: withSentinel('0x', BYTES),
            yParity: option(natural),
            chainId: option(natural),
        })
    }
}


export function getTxReceiptProps(fields: FieldSelection | undefined, forArchive: boolean) {
    let natural = forArchive ? NAT : SMALL_QTY
    return project(fields?.transaction, {
        gasUsed: withSentinel(-1n, QTY),
        cumulativeGasUsed: withSentinel(-1n, QTY),
        effectiveGasPrice: withSentinel(-1n, QTY),
        contractAddress: option(BYTES),
        type: withSentinel(-1, natural),
        status: withSentinel(-1, natural),
    })
}


export function getLogValidator(fields: FieldSelection | undefined, forArchive: boolean) {
    let natural = forArchive ? NAT : SMALL_QTY
    return object({
        logIndex: natural,
        transactionIndex: natural,
        ...project(fields?.log, {
            transactionHash: BYTES,
            address: BYTES,
            data: BYTES,
            topics: array(BYTES)
        })
    })
}


export function getTraceFrameValidator(fields: FieldSelection | undefined, forArchive: boolean) {
    let traceBase = {
        transactionIndex: forArchive ? NAT : undefined,
        traceAddress: array(NAT),
        ...project(fields?.trace, {
            subtraces: NAT,
            error: option(STRING),
            revertReason: option(STRING)
        })
    }

    let traceCreateAction = project({
        from: fields?.trace?.createFrom,
        value: fields?.trace?.createValue,
        gas: fields?.trace?.createGas,
        init: fields?.trace?.createInit
    }, {
        from: BYTES,
        value: QTY,
        gas: QTY,
        init: BYTES
    })

    let traceCreateResult = project({
        gasUsed: fields?.trace?.createResultGasUsed,
        code: fields?.trace?.createResultCode,
        address: fields?.trace?.createResultAddress
    }, {
        gasUsed: QTY,
        code: BYTES,
        address: BYTES
    })

    let TraceCreate = object({
        ...traceBase,
        action: isEmpty(traceCreateAction) ? undefined : object(traceCreateAction),
        result: isEmpty(traceCreateResult) ? undefined : option(object(traceCreateResult))
    })

    let traceCallAction = project({
        callType: fields?.trace?.callCallType,
        from: fields?.trace?.callFrom,
        to: fields?.trace?.callTo,
        value: fields?.trace?.callValue,
        gas: fields?.trace?.callGas,
        input: fields?.trace?.callInput,
        sighash: fields?.trace?.callSighash
    }, {
        callType: STRING,
        from: BYTES,
        to: BYTES,
        value: option(QTY),
        gas: QTY,
        input: BYTES,
        sighash: forArchive ? BYTES : undefined
    })

    let traceCallResult = project({
        gasUsed: fields?.trace?.callResultGasUsed,
        output: fields?.trace?.callResultOutput
    }, {
        gasUsed: QTY,
        output: BYTES
    })

    let TraceCall = object({
        ...traceBase,
        action: isEmpty(traceCallAction) ? undefined : object(traceCallAction),
        result: isEmpty(traceCallResult) ? undefined : option(object(traceCallResult))
    })

    let traceSuicideAction = project({
        address: fields?.trace?.suicideAddress,
        refundAddress: fields?.trace?.suicideRefundAddress,
        balance: fields?.trace?.suicideBalance
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
        author: fields?.trace?.rewardAuthor,
        value: fields?.trace?.rewardValue,
        type: fields?.trace?.rewardType
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


export function assertAssignable<A, B extends A>(): void {}
