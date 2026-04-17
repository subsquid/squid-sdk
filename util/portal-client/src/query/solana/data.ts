import type {Base58Bytes} from '../common/data'

export interface BlockHeader {
    number: number
    hash: Base58Bytes
    parentNumber: number
    parentHash: Base58Bytes
    height: number
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
    hasDroppedLogMessages: boolean
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
    hasDroppedLogMessages: boolean
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

export type TokenBalance = PreTokenBalance | PostTokenBalance | PrePostTokenBalance

export interface PreTokenBalance {
    transactionIndex: number
    account: Base58Bytes

    preProgramId?: Base58Bytes
    preMint: Base58Bytes
    preDecimals: number
    preOwner?: Base58Bytes
    preAmount: bigint

    postProgramId?: undefined
    postMint?: undefined
    postDecimals?: undefined
    postOwner?: undefined
    postAmount?: undefined
}

export interface PostTokenBalance {
    transactionIndex: number
    account: Base58Bytes

    preProgramId?: undefined
    preMint?: undefined
    preDecimals?: undefined
    preOwner?: undefined
    preAmount?: undefined

    postProgramId?: Base58Bytes
    postMint: Base58Bytes
    postDecimals: number
    postOwner?: Base58Bytes
    postAmount: bigint
}

export interface PrePostTokenBalance {
    transactionIndex: number
    account: Base58Bytes
    preProgramId?: Base58Bytes
    preMint: Base58Bytes
    preDecimals: number
    preOwner?: Base58Bytes
    preAmount: bigint
    postProgramId?: Base58Bytes
    postMint: Base58Bytes
    postDecimals: number
    postOwner?: Base58Bytes
    postAmount: bigint
}

export interface Reward {
    pubkey: Base58Bytes
    lamports: bigint
    postBalance: bigint
    rewardType?: string
    commission?: number
}
