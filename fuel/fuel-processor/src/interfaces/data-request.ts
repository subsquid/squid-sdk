import {ReceiptType, TransactionType} from '@subsquid/fuel-data/lib/data'
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
    type: ReceiptType[]
    logDataContract: string[]
    transaction?: boolean
}


export interface InputRequest {
    transaction?: boolean
}


export interface OutputRequest {
    transaction?: boolean
}
