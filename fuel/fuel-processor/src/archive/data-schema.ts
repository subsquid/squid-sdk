import {weakMemo} from '@subsquid/util-internal'
import {
    array,
    BIG_NAT,
    BOOLEAN,
    BYTES,
    NAT,
    object,
    option,
    STRING,
    taggedUnion,
    oneOf,
    constant
} from '@subsquid/util-internal-validation'
import {FieldSelection} from '../interfaces/data'
import {Selector} from '../interfaces/util'


export const getDataSchema = weakMemo((fields: FieldSelection) => {
    let BlockHeader = object({
        number: NAT,
        hash: BYTES,
        ...project(fields.block, {
            daHeight: BIG_NAT,
            transactionsRoot: BYTES,
            transactionsCount: BIG_NAT,
            messageReceiptRoot: BYTES,
            messageReceiptCount: BIG_NAT,
            applicationHash: BYTES,
            prevRoot: BYTES,
            time: BIG_NAT,
        })
    })

    let Transaction = object({
        index: NAT,
        ...project(fields.transaction, {
            bytecodeLength: option(BIG_NAT),
            bytecodeWitnessIndex: option(NAT),
            gasPrice: option(BIG_NAT),
            hash: BYTES,
            inputAssetIds: option(array(BYTES)),
            policies: option(object({
                gasPrice: option(BIG_NAT),
                witnessLimit: option(BIG_NAT),
                maturity: option(NAT),
                maxFee: option(BIG_NAT)
            })),
            inputContract: option(object({
                utxoId: BYTES,
                balanceRoot: BYTES,
                stateRoot: BYTES,
                txPointer: STRING,
                contract: BYTES
            })),
            inputContracts: option(array(BYTES)),
            isCreate: BOOLEAN,
            isMint: BOOLEAN,
            isScript: BOOLEAN,
            maturity: option(NAT),
            mintAmount: option(BIG_NAT),
            mintAssetId: option(BYTES),
            outputContract: option(object({
                inputIndex: NAT,
                balanceRoot: BYTES,
                stateRoot: BYTES
            })),
            rawPayload: option(BYTES),
            receiptsRoot: option(BYTES),
            salt: option(BYTES),
            script: option(BYTES),
            scriptData: option(BYTES),
            scriptGasLimit: option(BIG_NAT),
            storageSlots: option(array(BYTES)),
            txPointer: option(STRING),
            type: oneOf({
                script: constant('Script'),
                create: constant('Create'),
                mint: constant('Mint'),
            }),
            witnesses: option(array(BYTES)),
        })
    })

    let Receipt = object({
        transactionIndex: NAT,
        index: NAT,
        ...project(fields.receipt, {
            amount: option(BIG_NAT),
            assetId: option(BYTES),
            contract: option(BYTES),
            contractId: option(BYTES),
            data: option(BYTES),
            digest: option(BYTES),
            gas: option(BIG_NAT),
            gasUsed: option(BIG_NAT),
            is: option(BIG_NAT),
            len: option(BIG_NAT),
            nonce: option(BYTES),
            param1: option(BIG_NAT),
            param2: option(BIG_NAT),
            pc: option(BIG_NAT),
            ptr: option(BIG_NAT),
            ra: option(BIG_NAT),
            rb: option(BIG_NAT),
            rc: option(BIG_NAT),
            rd: option(BIG_NAT),
            reason: option(BIG_NAT),
            receiptType: oneOf({
                CALL: constant('CALL'),
                RETURN: constant('RETURN'),
                RETURN_DATA: constant('RETURN_DATA'),
                PANIC: constant('PANIC'),
                REVERT: constant('REVERT'),
                LOG: constant('LOG'),
                LOG_DATA: constant('LOG_DATA'),
                TRANSFER: constant('TRANSFER'),
                TRANSFER_OUT: constant('TRANSFER_OUT'),
                SCRIPT_RESULT: constant('SCRIPT_RESULT'),
                MESSAGE_OUT: constant('MESSAGE_OUT'),
                MINT: constant('MINT'),
                BURN: constant('BURN'),
            }),
            recipient: option(BYTES),
            result: option(BIG_NAT),
            sender: option(BYTES),
            subId: option(BYTES),
            to: option(BYTES),
            toAddress: option(BYTES),
            val: option(BIG_NAT),
        })
    })

    let InputCoin = object({
        transactionIndex: NAT,
        index: NAT,
        ...project({
            amount: fields.input?.coinAmount,
            assetId: fields.input?.coinAssetId,
            maturity: fields.input?.coinMaturity,
            owner: fields.input?.coinOwner,
            predicate: fields.input?.coinPredicate,
            predicateData: fields.input?.coinPredicateData,
            predicateGasUsed: fields.input?.coinPredicateGasUsed,
            txPointer: fields.input?.coinTxPointer,
            utxoId: fields.input?.coinUtxoId,
            witnessIndex: fields.input?.coinWitnessIndex
        }, {
            utxoId: BYTES,
            owner: BYTES,
            amount: BIG_NAT,
            assetId: BYTES,
            txPointer: STRING,
            witnessIndex: NAT,
            maturity: NAT,
            predicateGasUsed: BIG_NAT,
            predicate: BYTES,
            predicateData: BYTES,
        })
    })

    let InputContract = object({
        transactionIndex: NAT,
        index: NAT,
        ...project({
            utxoId: fields.input?.contractUtxoId,
            balanceRoot: fields.input?.contractBalanceRoot,
            contract: fields.input?.contractContract,
            stateRoot: fields.input?.contractStateRoot,
            txPointer: fields.input?.contractTxPointer
        }, {
            utxoId: BYTES,
            balanceRoot: BYTES,
            stateRoot: BYTES,
            txPointer: STRING,
            contract: BYTES,
        })
    })

    let InputMessage = object({
        transactionIndex: NAT,
        index: NAT,
        ...project({
            sender: fields.input?.messageSender,
            amount: fields.input?.messageAmount,
            data: fields.input?.messageData,
            nonce: fields.input?.messageNonce,
            predicate: fields.input?.messagePredicate,
            predicateData: fields.input?.messagePredicateData,
            predicateGasUsed: fields.input?.messagePredicateGasUsed,
            recipient: fields.input?.messageRecipient,
            witnessIndex: fields.input?.messageWitnessIndex
        }, {
            sender: BYTES,
            recipient: BYTES,
            amount: BIG_NAT,
            nonce: BYTES,
            witnessIndex: NAT,
            predicateGasUsed: BIG_NAT,
            data: BYTES,
            predicate: BYTES,
            predicateData: BYTES,
        })
    })

    let Input = taggedUnion('type', {
        InputCoin,
        InputContract,
        InputMessage
    })

    let CoinOutput = object({
        transactionIndex: NAT,
        index: NAT,
        ...project({
            amount: fields.output?.coinAmount,
            assetId: fields.output?.coinAssetId,
            to: fields.output?.coinTo
        }, {
            to: BYTES,
            amount: BIG_NAT,
            assetId: BYTES
        })
    })

    let ContractOutput = object({
        transactionIndex: NAT,
        index: NAT,
        ...project({
            inputIndex: fields.output?.contractInputIndex,
            balanceRoot: fields.output?.contractBalanceRoot,
            stateRoot: fields.output?.contractStateRoot
        }, {
            inputIndex: NAT,
            balanceRoot: BYTES,
            stateRoot: BYTES
        })
    })

    let ChangeOutput = object({
        transactionIndex: NAT,
        index: NAT,
        ...project({
            amount: fields.output?.changeAmount,
            assetId: fields.output?.changeAssetId,
            to: fields.output?.changeTo
        }, {
            to: BYTES,
            amount: BIG_NAT,
            assetId: BYTES
        })
    })

    let VariableOutput = object({
        transactionIndex: NAT,
        index: NAT,
        ...project({
            to: fields.output?.variableTo,
            amount: fields.output?.variableAmount,
            assetId: fields.output?.variableAssetId
        }, {
            to: BYTES,
            amount: BIG_NAT,
            assetId: BYTES
        })
    })

    let ContractCreated = object({
        transactionIndex: NAT,
        index: NAT,
        ...project({
            contract: fields.output?.contractCreatedContractId,
            stateRoot: fields.output?.contractCreatedStateRoot
        }, {
            contract: object({
                id: BYTES,
                bytecode: BYTES,
                salt: BYTES
            }),
            stateRoot: BYTES
        })
    })

    let Ouput = taggedUnion('type', {
        CoinOutput,
        ContractOutput,
        ChangeOutput,
        VariableOutput,
        ContractCreated
    })

    return object({
        header: BlockHeader,
        transactions: option(array(Transaction)),
        receipts: option(array(Receipt)),
        inputs: option(array(Input)),
        outputs: option(array(Ouput)),
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


export function isEmpty(obj: object): boolean {
    for (let _ in obj) {
        return false
    }
    return true
}
