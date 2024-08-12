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
import {FieldSelection} from '../data/model'
import {Selector} from '../data/util'



// TODO: should i add separate FELT validator
let FELT = BYTES

export const getDataSchema = weakMemo((fields: FieldSelection) => {
    let BlockHeader = object({
        number: NAT,
        hash: FELT,
        parentHash: FELT,
        ...project(fields.block, {
            status: STRING,
            newRoot: FELT,
            timestamp: NAT,
            sequencerAddress: FELT,
            starknetVersion: STRING,
            l1GasPriceInFri: FELT,
            l1GasPriceInWei: FELT
        })
    })

    let Transaction = object({
        blockNumber: NAT,
        transactionIndex: NAT,
        transactionHash: FELT,
        ...project(fields.transaction, {
            contractAddress: option(FELT),
            entryPointSelector: option(FELT),
            calldata: option(array(FELT)),
            maxFee: option(FELT),
            type: oneOf({
                INVOKE: constant('INVOKE'),
                DECLARE: constant('DECLARE'),
                DEPLOY_ACCOUNT: constant('DEPLOY_ACCOUNT'),
                DEPLOY: constant('DEPLOY')
            }),
            senderAddress: option(FELT),
            version: STRING,
            signature: option(array(FELT)),
            nonce: option(NAT),
            classHash: option(FELT),
            compiledClassHash: option(FELT),
            contractAddressSalt: option(FELT),
            constructorCalldata: option(array(FELT))
        })
    })

    let Event = object({
        blockNumber: NAT,
        transactionIndex: NAT,
        eventIndex: NAT,
        fromAddress: FELT,
        ...project(fields.event, {
            key0: option(FELT),
            key1: option(FELT),
            key2: option(FELT),
            key3: option(FELT),
            restKeys: option(array(FELT)),
            data: array(FELT),
            keysSize: NAT
        })
    })

    return object({
        header: BlockHeader,
        transactions: option(array(Transaction)),
        events: option(array(Event)),
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