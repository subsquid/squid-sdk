import {weakMemo} from '@subsquid/util-internal'
import {
    array,
    BOOLEAN,
    NAT,
    INT,
    object,
    option,
    STRING,
    ANY,
    record,
    ValidationFailure,
    Validator
} from '@subsquid/util-internal-validation'
import {FieldSelection} from '../data/model'
import {Selector} from '../data/util'


function isIntegerString(value: unknown): value is string {
    return typeof value == 'string' && /^-?\d+$/.test(value)
}


/**
 * int64 value: a decimal string (possibly negative, e.g. `feeLimit`) or a JSON integer,
 * depending on the dataset writer.
 */
export const INT64: Validator<bigint, string> = {
    cast(value) {
        if (isIntegerString(value)) return BigInt(value)
        if (typeof value == 'number' && Number.isInteger(value)) return BigInt(value)
        return new ValidationFailure(value, '{value} is not an integer')
    },
    validate(value) {
        if (isIntegerString(value)) return
        if (typeof value == 'number' && Number.isInteger(value)) return
        return new ValidationFailure(value, '{value} is not an integer')
    },
    phantom() {
        return '0'
    }
}


/**
 * Millisecond timestamp: a JSON integer or a decimal string. Values are not range-checked,
 * since some are garbage above 2^53 on chain.
 */
export const MILLIS: Validator<number, number> = {
    cast(value) {
        if (typeof value == 'number' && Number.isInteger(value)) return value
        if (isIntegerString(value)) return Number(value)
        return new ValidationFailure(value, '{value} is not a millisecond timestamp')
    },
    validate(value) {
        if (typeof value == 'number' && Number.isInteger(value)) return
        if (isIntegerString(value)) return
        return new ValidationFailure(value, '{value} is not a millisecond timestamp')
    },
    phantom() {
        return 0
    }
}


export const getDataSchema = weakMemo((fields: FieldSelection) => {
    let BlockHeader = object({
        number: NAT,
        hash: STRING,
        parentHash: STRING,
        ...project(fields.block, {
            txTrieRoot: STRING,
            version: option(INT),
            timestamp: MILLIS,
            witnessAddress: STRING,
            witnessSignature: STRING,
        })
    })

    let TransactionResult = array(object({
        contractRet: option(STRING)
    }))

    let Transaction = object({
        transactionIndex: NAT,
        ...project(fields.transaction, {
            hash: STRING,
            ret: option(TransactionResult),
            signature: option(array(STRING)),
            type: STRING,
            parameter: ANY,
            permissionId: option(NAT),
            refBlockBytes: option(STRING),
            refBlockHash: option(STRING),
            feeLimit: option(INT64),
            expiration: option(MILLIS),
            timestamp: option(INT64),
            rawDataHex: STRING,
            fee: option(INT64),
            contractResult: option(STRING),
            contractAddress: option(STRING),
            resMessage: option(STRING),
            withdrawAmount: option(INT64),
            unfreezeAmount: option(INT64),
            withdrawExpireAmount: option(INT64),
            cancelUnfreezeV2Amount: option(record(STRING, INT64)),
            result: option(STRING),
            energyFee: option(INT64),
            energyUsage: option(INT64),
            energyUsageTotal: option(INT64),
            netUsage: option(INT64),
            netFee: option(INT64),
            originEnergyUsage: option(INT64),
            energyPenaltyTotal: option(INT64),
        })
    })

    let Log = object({
        transactionIndex: NAT,
        logIndex: NAT,
        ...project(fields.log, {
            address: STRING,
            data: option(STRING),
            topics: array(STRING),
        })
    })

    let CallValueInfo = object({
        callValue: option(INT64),
        tokenId: option(STRING)
    })

    let InternalTransaction = object({
        transactionIndex: NAT,
        internalTransactionIndex: NAT,
        ...project(fields.internalTransaction, {
            hash: STRING,
            callerAddress: STRING,
            transferToAddress: option(STRING),
            callValueInfo: array(CallValueInfo),
            note: STRING,
            rejected: option(BOOLEAN),
            extra: option(STRING),
        })
    })

    return object({
        header: BlockHeader,
        transactions: option(array(Transaction)),
        logs: option(array(Log)),
        internalTransactions: option(array(InternalTransaction)),
    })
})


function project<T>(fields: Selector<keyof T> | undefined, obj: T): Partial<T> {
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
