import {TransactionType} from '@subsquid/starknet-normalization'
import {FieldSelection} from './model'

export interface DataRequest {
    fields?: FieldSelection
    includeAllBlocks?: boolean
    transactions?: TransactionRequest[]
    events?: EventRequest[]
}

export interface TransactionRequest {
    contractAddress?: string[]
    senderAddress?: string[]
    type?: TransactionType[]
    firstNonce?: number
    lastNonce?: number
    events?: boolean
}

export interface EventRequest {
    fromAddress?: string[]
    key0?: string[]
    key1?: string[]
    key2?: string[]
    key3?: string[]
    transaction?: boolean
}
