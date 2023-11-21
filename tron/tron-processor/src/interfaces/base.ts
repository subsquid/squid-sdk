export interface BlockHeader_ {
    height: number
    hash: string
    parentHash: string
    txTrieRoot: string
    version: number
    timestamp: number
    witnessAddress: string
    witnessSignature: string
}


export interface Log_ {
    logIndex: number
    transactionHash: string
    address: string
    data: string
    topics: string[]
}


export interface Transaction_ {
    hash: string
    ret: string
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
    contractResult: string
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


export interface InternalTransaction_ {
    transactionHash: string
    hash: string
    callerAddress: string
    transferToAddress: string
    callValueInfo: {
        callValue?: number
        tokenId?: string
    }[]
    note: string
    rejected?: boolean
    extra?: string
}
