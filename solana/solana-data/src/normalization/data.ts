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
    loadedAddresses: {
        readonly: Base58Bytes[]
        writable: Base58Bytes[]
    }
    logMessagesTruncated: boolean
}


export interface AddressTableLookup {
    accountKey: Base58Bytes
    readonlyIndexes: number[]
    writableIndexes: number[]
}


export interface Instruction {
    transactionIndex: number
    instructionAddress: number[]
    programId: Base58Bytes
    accounts: Base58Bytes[]
    data: Base58Bytes
    // execution result extracted from logs
    computeUnitsConsumed?: number
    error?: string
}


export interface LogMessage {
    transactionIndex: number
    instructionAddress: number[]
    programId: Base58Bytes
    kind: 'log' | 'data' | 'other'
    message: string
}


export interface Block {
    header: BlockHeader
    transactions: Transaction[]
    instructions: Instruction[]
    log: LogMessage[]
}
