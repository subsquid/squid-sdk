import {Base58Bytes} from '../base'


export interface BlockHeader {
    hash: Base58Bytes
    height: number
    slot: number
    parentSlot: number
    parentHash: Base58Bytes
    timestamp: number
}


export interface Transaction {
    /**
     * Transaction index in block
     */
    index: number
    version: 'legacy' | number
    // transaction message
    accountKeys: Base58Bytes[]
    addressTableLookups: AddressTableLookup[]
    numReadonlySignedAccounts: number
    numReadonlyUnsignedAccounts: number
    numRequiredSignatures: number
    recentBlockhash: Base58Bytes
    signatures: Base58Bytes[]
    // meta fields
    err: null | object
    computeUnitsConsumed: number
    fee: number
    logMessages: string[]
    loadedAddresses: {
        readonly: Base58Bytes[]
        writable: Base58Bytes[]
    }
}


export interface AddressTableLookup {
    accountKey: Base58Bytes
    readonlyIndexes: number[]
    writableIndexes: number[]
}


export interface Instruction {
    transactionIndex: number
    instructionAddress: number[]
    accounts: Base58Bytes[]
    programId: Base58Bytes
    data: Base58Bytes
}


export interface Block {
    header: BlockHeader
    transactions: Transaction[]
    instructions: Instruction[]
}
