import {FieldSelection} from '../interfaces/data'
import {
    array,
    BYTES,
    NAT,
    object,
    option,
    QTY,
    SMALL_QTY,
    STRING,
    STRING_FLOAT,
    taggedUnion,
    withDefault,
    withSentinel
} from '@subsquid/util-internal-validation'


export function getBlockHeaderProps(fields: FieldSelection['block'], forArchive: boolean) {
    let natural = forArchive ? NAT : SMALL_QTY
    return {
        number: natural,
        hash: BYTES,
        parentHash: BYTES,
        ...project(fields, {
            nonce: withSentinel('BlockHeader.nonce', '0x', BYTES),
            sha3Uncles: withSentinel('BlockHeader.sha3Uncles', '0x', BYTES),
            logsBloom: withSentinel('BlockHeader.logsBloom', '0x', BYTES),
            transactionsRoot: withSentinel('BlockHeader.transactionsRoot', '0x', BYTES),
            stateRoot: withSentinel('BlockHeader.stateRoot', '0x', BYTES),
            receiptsRoot: withSentinel('BlockHeader.receiptsRoot', '0x', BYTES),
            mixHash: withSentinel('BlockHeader.mixHash', '0x', BYTES),
            miner: withSentinel('BlockHeader.miner', '0x', BYTES),
            difficulty: withSentinel('BlockHeader.difficulty', -1n, QTY),
            totalDifficulty: withSentinel('BlockHeader.totalDifficulty', -1n, QTY),
            extraData: withSentinel('BlockHeader.extraData', '0x', BYTES),
            size: withSentinel('BlockHeader.size', -1, natural),
            gasLimit: withSentinel('BlockHeader.gasLimit', -1n, QTY),
            gasUsed: withSentinel('BlockHeader.gasUsed', -1n, QTY),
            baseFeePerGas: withSentinel('BlockHeader.baseFeePerGas', -1n, QTY),
            timestamp: withSentinel('BlockHeader.timestamp', 0, natural),
            l1BlockNumber: withDefault(0, natural),
    })
    }
}


export function getTxProps(fields: FieldSelection['transaction'], forArchive: boolean) {
    let natural = forArchive ? NAT : SMALL_QTY

    let Authorization = object({
        chainId: natural,
        nonce: natural,
        address: BYTES,
        yParity: natural,
        r: BYTES,
        s: BYTES,
    })

    return {
        transactionIndex: natural,
        ...project(fields, {
            hash: BYTES,
            from: BYTES,
            to: option(BYTES),
            gas: withSentinel('Transaction.gas', -1n, QTY),
            gasPrice: withSentinel('Transaction.gasPrice', -1n, QTY),
            maxFeePerGas: option(QTY),
            maxPriorityFeePerGas: option(QTY),
            input: BYTES,
            nonce: withSentinel('Transaction.nonce', -1, natural),
            value: withSentinel('Transaction.value', -1n, QTY),
            v: withSentinel('Transaction.v', -1n, QTY),
            r: withSentinel('Transaction.r', '0x', BYTES),
            s: withSentinel('Transaction.s', '0x', BYTES),
            yParity: option(natural),
            chainId: option(natural),
            authorizationList: option(array(Authorization)),
        })
    }
}


export function getTxReceiptProps(fields: FieldSelection['transaction'], forArchive: boolean) {
    let natural = forArchive ? NAT : SMALL_QTY
    return project(fields, {
        gasUsed: withSentinel('Receipt.gasUsed', -1n, QTY),
        cumulativeGasUsed: withSentinel('Receipt.cumulativeGasUsed', -1n, QTY),
        effectiveGasPrice: withSentinel('Receipt.effectiveGasPrice', -1n, QTY),
        contractAddress: option(BYTES),
        type: withSentinel('Receipt.type', -1, natural),
        status: withSentinel('Receipt.status', -1, natural),
        l1Fee: option(QTY),
        l1FeeScalar: option(STRING_FLOAT),
        l1GasPrice: option(QTY),
        l1GasUsed: option(QTY),
        l1BlobBaseFee: option(QTY),
        l1BlobBaseFeeScalar: option(natural),
        l1BaseFeeScalar: option(natural),
    })
}


export function getLogProps(fields: FieldSelection['log'], forArchive: boolean) {
    let natural = forArchive ? NAT : SMALL_QTY
    return {
        logIndex: natural,
        transactionIndex: natural,
        ...project(fields, {
            transactionHash: BYTES,
            address: BYTES,
            data: BYTES,
            topics: array(BYTES)
        })
    }
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
        init: withDefault('0x', BYTES),
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


export function assertAssignable<A, B extends A>(): void {}
