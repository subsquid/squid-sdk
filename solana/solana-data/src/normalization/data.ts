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
     * Transaction position in block
     */
    transactionIndex: number
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
    computeUnitsConsumed: bigint
    fee: bigint
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
    programId: Base58Bytes
    accounts: Base58Bytes[]
    data: Base58Bytes
    // execution result extracted from logs
    computeUnitsConsumed?: bigint
    error?: string
    /**
     * `true` when transaction completed successfully, `false` otherwise
     */
    isCommitted: boolean
}


export interface LogMessage {
    transactionIndex: number
    logIndex: number
    instructionAddress: number[]
    programId: Base58Bytes
    kind: 'log' | 'data' | 'other'
    message: string
}


export interface Balance {
    transactionIndex: number
    account: Base58Bytes
    pre: bigint
    post: bigint
}


export interface TokenBalance {
    transactionIndex: number
    account: Base58Bytes
    mint: Base58Bytes
    owner?: Base58Bytes
    programId?: Base58Bytes
    decimals: number
    pre: bigint
    post: bigint
}


export interface Reward {
    pubkey: Base58Bytes
    lamports: bigint
    postBalance: bigint
    rewardType?: string
    commission?: number
}


export interface Block {
    header: BlockHeader
    transactions: Transaction[]
    instructions: Instruction[]
    logs: LogMessage[]
    balances: Balance[]
    tokenBalances: TokenBalance[]
    rewards?: Reward[]
}
