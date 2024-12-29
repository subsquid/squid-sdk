import {FieldSelection} from './data.js'

export interface DataRequest {
    fields?: FieldSelection
    includeAllBlocks?: boolean
    transactions?: TransactionRequest[]
    sourceOutputs?: boolean
    fee?: boolean
}

export interface TransactionRequest {
    // address?: string
    // token?: string
}
