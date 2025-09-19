import {
    ANY_OBJECT,
    array,
    B58,
    BIG_NAT,
    BOOLEAN,
    BYTES,
    constant,
    NAT,
    nullable,
    object,
    oneOf,
    option,
    STRING,
    taggedUnion
} from '@subsquid/util-internal-validation'
import {FieldSelection} from './types'
import {project} from './util'


export const getDataNotificationSchema = (fields: FieldSelection) => {
    let {parentSlot, ...restBlockFields} = fields.block ?? {}

    let BlockHeader = object(
        project({
            parentNumber: parentSlot,
            ...restBlockFields
        }, {
            hash: B58,
            parentHash: B58,
            parentNumber: NAT,
            timestamp: NAT
        })
    )

    let Transaction = object(
        project(fields.transaction, {
            version: oneOf({
                legacy: constant('legacy'),
                versionNumber: NAT
            }),
            accountKeys: array(B58),
            addressTableLookups: array(AddressTableLookup),
            numReadonlySignedAccounts: NAT,
            numReadonlyUnsignedAccounts: NAT,
            numRequiredSignatures: NAT,
            recentBlockhash: B58,
            signatures: array(B58),
            err: nullable(ANY_OBJECT),
            computeUnitsConsumed: BIG_NAT,
            fee: BIG_NAT,
            loadedAddresses: option(object({
                readonly: array(B58),
                writable: array(B58)
            })),
            hasDroppedLogMessages: BOOLEAN
        })
    )

    let Instruction = object({
        instructionAddress: array(NAT),
        ...project(fields.instruction, {
            programId: B58,
            accounts: array(B58),
            data: B58,
            computeUnitsConsumed: option(BIG_NAT),
            d1: BYTES,
            d2: BYTES,
            d4: BYTES,
            d8: BYTES,
            error: option(STRING),
            isCommitted: BOOLEAN,
            hasDroppedLogMessages: BOOLEAN
        })
    })

    let Balance = object({
        account: B58,
        ...project(fields.balance, {
            pre: BIG_NAT,
            post: BIG_NAT
        })
    })

    let TokenBalance = object({
        account: B58,
        ...project(fields.tokenBalance, {
            preProgramId: option(B58),
            postProgramId: option(B58),
            preMint: option(B58),
            postMint: option(B58),
            preDecimals: option(NAT),
            postDecimals: option(NAT),
            preOwner: option(B58),
            postOwner: option(B58),
            preAmount: option(BIG_NAT),
            postAmount: option(BIG_NAT)
        })
    })

    let TransactionNotification = object({
        slot: NAT,
        transactionIndex: NAT,
        transaction: option(Transaction),
        instructions: option(array(Instruction)),
        balances: option(array(Balance)),
        tokenBalances: option(array(TokenBalance)),
    })

    let BlockNotification = object({
        slot: NAT,
        header: option(BlockHeader)
    })

    return taggedUnion('type', {
        block: BlockNotification,
        transaction: TransactionNotification
    })
}


const AddressTableLookup = object({
    accountKey: B58,
    readonlyIndexes: array(NAT),
    writableIndexes: array(NAT)
})
