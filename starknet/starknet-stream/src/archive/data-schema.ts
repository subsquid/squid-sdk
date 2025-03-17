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
import {project} from '../data/fields'


let FELT = BYTES

export const getDataSchema = weakMemo((fields: FieldSelection) => {
    let BlockHeader = object({
        number: NAT,
        hash: FELT,
        ...project(fields.block, {
            parentHash: option(FELT),
            status: option(STRING),
            newRoot: option(FELT),
            timestamp: NAT,
            sequencerAddress: option(FELT)
        })
    })

    let ResourceBounds = object({
        l1GasMaxAmount: NAT,
        l1GasMaxPricePerUnit: NAT,
        l2GasMaxAmount: NAT,
        l2GasMaxPricePerUnit: NAT
    })

    let ActualFee = object({
        amount: STRING,
        unit: STRING
    })

    let Transaction = object({
        transactionIndex: NAT,
        ...project(fields.transaction, {
            blockNumber: option(NAT),
            transactionHash: option(FELT),
            contractAddress: option(FELT),
            entryPointSelector: option(FELT),
            calldata: option(array(FELT)),
            maxFee: option(FELT),
            type: oneOf({
                INVOKE: constant('INVOKE'),
                DECLARE: constant('DECLARE'),
                DEPLOY_ACCOUNT: constant('DEPLOY_ACCOUNT'),
                DEPLOY: constant('DEPLOY'),
                L1_HANDLER: constant('L1_HANDLER')
            }),
            senderAddress: option(FELT),
            version: STRING,
            signature: option(array(FELT)),
            nonce: option(NAT),
            classHash: option(FELT),
            compiledClassHash: option(FELT),
            contractAddressSalt: option(FELT),
            constructorCalldata: option(array(FELT)),
            resourceBounds: option(ResourceBounds),
            tip: option(FELT),
            paymasterData: option(array(FELT)),
            accountDeploymentData: option(array(FELT)),
            nonceDataAvailabilityMode: option(STRING),
            feeDataAvailabilityMode: option(STRING),
            messageHash: option(FELT),
            actualFee: option(ActualFee),
            finalityStatus: option(STRING)
        })
    })

    let Event = object({
        transactionIndex: NAT,
        eventIndex: NAT,
        ...project(fields.event, {
            blockNumber: option(NAT),
            fromAddress: option(FELT),
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