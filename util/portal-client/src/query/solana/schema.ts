import {
    ANY_OBJECT,
    array,
    B58,
    BIG_NAT,
    BOOLEAN,
    constant,
    NAT,
    nullable,
    object,
    oneOf,
    option,
    STRING,
    withDefault,
} from '@subsquid/util-internal-validation'
import {project} from '../util'
import type {FieldSelection} from './fields'

export function patchQueryFields(fields: FieldSelection): FieldSelection {
    fields = {...fields}
    let {height, ...block} = (fields.block as any) ?? {}
    fields.block = {
        ...block,
        number: true,
        hash: true,
        parentHash: true,
    }
    return fields
}

export function getBlockSchema(fields: FieldSelection) {
    return object({
        header: getBlockHeaderSchema(fields),
        transactions: withDefault([], array(getTransactionSchema(fields))),
        instructions: withDefault([], array(getInstructionSchema(fields))),
        logs: withDefault([], array(getLogSchema(fields))),
        balances: withDefault([], array(getBalanceSchema(fields))),
        tokenBalances: withDefault([], array(getTokenBalanceSchema(fields))),
        rewards: withDefault([], array(getRewardSchema(fields))),
    })
}

function getBlockHeaderSchema(fields: FieldSelection) {
    return object({
        number: NAT,
        hash: B58,
        parentHash: B58,
        ...project(fields.block, {
            parentSlot: NAT,
            height: NAT,
            timestamp: NAT,
        }),
    })
}

const AddressTableLookup = object({
    accountKey: B58,
    readonlyIndexes: array(NAT),
    writableIndexes: array(NAT),
})

function getTransactionSchema(fields: FieldSelection) {
    return object(
        project(fields.transaction, {
            transactionIndex: NAT,
            version: oneOf({
                legacy: constant('legacy'),
                versionNumber: NAT,
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
            loadedAddresses: option(
                object({
                    readonly: array(B58),
                    writable: array(B58),
                })
            ),
            hasDroppedLogMessages: BOOLEAN,
        })
    )
}

function getInstructionSchema(fields: FieldSelection) {
    return object(
        project(fields.instruction, {
            transactionIndex: NAT,
            instructionAddress: array(NAT),
            programId: B58,
            accounts: array(B58),
            data: B58,
            computeUnitsConsumed: option(BIG_NAT),
            error: option(STRING),
            isCommitted: BOOLEAN,
            hasDroppedLogMessages: BOOLEAN,
        })
    )
}

function getLogSchema(fields: FieldSelection) {
    return object(
        project(fields.log, {
            transactionIndex: NAT,
            logIndex: NAT,
            instructionAddress: array(NAT),
            programId: B58,
            kind: oneOf({
                log: constant('log'),
                data: constant('data'),
                other: constant('other'),
            }),
            message: STRING,
        })
    )
}

function getBalanceSchema(fields: FieldSelection) {
    return object(
        project(fields.balance, {
            transactionIndex: NAT,
            account: B58,
            pre: BIG_NAT,
            post: BIG_NAT,
        })
    )
}

function getTokenBalanceSchema(fields: FieldSelection) {
    return object(
        project(fields.tokenBalance, {
            transactionIndex: NAT,
            account: B58,
            preProgramId: option(B58),
            postProgramId: option(B58),
            preMint: option(B58),
            postMint: option(B58),
            preDecimals: option(NAT),
            postDecimals: option(NAT),
            preOwner: option(B58),
            postOwner: option(B58),
            preAmount: option(BIG_NAT),
            postAmount: option(BIG_NAT),
        })
    )
}

function getRewardSchema(fields: FieldSelection) {
    return object(
        project(fields.reward, {
            pubkey: B58,
            lamports: BIG_NAT,
            postBalance: BIG_NAT,
            rewardType: option(STRING),
            commission: option(NAT),
        })
    )
}
