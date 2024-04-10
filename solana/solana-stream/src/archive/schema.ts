import {AddressTableLookup} from '@subsquid/solana-rpc-data'
import {weakMemo} from '@subsquid/util-internal'
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
    STRING
} from '@subsquid/util-internal-validation'
import {project} from '../data/fields'
import {FieldSelection} from '../data/model'


export const getDataSchema = weakMemo((fields: FieldSelection) => {
    let BlockHeader = object({
        number: NAT,
        hash: B58,
        parentHash: B58,
        ...project(fields.block, {
            slot: NAT,
            parentSlot: NAT,
            timestamp: NAT
        })
    })

    let Transaction = object({
        transactionIndex: NAT,
        ...project(fields.transaction, {
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
    })

    let Instruction = object({
        transactionIndex: NAT,
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

    let LogMessage = object({
        transactionIndex: NAT,
        logIndex: NAT,
        instructionAddress: array(NAT),
        ...project(fields.log, {
            programId: B58,
            kind: oneOf({
                log: constant('log'),
                data: constant('data'),
                other: constant('other')
            }),
            message: STRING
        })
    })

    let Balance = object({
        transactionIndex: NAT,
        account: B58,
        ...project(fields.balance, {
            pre: BIG_NAT,
            post: BIG_NAT
        })
    })

    let TokenBalance = object({
        transactionIndex: NAT,
        account: B58,
        ...project(fields.tokenBalance, {
            mint: B58,
            decimals: NAT,
            programId: option(B58),
            preOwner: option(B58),
            postOwner: option(B58),
            pre: option(BIG_NAT),
            post: option(BIG_NAT)
        })
    })

    let Reward = object({
        pubkey: B58,
        ...project(fields.reward, {
            lamports: BIG_NAT,
            postBalance: BIG_NAT,
            rewardType: option(STRING),
            commission: option(NAT)
        })
    })

    return object({
        header: BlockHeader,
        transactions: option(array(Transaction)),
        instructions: option(array(Instruction)),
        logs: option(array(LogMessage)),
        balances: option(array(Balance)),
        tokenBalances: option(array(TokenBalance)),
        rewards: option(array(Reward))
    })
})
