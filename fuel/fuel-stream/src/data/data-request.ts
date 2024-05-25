import {ReceiptType, TransactionType, InputType, OutputType} from '@subsquid/fuel-normalization'
import {FieldSelection, Bytes} from './model'


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
    contract?: Bytes[]
    transaction?: boolean
}


export interface InputRequest {
    type?: InputType[]
    coinOwner?: Bytes[]
    coinAssetId?: Bytes[]
    contractContractId?: Bytes[]
    messageSender?: Bytes[]
    messageRecipient?: Bytes[]
    transaction?: boolean
}


export interface OutputRequest {
    type?: OutputType[]
    transaction?: boolean
}
