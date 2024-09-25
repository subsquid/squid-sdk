import {weakMemo} from '@subsquid/util-internal'
import {
    array,
    BIG_NAT,
    BOOLEAN,
    NAT,
    INT,
    object,
    option,
    STRING,
    ANY,
    record
} from '@subsquid/util-internal-validation'
import {FieldSelection} from '../data/model'
import {Selector} from '../data/util'


export const getDataSchema = weakMemo((fields: FieldSelection) => {
    let BlockHeader = object({
        number: NAT,
        hash: STRING,
        ...project(fields.block, {
            parentHash: STRING,
            txTrieRoot: STRING,
            version: option(INT),
            timestamp: NAT,
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
            feeLimit: option(BIG_NAT),
            expiration: option(NAT),
            timestamp: option(NAT),
            rawDataHex: STRING,
            fee: option(BIG_NAT),
            contractResult: option(STRING),
            contractAddress: option(STRING),
            resMessage: option(STRING),
            withdrawAmount: option(BIG_NAT),
            unfreezeAmount: option(BIG_NAT),
            withdrawExpireAmount: option(BIG_NAT),
            cancelUnfreezeV2Amount: option(record(STRING, BIG_NAT)),
            result: option(STRING),
            energyFee: option(BIG_NAT),
            energyUsage: option(BIG_NAT),
            energyUsageTotal: option(BIG_NAT),
            netUsage: option(BIG_NAT),
            netFee: option(BIG_NAT),
            originEnergyUsage: option(BIG_NAT),
            energyPenaltyTotal: option(BIG_NAT),
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
        callValue: option(BIG_NAT),
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
