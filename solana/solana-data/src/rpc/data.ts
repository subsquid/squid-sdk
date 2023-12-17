import {
    array,
    B58,
    constant,
    GetSrcType,
    NAT,
    nullable,
    object,
    oneOf,
    option,
    STRING
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


export const TransactionMeta = object({
    computeUnitsConsumed: NAT,
    err: nullable(object({})),
    fee: NAT,
    innerInstructions: option(array(object({
        index: NAT,
        instructions: array(Instruction)
    }))),
    loadedAddresses: option(object({
        readonly: array(B58),
        writable: array(B58)
    })),
    logMessages: array(STRING),
})


export type TransactionMeta = GetSrcType<typeof TransactionMeta>


export const Transaction = object({
    meta: nullable(TransactionMeta),
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
    transactions: option(array(Transaction))
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
