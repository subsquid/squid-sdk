import {
    array,
    BYTES,
    NAT,
    object,
    option,
    QTY,
    STRING,
    STRING_FLOAT,
    taggedUnion,
    withDefault
} from '@subsquid/util-internal-validation'
import {isEmpty, project} from '../../util'
import type {EvmFieldSelection} from './fields'


export function patchEvmQueryFields(fields: EvmFieldSelection): EvmFieldSelection {
    fields = {...fields}

    let {number, hash, parentHash, ...block} = fields.block as any ?? {}
    fields.block = {
        number: true,
        hash: true,
        parentHash: true,
        ...block
    } as any

    let {type, ...trace} = fields.trace as any ?? {}
    fields.trace = {
        type: true,
        ...trace
    } as any

    let {kind, ...stateDiff} = fields.stateDiff as any ?? {}
    fields.stateDiff = {
        kind: true,
        ...stateDiff
    } as any

    return fields
}


export function getEvmBlockSchema(fields: EvmFieldSelection) {
    return object({
        header: getBlockHeaderSchema(fields.block),
        transactions: option(array(getTransactionSchema(fields.transaction))),
        logs: option(array(getLogSchema(fields.log))),
        traces: option(array(getTraceFrameSchema(fields.trace))),
        stateDiffs: option(array(getStateDiffSchema(fields.stateDiff)))
    })
}


function getBlockHeaderSchema(fields: EvmFieldSelection['block']) {
    return object({
        number: NAT,
        hash: BYTES,
        parentHash: BYTES,
        ...project(fields, {
            nonce: BYTES,
            sha3Uncles: BYTES,
            logsBloom: BYTES,
            transactionsRoot: BYTES,
            stateRoot: BYTES,
            receiptsRoot: BYTES,
            mixHash: BYTES,
            miner: BYTES,
            extraData: BYTES,
            size: NAT,
            gasLimit: QTY,
            gasUsed: QTY,
            timestamp: NAT,
            difficulty: QTY,
            totalDifficulty: option(QTY),
            baseFeePerGas: option(QTY),
            l1BlockNumber: option(NAT),
        })
    })
}


const Authorization = object({
    chainId: NAT,
    nonce: NAT,
    address: BYTES,
    yParity: NAT,
    r: BYTES,
    s: BYTES,
})


function getTransactionSchema(fields: EvmFieldSelection['transaction']) {
    return object(project(fields, {
        transactionIndex: NAT,
        hash: BYTES,
        from: BYTES,
        to: option(BYTES),
        gas: QTY,
        gasPrice: option(QTY),
        maxFeePerGas: option(QTY),
        maxPriorityFeePerGas: option(QTY),
        input: BYTES,
        sighash: withDefault('0x', BYTES),
        nonce: NAT,
        value: QTY,
        v: option(QTY),
        r: option(BYTES),
        s: option(BYTES),
        yParity: option(NAT),
        chainId: option(NAT),
        authorizationList: option(array(Authorization)),
        gasUsed: QTY,
        cumulativeGasUsed: QTY,
        effectiveGasPrice: QTY,
        contractAddress: option(BYTES),
        type: option(NAT),
        status: option(NAT),
        l1Fee: option(QTY),
        l1FeeScalar: option(STRING_FLOAT),
        l1GasPrice: option(QTY),
        l1GasUsed: option(QTY),
        l1BlobBaseFee: option(QTY),
        l1BlobBaseFeeScalar: option(NAT),
        l1BaseFeeScalar: option(NAT),
    }))
}


function getLogSchema(fields: EvmFieldSelection['log']) {
    return object(project(fields, {
        logIndex: NAT,
        transactionIndex: NAT,
        transactionHash: BYTES,
        address: BYTES,
        data: BYTES,
        topics: array(BYTES)
    }))
}


function getTraceFrameSchema(fields: EvmFieldSelection['trace']) {
    let traceBase = project(fields, {
        transactionIndex: NAT,
        traceAddress: array(NAT),
        subtraces: NAT,
        error: option(STRING),
        revertReason: option(STRING)
    })

    let traceCreateAction = project({
        from: fields?.createFrom,
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
        from: fields?.callFrom,
        to: fields?.callTo,
        value: fields?.callValue,
        gas: fields?.callGas,
        input: fields?.callInput,
        sighash: fields?.callSighash
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
        refundAddress: fields?.suicideRefundAddress,
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
        author: fields?.rewardAuthor,
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


function getStateDiffSchema(fields: EvmFieldSelection['stateDiff']) {
    let stateDiffBase = {
        transactionIndex: NAT,
        address: BYTES,
        key: STRING
    }

    return taggedUnion('kind', {
        ['=']: object(project(fields, stateDiffBase)),
        ['+']: object(project(fields, {...stateDiffBase, next: BYTES})),
        ['*']: object(project(fields, {...stateDiffBase, prev: BYTES, next: BYTES})),
        ['-']: object(project(fields, {...stateDiffBase, prev: BYTES}))
    })
}
