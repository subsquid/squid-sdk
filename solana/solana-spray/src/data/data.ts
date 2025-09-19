export type Base58Bytes = string;


export interface BlockHeader {
    hash: Base58Bytes
    parentSlot: number
    parentHash: Base58Bytes
    height: number
    timestamp: number
}


export interface Transaction {
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


export interface Balance {
    account: Base58Bytes
    pre: bigint
    post: bigint
}


export type TokenBalance = PreTokenBalance | PostTokenBalance | PrePostTokenBalance


export interface PreTokenBalance {
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
