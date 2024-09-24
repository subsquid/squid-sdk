import {FieldSelection, Bytes} from './model'


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


export interface LogRequestWhere {
    address?: string[]
    topic0?: string[]
    topic1?: string[]
    topic2?: string[]
    topic3?: string[]
}


export interface LogRequestRelations {
    transaction?: boolean
}


export interface LogRequest {
    where?: LogRequestWhere
    include?: LogRequestRelations
}


export interface TransactionRequestWhere {
    type?: string[]
}


export interface TransactionRequestRelations {
    logs?: boolean
    internalTransactions?: boolean
}


export interface TransactionRequest {
    where?: TransactionRequestWhere
    include?: TransactionRequestRelations
}


export interface TransferTransactionRequestWhere {
    owner?: string[]
    to?: string[]
}


export interface TransferTransactionRequestRelations {
    logs?: boolean
    internalTransactions?: boolean
}


export interface TransferTransactionRequest {
    where?: TransferTransactionRequestWhere
    include?: TransferTransactionRequestRelations
}


export interface TransferAssetTransactionRequestWhere {
    owner?: string[]
    to?: string[]
    asset?: string[]
}


export interface TransferAssetTransactionRequestRelations {
    logs?: boolean
    internalTransactions?: boolean
}


export interface TransferAssetTransactionRequest {
    where?: TransferAssetTransactionRequestWhere
    include?: TransferAssetTransactionRequestRelations
}


export interface TriggerSmartContractTransactionRequestWhere {
    owner?: string[]
    contract?: string[]
    sighash?: string[]
}


export interface TriggerSmartContractTransactionRequestRelations {
    logs?: boolean
    internalTransactions?: boolean
}


export interface TriggerSmartContractTransactionRequest {
    where?: TriggerSmartContractTransactionRequestWhere
    include?: TriggerSmartContractTransactionRequestRelations
}


export interface InternalTransactionRequestWhere {
    caller?: string[]
    transferTo?: string[]
}


export interface InternalTransactionRequestRelations {
    transaction?: boolean
}


export interface InternalTransactionRequest {
    where?: InternalTransactionRequestWhere
    include?: InternalTransactionRequestRelations
}
