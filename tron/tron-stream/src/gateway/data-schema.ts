import {weakMemo} from '@subsquid/util-internal'
import {
    array,
    BIG_NAT,
    BOOLEAN,
    BYTES,
    NAT,
    INT,
    object,
    option,
    STRING,
    taggedUnion,
    oneOf,
    constant
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

    let Transaction = object({
        transactionIndex: NAT,
        ...project(fields.transaction, {
            hash: BOOLEAN,
            ret: BOOLEAN,
            signature: BOOLEAN,
            type: BOOLEAN,
            parameter: BOOLEAN,
            permissionId: BOOLEAN,
            refBlockBytes: BOOLEAN,
            refBlockHash: BOOLEAN,
            feeLimit: BOOLEAN,
            expiration: BOOLEAN,
            timestamp: BOOLEAN,
            rawDataHex: BOOLEAN,
            fee: BOOLEAN,
            contractResult: BOOLEAN,
            contractAddress: BOOLEAN,
            resMessage: BOOLEAN,
            withdrawAmount: BOOLEAN,
            unfreezeAmount: BOOLEAN,
            withdrawExpireAmount: BOOLEAN,
            cancelUnfreezeV2Amount: BOOLEAN,
            result: BOOLEAN,
            energyFee: BOOLEAN,
            energyUsage: BOOLEAN,
            energyUsageTotal: BOOLEAN,
            netUsage: BOOLEAN,
            netFee: BOOLEAN,
            originEnergyUsage: BOOLEAN,
            energyPenaltyTotal: BOOLEAN,
        })
    })

    let Log = object({
        transactionIndex: NAT,
        logIndex: NAT,
        ...project(fields.log, {
            address: BOOLEAN,
            data: BOOLEAN,
            topics: BOOLEAN,
        })
    })

    let InternalTransaction = object({
        transactionIndex: NAT,
        internalTransactionIndex: NAT,
        ...project(fields.internalTransaction, {
            hash: BOOLEAN,
            callerAddress: BOOLEAN,
            transferToAddress: BOOLEAN,
            callValueInfo: BOOLEAN,
            note: BOOLEAN,
            rejected: BOOLEAN,
            extra: BOOLEAN,
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
