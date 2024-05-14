import {EntityFilter, FilterBuilder} from '@subsquid/util-internal-processor-tools'
import {assertNotNull, groupBy, weakMemo} from '@subsquid/util-internal'
import {getRequestAt, RangeRequest} from '@subsquid/util-internal-range'
import {Block, TransactionInput, TransactionOutput, Receipt, Transaction} from '@subsquid/fuel-normalization'
import {DataRequest} from './data/data-request'


class IncludeSet {
    public readonly receipts = new Set<Receipt>()
    public readonly transactions = new Set<Transaction>()
    public readonly inputs = new Set<TransactionInput>()
    public readonly outputs = new Set<TransactionOutput>()

    addReceipt(receipt?: Receipt): void {
        if (receipt) {
            this.receipts.add(receipt)
        }
    }

    addTransaction(tx?: Transaction): void {
        if (tx) {
            this.transactions.add(tx)
        }
    }

    addInput(input?: TransactionInput): void {
        if (input) {
            this.inputs.add(input)
        }
    }

    addOutput(output?: TransactionOutput): void {
        if (output) {
            this.outputs.add(output)
        }
    }
}


interface ReceiptRelations {
    transaction?: boolean
}


interface TransactionRelations {
    receipts?: boolean
    inputs?: boolean
    outputs?: boolean
}


interface InputRelations {
    transaction?: boolean
}


interface OutputRelations {
    transaction?: boolean
}


function buildReceiptFilter(dataRequest: DataRequest): EntityFilter<Receipt, ReceiptRelations> {
    let receipts = new EntityFilter<Receipt, ReceiptRelations>()

    dataRequest.receipts?.forEach(req => {
        let {type, contract, ...relations} = req
        let filter = new FilterBuilder<Receipt>()
        filter.propIn('receiptType', type)
        filter.propIn('contract', contract)
        receipts.add(filter, relations)
    })

    return receipts
}


function buildTransactionFilter(dataRequest: DataRequest): EntityFilter<Transaction, TransactionRelations> {
    let transactions = new EntityFilter<Transaction, TransactionRelations>()

    dataRequest.transactions?.forEach(req => {
        let {type, ...relations} = req
        let filter = new FilterBuilder<Transaction>()
        filter.propIn('type', type)
        transactions.add(filter, relations)
    })

    return transactions
}


function buildInputFilter(dataRequest: DataRequest): EntityFilter<TransactionInput, InputRelations> {
    let inputs = new EntityFilter<TransactionInput, InputRelations>()

    dataRequest.inputs?.forEach(req => {
        let {
            type,
            coinOwner,
            coinAssetId,
            contractContract,
            messageSender,
            messageRecipient,
            ...relations
        } = req
        let filter = new FilterBuilder<TransactionInput>()
        filter.propIn('type', req.type)
        filter.getIn(input => input.type == 'InputCoin' && assertNotNull(input.owner), coinOwner)
        filter.getIn(input => input.type == 'InputCoin' && assertNotNull(input.assetId), coinAssetId)
        filter.getIn(input => input.type == 'InputContract' && assertNotNull(input.contract), contractContract)
        filter.getIn(input => input.type == 'InputMessage' && assertNotNull(input.sender), messageSender)
        filter.getIn(input => input.type == 'InputMessage' && assertNotNull(input.recipient), messageRecipient)
        inputs.add(filter, relations)
    })

    return inputs
}


function buildOutputFilter(dataRequest: DataRequest): EntityFilter<TransactionOutput, OutputRelations> {
    let outputs = new EntityFilter<TransactionOutput, OutputRelations>()

    dataRequest.outputs?.forEach(req => {
        let {type, ...relations} = req
        let filter = new FilterBuilder<TransactionOutput>()
        filter.propIn('type', type)
        outputs.add(filter, relations)
    })

    return outputs
}


const getItemFilter = weakMemo((dataRequest: DataRequest) => {
    return {
        receipts: buildReceiptFilter(dataRequest),
        transactions: buildTransactionFilter(dataRequest),
        inputs: buildInputFilter(dataRequest),
        outputs: buildOutputFilter(dataRequest),
    }
})


export function filterBlock(block: Block, dataRequest: DataRequest): void {
    let items = getItemFilter(dataRequest)

    let include = new IncludeSet()

    let transactions = new Map(block.transactions.map(tx => [tx.index, tx]))
    let inputsByTx = groupBy(block.inputs, input => input.transactionIndex)
    let outputsByTx = groupBy(block.outputs, ouput => ouput.transactionIndex)
    let receiptsByTx = groupBy(block.receipts, receipt => receipt.transactionIndex)

    if (items.receipts.present()) {
        for (let receipt of block.receipts) {
            let rel = items.receipts.match(receipt)
            if (rel == null) continue
            include.addReceipt(receipt)
            if (rel.transaction) {
                let tx = assertNotNull(transactions.get(receipt.transactionIndex))
                include.addTransaction(tx)
            }
        }
    }

    if (items.transactions.present()) {
        for (let tx of block.transactions) {
            let rel = items.transactions.match(tx)
            if (rel == null) continue
            include.addTransaction(tx)
            if (rel.receipts) {
                let receipts = assertNotNull(receiptsByTx.get(tx.index))
                for (let receipt of receipts) {
                    include.addReceipt(receipt)
                }
            }
            if (rel.inputs) {
                let inputs = assertNotNull(inputsByTx.get(tx.index))
                for (let input of inputs) {
                    include.addInput(input)
                }
            }
            if (rel.outputs) {
                let outputs = assertNotNull(outputsByTx.get(tx.index))
                for (let output of outputs) {
                    include.addOutput(output)
                }
            }
        }
    }

    if (items.inputs.present()) {
        for (let input of block.inputs) {
            let rel = items.inputs.match(input)
            if (rel == null) continue
            include.addInput(input)
            if (rel.transaction) {
                let tx = assertNotNull(transactions.get(input.transactionIndex))
                include.addTransaction(tx)
            }
        }
    }

    if (items.outputs.present()) {
        for (let output of block.outputs) {
            let rel = items.outputs.match(output)
            if (rel == null) continue
            include.addOutput(output)
            if (rel.transaction) {
                let tx = assertNotNull(transactions.get(output.transactionIndex))
                include.addTransaction(tx)
            }
        }
    }

    block.receipts = block.receipts.filter(receipt => include.receipts.has(receipt))
    block.transactions = block.transactions.filter(tx => include.transactions.has(tx))
    block.inputs = block.inputs.filter(input => include.inputs.has(input))
    block.outputs = block.outputs.filter(output => include.outputs.has(output))
}


export function filterBlockBatch(requests: RangeRequest<DataRequest>[], blocks: Block[]): void {
    for (let block of blocks) {
        let dataRequest = getRequestAt(requests, block.header.height) || NO_DATA_REQUEST
        filterBlock(block, dataRequest)
    }
}


const NO_DATA_REQUEST: DataRequest = {}
