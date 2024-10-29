import {EntityFilter, FilterBuilder} from '@subsquid/util-internal-processor-tools'
import {assertNotNull, groupBy, weakMemo} from '@subsquid/util-internal'
import {getRequestAt, RangeRequest} from '@subsquid/util-internal-range'
import {Block, InternalTransaction, Log, Transaction} from '@subsquid/tron-normalization'
import {DataRequest, LogRequestRelations, TransactionRequestRelations, InternalTransactionRequestRelations} from '../data/data-request'


class IncludeSet {
    public readonly logs = new Set<Log>()
    public readonly transactions = new Set<Transaction>()
    public readonly internalTransactions = new Set<InternalTransaction>()

    addLog(log?: Log): void {
        if (log) {
            this.logs.add(log)
        }
    }

    addTransaction(tx?: Transaction): void {
        if (tx) {
            this.transactions.add(tx)
        }
    }

    addInternalTransaction(internalTx?: InternalTransaction): void {
        if (internalTx) {
            this.internalTransactions.add(internalTx)
        }
    }
}


function buildLogFilter(dataRequest: DataRequest): EntityFilter<Log, LogRequestRelations> {
    let logs = new EntityFilter<Log, LogRequestRelations>()

    dataRequest.logs?.forEach(req => {
        let where = req.where || {}
        let filter = new FilterBuilder<Log>()
        filter.propIn('address', where.address)
        filter.getIn(log => assertNotNull(log.topics)[0], where.topic0)
        filter.getIn(log => assertNotNull(log.topics)[1], where.topic1)
        filter.getIn(log => assertNotNull(log.topics)[2], where.topic2)
        filter.getIn(log => assertNotNull(log.topics)[3], where.topic3)
        logs.add(filter, req.include ?? {})
    })

    return logs
}


function buildTransactionFilter(dataRequest: DataRequest): EntityFilter<Transaction, TransactionRequestRelations> {
    let transactions = new EntityFilter<Transaction, TransactionRequestRelations>()

    dataRequest.transactions?.forEach(req => {
        let where = req.where || {}
        let filter = new FilterBuilder<Transaction>()
        filter.propIn('type', where.type)
        transactions.add(filter, req.include ?? {})
    })

    dataRequest.transferTransactions?.forEach(req => {
        let where = req.where || {}
        let filter = new FilterBuilder<Transaction>()
        filter.propIn('type', ['TransferContract'])
        filter.getIn(tx => assertNotNull(tx.parameter.value.to_address), where.to)
        filter.getIn(tx => assertNotNull(tx.parameter.value.owner_address), where.owner)
        transactions.add(filter, req.include ?? {})
    })

    dataRequest.transferAssetTransactions?.forEach(req => {
        let where = req.where || {}
        let filter = new FilterBuilder<Transaction>()
        filter.propIn('type', ['TransferAssetContract'])
        filter.getIn(tx => assertNotNull(tx.parameter.value.asset_name), where.asset)
        filter.getIn(tx => assertNotNull(tx.parameter.value.owner_address), where.owner)
        filter.getIn(tx => assertNotNull(tx.parameter.value.to_address), where.to)
        transactions.add(filter, req.include ?? {})
    })

    dataRequest.triggerSmartContractTransactions?.forEach(req => {
        let where = req.where || {}
        let filter = new FilterBuilder<Transaction>()
        filter.propIn('type', ['TriggerSmartContract'])
        filter.getIn(tx => assertNotNull(tx.parameter.value.contract_address), where.contract)
        filter.getIn(tx => assertNotNull(tx.parameter.value.owner_address), where.owner)
        filter.getIn(tx => toSighash(tx.parameter.value.data), where.sighash)
        transactions.add(filter, req.include ?? {})
    })

    return transactions
}


function buildInternalTransactionFilter(dataRequest: DataRequest): EntityFilter<InternalTransaction, InternalTransactionRequestRelations> {
    let inputs = new EntityFilter<InternalTransaction, InternalTransactionRequestRelations>()

    dataRequest.internalTransactions?.forEach(req => {
        let where = req.where || {}
        let filter = new FilterBuilder<InternalTransaction>()
        filter.propIn('callerAddress', where.caller)
        filter.propIn('transferToAddress', where.transferTo)
        inputs.add(filter, req.include ?? {})
    })

    return inputs
}


const getItemFilter = weakMemo((dataRequest: DataRequest) => {
    return {
        logs: buildLogFilter(dataRequest),
        transactions: buildTransactionFilter(dataRequest),
        internalTransaction: buildInternalTransactionFilter(dataRequest),
    }
})


export function filterBlock(block: Block, dataRequest: DataRequest): void {
    let items = getItemFilter(dataRequest)

    let include = new IncludeSet()

    let transactions = new Map(block.transactions.map(tx => [tx.transactionIndex, tx]))
    let internalTxByTx = groupBy(block.internalTransactions, internalTx => internalTx.transactionIndex)
    let logsByTx = groupBy(block.logs, log => log.transactionIndex)

    if (items.logs.present()) {
        for (let log of block.logs) {
            let rel = items.logs.match(log)
            if (rel == null) continue
            include.addLog(log)
            if (rel.transaction) {
                let tx = assertNotNull(transactions.get(log.transactionIndex))
                include.addTransaction(tx)
            }
        }
    }

    if (items.transactions.present()) {
        for (let tx of block.transactions) {
            let rel = items.transactions.match(tx)
            if (rel == null) continue
            include.addTransaction(tx)
            if (rel.logs) {
                let logs = logsByTx.get(tx.transactionIndex) ?? []
                for (let log of logs) {
                    include.addLog(log)
                }
            }
            if (rel.internalTransactions) {
                let internalTxs = internalTxByTx.get(tx.transactionIndex) ?? []
                for (let internalTx of internalTxs) {
                    include.addInternalTransaction(internalTx)
                }
            }
        }
    }

    if (items.internalTransaction.present()) {
        for (let internalTx of block.internalTransactions) {
            let rel = items.internalTransaction.match(internalTx)
            if (rel == null) continue
            include.addInternalTransaction(internalTx)
            if (rel.transaction) {
                let tx = assertNotNull(transactions.get(internalTx.transactionIndex))
                include.addTransaction(tx)
            }
        }
    }

    block.logs = block.logs.filter(log => include.logs.has(log))
    block.transactions = block.transactions.filter(tx => include.transactions.has(tx))
    block.internalTransactions = block.internalTransactions.filter(internalTx => {
        return include.internalTransactions.has(internalTx)
    })
}


export function filterBlockBatch(requests: RangeRequest<DataRequest>[], blocks: Block[]): void {
    for (let block of blocks) {
        let dataRequest = getRequestAt(requests, block.header.height) || NO_DATA_REQUEST
        filterBlock(block, dataRequest)
    }
}


const NO_DATA_REQUEST: DataRequest = {}


function toSighash(val?: string) {
    if (val && val.length >= 8) {
        return val.slice(0, 8)
    }
}
