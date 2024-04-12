import {ReceiptType, TransactionType, InputType, OutputType} from '@subsquid/fuel-data/lib/data'
import {FieldSelection} from './data'


export interface DataRequest {
    fields?: FieldSelection
    includeAllBlocks?: boolean
    transactions?: TransactionRequest[]
    receipts?: ReceiptRequest[]
    inputs?: InputRequest[]
    outputs?: OutputRequest[]
}


export interface TransactionRequest {
    type?: TransactionType[]
    receipts?: boolean
    inputs?: boolean
    outputs?: boolean
}


export interface ReceiptRequest {
    type?: ReceiptType[]
    logDataContract?: string[]
    transaction?: boolean
}


export interface InputRequest {
    type?: InputType[]
    coinOwner?: string[]
    coinAssetId?: string[]
    coinPredicate?: string[]
    contractContract?: string[]
    messageSender?: string[]
    messageRecipient?: string[]
    messagePredicate?: string[]
    transaction?: boolean
}


export interface OutputRequest {
    type?: OutputType[]
    transaction?: boolean
}
