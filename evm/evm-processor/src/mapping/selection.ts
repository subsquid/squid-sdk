import {FieldSelection} from '../interfaces/data'
import {object, option, BOOLEAN} from '@subsquid/util-internal-validation'


type GetFieldSelectionSchema<T> = {[K in keyof T]-?: typeof FIELD}


const FIELD = option(BOOLEAN)


export function getBlockHeaderSelectionValidator() {
    let fields: GetFieldSelectionSchema<FieldSelection['block']> = {
        nonce: FIELD,
        sha3Uncles: FIELD,
        logsBloom: FIELD,
        transactionsRoot: FIELD,
        stateRoot: FIELD,
        receiptsRoot: FIELD,
        mixHash: FIELD,
        miner: FIELD,
        difficulty: FIELD,
        totalDifficulty: FIELD,
        extraData: FIELD,
        size: FIELD,
        gasLimit: FIELD,
        gasUsed: FIELD,
        baseFeePerGas: FIELD,
        timestamp: FIELD,
        l1BlockNumber: FIELD,
    }
    return object(fields)
}


export function getTxSelectionValidator() {
    let fields: GetFieldSelectionSchema<FieldSelection['transaction']> = {
        hash: FIELD,
        from: FIELD,
        to: FIELD,
        gas: FIELD,
        gasPrice: FIELD,
        maxFeePerGas: FIELD,
        maxPriorityFeePerGas: FIELD,
        sighash: FIELD,
        input: FIELD,
        nonce: FIELD,
        value: FIELD,
        v: FIELD,
        r: FIELD,
        s: FIELD,
        yParity: FIELD,
        chainId: FIELD,
        gasUsed: FIELD,
        cumulativeGasUsed: FIELD,
        effectiveGasPrice: FIELD,
        contractAddress: FIELD,
        type: FIELD,
        status: FIELD,
        l1Fee: FIELD,
        l1FeeScalar: FIELD,
        l1GasPrice: FIELD,
        l1GasUsed: FIELD,
        l1BaseFeeScalar: FIELD,
        l1BlobBaseFee: FIELD,
        l1BlobBaseFeeScalar: FIELD,
        authorizationList: FIELD,
    }
    return object(fields)
}


export function getLogSelectionValidator() {
    let fields: GetFieldSelectionSchema<FieldSelection['log']> = {
        transactionHash: FIELD,
        address: FIELD,
        data: FIELD,
        topics: FIELD,
    }
    return object(fields)
}


export function getTraceSelectionValidator() {
    let fields: GetFieldSelectionSchema<FieldSelection['trace']> = {
        callCallType: FIELD,
        callFrom: FIELD,
        callGas: FIELD,
        callInput: FIELD,
        callResultGasUsed: FIELD,
        callResultOutput: FIELD,
        callSighash: FIELD,
        callTo: FIELD,
        callValue: FIELD,
        createFrom: FIELD,
        createGas: FIELD,
        createInit: FIELD,
        createResultAddress: FIELD,
        createResultCode: FIELD,
        createResultGasUsed: FIELD,
        createValue: FIELD,
        error: FIELD,
        revertReason: FIELD,
        rewardAuthor: FIELD,
        rewardType: FIELD,
        rewardValue: FIELD,
        subtraces: FIELD,
        suicideAddress: FIELD,
        suicideBalance: FIELD,
        suicideRefundAddress: FIELD,
    }
    return object(fields)
}


export function getStateDiffSelectionValidator() {
    let fields: GetFieldSelectionSchema<FieldSelection['stateDiff']> = {
        kind: FIELD,
        next: FIELD,
        prev: FIELD,
    }
    return object(fields)
}


export function getFieldSelectionValidator() {
    return object({
        block: option(getBlockHeaderSelectionValidator()),
        log: option(getLogSelectionValidator()),
        transaction: option(getTxSelectionValidator()),
        trace: option(getTraceSelectionValidator()),
        stateDiff: option(getStateDiffSelectionValidator()),
    })
}