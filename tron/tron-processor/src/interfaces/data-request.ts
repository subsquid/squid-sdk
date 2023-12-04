import type {FieldSelection} from './data'


export interface DataRequest {
    fields?: FieldSelection
    includeAllBlocks?: boolean
    logs?: LogRequest[]
    transactions?: TransactionRequest[]
    transferTransactions?: TransferTransactionRequest[]
    transferAssetTransactions?: TransferAssetTransactionRequest[]
    triggerSmartContractTransactions?: TriggerSmartContractTransactionRequest[]
    internalTransactions?: InternalTransactionRequest[]
}


export interface LogRequest {
    address?: string[]
    topic0?: string[]
    topic1?: string[]
    topic2?: string[]
    topic3?: string[]
    transaction?: boolean
}


export interface TransactionRequest {
    type?: string[]
    logs?: boolean
    internalTransactions?: boolean
}


export interface TransferTransactionRequest {
    owner?: string[]
    to?: string[]
    logs?: boolean
    internalTransactions?: boolean
}


export interface TransferAssetTransactionRequest {
    owner?: string[]
    to?: string[]
    asset?: string[]
    logs?: boolean
    internalTransactions?: boolean
}


export interface TriggerSmartContractTransactionRequest {
    owner?: string[]
    contract?: string[]
    sighash?: string[]
    logs?: boolean
    internalTransactions?: boolean
}


export interface InternalTransactionRequest {
    caller?: string[]
    transferTo?: string[]
    transaction?: boolean
}
