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
    address?: Bytes[]
    topic0?: Bytes[]
    topic1?: Bytes[]
    topic2?: Bytes[]
    topic3?: Bytes[]
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
    owner?: Bytes[]
    to?: Bytes[]
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
    owner?: Bytes[]
    to?: Bytes[]
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
    owner?: Bytes[]
    contract?: Bytes[]
    sighash?: Bytes[]
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
    caller?: Bytes[]
    transferTo?: Bytes[]
}


export interface InternalTransactionRequestRelations {
    transaction?: boolean
}


export interface InternalTransactionRequest {
    where?: InternalTransactionRequestWhere
    include?: InternalTransactionRequestRelations
}
