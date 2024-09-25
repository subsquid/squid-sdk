export interface BlockHeader {
    height: number
    hash: string
    parentHash: string
    txTrieRoot: string
    version?: number
    timestamp: number
    witnessAddress: string
    witnessSignature?: string
}


export interface Log {
    transactionIndex: number
    logIndex: number
    address: string
    data?: string
    topics: string[]
}


export interface TransactionResult {
    contractRet?: string
}


export interface Transaction {
    transactionIndex: number
    hash: string
    ret?: TransactionResult[]
    signature?: string[]
    type: string
    parameter: any
    permissionId?: number
    refBlockBytes?: string
    refBlockHash?: string
    feeLimit?: bigint
    expiration?: number
    timestamp?: number
    rawDataHex: string
    fee?: bigint
    contractResult?: string
    contractAddress?: string
    resMessage?: string
    withdrawAmount?: bigint
    unfreezeAmount?: bigint
    withdrawExpireAmount?: bigint
    cancelUnfreezeV2Amount?: Record<string, bigint>
    result?: string
    energyFee?: bigint
    energyUsage?: bigint
    energyUsageTotal?: bigint
    netUsage?: bigint
    netFee?: bigint
    originEnergyUsage?: bigint
    energyPenaltyTotal?: bigint
    _transferContractOwner?: string
    _transferContractTo?: string
    _transferAssetContractOwner?: string
    _transferAssetContractTo?: string
    _transferAssetContractAsset?: string
    _triggerSmartContractOwner?: string
    _triggerSmartContractContract?: string
    _triggerSmartContractSighash?: string
}


export interface CallValueInfo {
    callValue?: bigint
    tokenId?: string
}


export interface InternalTransaction {
    transactionIndex: number
    internalTransactionIndex: number
    hash: string
    callerAddress: string
    transferToAddress?: string
    callValueInfo: CallValueInfo[]
    note: string
    rejected?: boolean
    extra?: string
}


export interface Block {
    header: BlockHeader,
    logs: Log[]
    transactions: Transaction[]
    internalTransactions: InternalTransaction[]
}
