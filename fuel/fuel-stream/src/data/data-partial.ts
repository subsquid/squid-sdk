import type * as data from '@subsquid/fuel-normalization'
import type {MakePartial} from './util'


export type BlockRequiredFields = 'height' | 'hash'
export type TransactionRequiredFields = 'index'
export type ReceiptRequiredFields = 'transactionIndex' | 'index'
export type InputRequiredFields = 'transactionIndex' | 'index' | 'type'
export type OutputRequiredFields = 'transactionIndex' | 'index' | 'type'


export type PartialBlockHeader = MakePartial<data.BlockHeader, BlockRequiredFields>
export type PartialTransaction = MakePartial<data.Transaction, TransactionRequiredFields>
export type PartialReceipt = MakePartial<data.Receipt, ReceiptRequiredFields>
export type PartialInput = MakePartial<data.TransactionInput, InputRequiredFields>
export type PartialOutput = MakePartial<data.TransactionOutput, OutputRequiredFields>


export interface PartialBlock {
    header: PartialBlockHeader
    transactions?: PartialTransaction[]
    receipts?: PartialReceipt[]
    inputs?: PartialInput[]
    outputs?: PartialOutput[]
}
