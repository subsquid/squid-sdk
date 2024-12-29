import {FieldSelection} from '../interfaces/data.js'
import {DataRequest} from '../interfaces/data-request.js'
import {BchTransaction} from '../interfaces/bch.js'
import {DataRequest as RpcDataRequest} from './rpc-data.js'


export interface MappingRequest extends RpcDataRequest {
    fields: FieldSelection
    transactionList: boolean
    dataRequest: DataRequest
}


export function toMappingRequest(req?: DataRequest): MappingRequest {
    let txs = transactionsRequested(req)
    return {
        fields: req?.fields || {},
        transactionList: txs,
        transactions: !!req?.transactions?.length || txs && isRequested(TX_FIELDS, req?.fields?.transaction),
        dataRequest: req || {}
    }
}


function transactionsRequested(req?: DataRequest): boolean {
    if (req == null) return false
    if (req.transactions?.length) return true
    return false
}


const TX_FIELDS: {[K in Exclude<keyof BchTransaction, 'hash'>]: true} = {
    inputs: true,
    locktime: true,
    outputs: true,
    size: true,
    sourceOutputs: true,
    transactionIndex: true,
    version: true,
    fee: true,
}


function isRequested(set: Record<string, boolean>, selection?: Record<string, boolean>): boolean {
    if (selection == null) return false
    for (let key in selection) {
        if (set[key] && selection[key]) return true
    }
    return false
}
