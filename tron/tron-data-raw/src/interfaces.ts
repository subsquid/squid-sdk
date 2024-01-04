export interface Log {
    address: string
    data: string
    topics: string[]
}


export interface Contract {
    parameter: {
        value: any
        type_url: string
    }
    type: string
    Permission_id?: number
}


export interface TransactionRawData {
    contract: Contract[]
    ref_block_bytes: string
    ref_block_hash: string
    expiration: number
    fee_limit?: number
    timestamp?: number
}


export interface TransactionReceipt {
    result?: string
    energy_fee?: number
    energy_usage?: number
    energy_usage_total?: number
    net_usage?: number
    net_fee?: number
    origin_energy_usage?: number
    energy_penalty_total?: number
}


export interface CallValueInfo {
    callValue?: number
    tokenId?: string
}


export interface InternalTransaction {
    hash: string
    caller_address: string
    transferTo_address: string
    callValueInfo: CallValueInfo[]
    note: string
    rejected?: boolean
    extra?: string
}


export interface TransactionInfo {
    id: string
    fee?: number
    blockNumber: number
    blockTimeStamp: number
    contractResult: string[]
    contract_address?: string
    receipt: TransactionReceipt
    log?: Log[]
    result?: string
    resMessage?: string
    withdraw_amount?: number
    unfreeze_amount?: number
    internal_transactions?: InternalTransaction[]
    withdraw_expire_amount?: number
    cancel_unfreezeV2_amount?: Record<string, number>
}


export interface TransactionResult {
    contractRet: string
}


export interface Transaction {
    ret?: TransactionResult[]
    signature: string[]
    txID: string
    raw_data: TransactionRawData
    raw_data_hex: string
}


export interface BlockRawData {
    number?: number
    txTrieRoot: string
    witness_address: string
    parentHash: string
    version: number
    timestamp: number
}


export interface BlockHeader {
    raw_data: BlockRawData
    witness_signature: string
}


export interface Block {
    blockID: string
    block_header: BlockHeader
    transactions?: Transaction[]
}


export interface BlockData {
    height: number
    hash: string
    block: Block
    transactionsInfo: TransactionInfo[]
}
