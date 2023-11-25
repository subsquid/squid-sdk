import {FieldSelection} from '../interfaces/data'
import {DataRequest} from '../interfaces/data-request'
import {_EvmTx, _EvmTxReceipt} from '../interfaces/evm'
import {DataRequest as RpcDataRequest} from './rpc-data'


export interface MappingRequest extends RpcDataRequest {
    fields: FieldSelection
    transactionList: boolean
    logList: boolean
}


export function toMappingRequest(req?: DataRequest): MappingRequest {
    let txs = transactionsRequested(req)
    let logs = logsRequested(req)
    let receipts = txs && isRequested(TX_RECEIPT_FIELDS, req?.fields?.transaction)
    return {
        fields: req?.fields || {},
        transactionList: txs,
        logList: logs,
        transactions: txs && isRequested(TX_FIELDS, req?.fields?.transaction),
        logs: logs && !receipts,
        receipts,
        traces: tracesRequested(req),
        stateDiffs: stateDiffsRequested(req)
    }
}


function transactionsRequested(req?: DataRequest): boolean {
    if (req == null) return false
    if (req.transactions?.length) return true
    for (let items of [req.logs, req.traces, req.stateDiffs]) {
        if (items) {
            for (let it of items) {
                if (it.transaction) return true
            }
        }
    }
    return false
}


function logsRequested(req?: DataRequest): boolean {
    if (req == null) return false
    if (req.logs?.length) return true
    if (req.transactions) {
        for (let tx of req.transactions) {
            if (tx.logs) return true
        }
    }
    return false
}


function tracesRequested(req?: DataRequest): boolean {
    if (req == null) return false
    if (req.traces?.length) return true
    if (req.transactions) {
        for (let tx of req.transactions) {
            if (tx.traces) return true
        }
    }
    return false
}


function stateDiffsRequested(req?: DataRequest): boolean {
    if (req == null) return false
    if (req.stateDiffs?.length) return true
    if (req.transactions) {
        for (let tx of req.transactions) {
            if (tx.stateDiffs) return true
        }
    }
    return false
}


const TX_FIELDS: {[K in Exclude<keyof _EvmTx, 'hash'>]: true} = {
    from: true,
    to: true,
    gas: true,
    gasPrice: true,
    maxFeePerGas: true,
    maxPriorityFeePerGas: true,
    input: true,
    nonce: true,
    value: true,
    v: true,
    r: true,
    s: true,
    yParity: true,
    chainId: true
}


const TX_RECEIPT_FIELDS: {[K in keyof _EvmTxReceipt]: true} = {
    gasUsed: true,
    cumulativeGasUsed: true,
    effectiveGasPrice: true,
    contractAddress: true,
    type: true,
    status: true
}


function isRequested(set: Record<string, boolean>, selection?: Record<string, boolean>): boolean {
    if (selection == null) return false
    for (let key in selection) {
        if (set[key] && selection[key]) return true
    }
    return false
}
