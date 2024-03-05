import {
    ANY_NAT,
    array,
    B58,
    B64,
    BIG_NAT,
    constant,
    GetSrcType,
    INT,
    NAT,
    nullable,
    object,
    oneOf,
    option,
    STRING,
    tuple
} from '@subsquid/util-internal-validation'
import {Base58Bytes} from '../base'


export const Instruction = object({
    accounts: array(NAT),
    data: B58,
    programIdIndex: NAT,
    stackHeight: nullable(NAT)
})


export type Instruction = GetSrcType<typeof Instruction>


export const AddressTableLookup = object({
    accountKey: B58,
    readonlyIndexes: array(NAT),
    writableIndexes: array(NAT)
})


export type AddressTableLookup = GetSrcType<typeof AddressTableLookup>


export const TransactionMessage = object({
    accountKeys: array(B58),
    addressTableLookups: option(array(AddressTableLookup)),
    header: object({
        numReadonlySignedAccounts: NAT,
        numReadonlyUnsignedAccounts: NAT,
        numRequiredSignatures: NAT
    }),
    instructions: array(Instruction),
    recentBlockhash: B58
})


export type TransactionMessage = GetSrcType<typeof TransactionMessage>


export const TokenBalance = object({
    accountIndex: NAT,
    mint: B58,
    owner: option(B58),
    programId: option(B58),
    uiTokenAmount: object({
        amount: BIG_NAT,
        decimals: NAT
    })
})


export type TokenBalance = GetSrcType<typeof TokenBalance>


export const Reward = object({
    pubkey: B58,
    lamports: INT,
    postBalance: ANY_NAT,
    rewardType: option(STRING),
    commission: option(NAT)
})


export type Reward = GetSrcType<typeof Reward>


export const TransactionMeta = object({
    computeUnitsConsumed: option(ANY_NAT),
    err: nullable(object({})),
    fee: ANY_NAT,
    preBalances: array(ANY_NAT),
    postBalances: array(ANY_NAT),
    preTokenBalances: option(array(TokenBalance)),
    postTokenBalances: option(array(TokenBalance)),
    innerInstructions: option(array(object({
        index: NAT,
        instructions: array(Instruction)
    }))),
    loadedAddresses: option(object({
        readonly: array(B58),
        writable: array(B58)
    })),
    logMessages: array(STRING),
    rewards: option(array(Reward)),
    returnData: option(object({
        programId: B58,
        data: tuple(B64, constant('base64'))
    }))
})


export type TransactionMeta = GetSrcType<typeof TransactionMeta>


export const Transaction = object({
    meta: TransactionMeta,
    transaction: object({
        message: TransactionMessage,
        signatures: array(B58)
    }),
    version: oneOf({
        legacy: constant('legacy'),
        versionNumber: NAT
    })
})


export type Transaction = GetSrcType<typeof Transaction>


export const GetBlock = object({
    blockHeight: nullable(NAT),
    blockTime: nullable(NAT),
    blockhash: B58,
    parentSlot: NAT,
    previousBlockhash: B58,
    transactions: option(array(Transaction)),
    rewards: option(array(Reward))
})


export type GetBlock = GetSrcType<typeof GetBlock>


export interface Block {
    /**
     * `block.blockhash`
     */
    hash: Base58Bytes
    /**
     * `block.blockHeight`
     */
    height: number
    slot: number
    block: GetBlock
}


export interface DataRequest {
    rewards?: boolean
    transactions?: boolean
}


export function getBlockCtx(block: Block) {
    return {
        blockSlot: block.slot,
        blockHeight: block.height,
        blockHash: block.hash
    }
}
