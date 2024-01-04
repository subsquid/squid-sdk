export interface BlockHeader {
    height: number
    hash: string
    parentHash: string
    txTrieRoot: string
    version: number
    timestamp: number
    witnessAddress: string
    witnessSignature: string
}


export interface Log {
    logIndex: number
    transactionHash: string
    address: string
    data: string
    topics: string[]
}


export interface Transaction {
    hash: string
    ret?: string
    signature: string[]
    type: string
    parameter: any
    permissionId?: number
    refBlockBytes: string
    refBlockHash: string
    feeLimit?: number
    expiration: number
    timestamp?: number
    rawDataHex: string
    fee?: number
    contractResult?: string
    contractAddress?: string
    resMessage?: string
    withdrawAmount?: number
    unfreezeAmount?: number
    withdrawExpireAmount?: number
    cancelUnfreezeV2Amount?: Record<string, number>
    result?: string
    energyFee?: number
    energyUsage?: number
    energyUsageTotal?: number
    netUsage?: number
    netFee?: number
    originEnergyUsage?: number
    energyPenaltyTotal?: number
}


export interface CallValueInfo {
    callValue?: number
    tokenId?: string
}


export interface InternalTransaction {
    transactionHash: string
    hash: string
    callerAddress: string
    transferToAddress: string
    callValueInfo: CallValueInfo[]
    note: string
    rejected?: boolean
    extra?: string
}


export interface Block {
    header: BlockHeader,
    logs?: Log[]
    transactions?: Transaction[]
    internalTransactions?: InternalTransaction[]
}
