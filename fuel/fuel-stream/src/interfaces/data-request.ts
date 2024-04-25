import {ReceiptType, TransactionType, InputType, OutputType} from '@subsquid/fuel-data/lib/data'
import {FieldSelection, Bytes} from './data'


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
    logDataContract?: Bytes[]
    transaction?: boolean
}


export interface InputRequest {
    type?: InputType[]
    coinOwner?: Bytes[]
    coinAssetId?: Bytes[]
    contractContract?: Bytes[]
    messageSender?: Bytes[]
    messageRecipient?: Bytes[]
    transaction?: boolean
}


export interface OutputRequest {
    type?: OutputType[]
    transaction?: boolean
}
