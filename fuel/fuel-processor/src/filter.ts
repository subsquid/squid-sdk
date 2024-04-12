import {EntityFilter, FilterBuilder} from '@subsquid/util-internal-processor-tools'
import {assertNotNull, weakMemo} from '@subsquid/util-internal'
import {getRequestAt, RangeRequest} from '@subsquid/util-internal-range'
import {DataRequest} from './interfaces/data-request'
import {Block, Input, Output, Receipt, Transaction} from './mapping'


class IncludeSet {
    public readonly receipts = new Set<Receipt>()
    public readonly transactions = new Set<Transaction>()
    public readonly inputs = new Set<Input>()
    public readonly outputs = new Set<Output>()

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

    addInput(input?: Input): void {
        if (input) {
            this.inputs.add(input)
        }
    }

    addOutput(output?: Output): void {
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
        let {type, logDataContract, ...relations} = req
        let filter = new FilterBuilder<Receipt>()
        filter.propIn('receiptType', type)
        filter.propIn('contract', logDataContract)
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


function buildInputFilter(dataRequest: DataRequest): EntityFilter<Input, InputRelations> {
    let inputs = new EntityFilter<Input, InputRelations>()

    dataRequest.inputs?.forEach(req => {
        let {
            type,
            coinOwner,
            coinAssetId,
            coinPredicateRoot,
            contractContract,
            messageSender,
            messageRecipient,
            messagePredicateRoot,
            ...relations
        } = req
        let filter = new FilterBuilder<Input>()
        filter.propIn('type', req.type)
        filter.getIn(input => input.type == 'InputCoin' && assertNotNull(input.owner), coinOwner)
        filter.getIn(input => input.type == 'InputCoin' && assertNotNull(input.assetId), coinAssetId)
        filter.getIn(input => input.type == 'InputCoin' && assertNotNull(input._predicateRoot), coinPredicateRoot)
        filter.getIn(input => input.type == 'InputContract' && assertNotNull(input.contract), contractContract)
        filter.getIn(input => input.type == 'InputMessage' && assertNotNull(input.sender), messageSender)
        filter.getIn(input => input.type == 'InputMessage' && assertNotNull(input.recipient), messageRecipient)
        filter.getIn(input => input.type == 'InputMessage' && assertNotNull(input._predicateRoot), messagePredicateRoot)
        inputs.add(filter, relations)
    })

    return inputs
}


function buildOutputFilter(dataRequest: DataRequest): EntityFilter<Output, OutputRelations> {
    let outputs = new EntityFilter<Output, OutputRelations>()

    dataRequest.outputs?.forEach(req => {
        let {type, ...relations} = req
        let filter = new FilterBuilder<Output>()
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

    if (items.receipts.present()) {
        for (let receipt of block.receipts) {
            let rel = items.receipts.match(receipt)
            if (rel == null) continue
            include.addReceipt(receipt)
            if (rel.transaction) {
                include.addTransaction(receipt.transaction)
            }
        }
    }

    if (items.transactions.present()) {
        for (let tx of block.transactions) {
            let rel = items.transactions.match(tx)
            if (rel == null) continue
            include.addTransaction(tx)
            if (rel.receipts) {
                for (let receipt of tx.receipts) {
                    include.addReceipt(receipt)
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
                include.addTransaction(input.transaction)
            }
        }
    }

    if (items.outputs.present()) {
        for (let output of block.outputs) {
            let rel = items.outputs.match(output)
            if (rel == null) continue
            include.addOutput(output)
            if (rel.transaction) {
                include.addTransaction(output.transaction)
            }
        }
    }

    block.receipts = block.receipts.filter(receipt => {
        if (!include.receipts.has(receipt)) return false
        if (receipt.transaction && !include.transactions.has(receipt.transaction)) {
            receipt.transaction = undefined
        }
        return true
    })

    block.transactions = block.transactions.filter(tx => {
        if (!include.transactions.has(tx)) return false
        tx.receipts = tx.receipts.filter(receipt => include.receipts.has(receipt))
        tx.inputs = tx.inputs.filter(input => include.inputs.has(input))
        tx.outputs = tx.outputs.filter(output => include.outputs.has(output))
        return true
    })

    block.inputs = block.inputs.filter(input => {
        if (!include.inputs.has(input)) return false
        if (input.transaction && !include.transactions.has(input.transaction)) {
            input.transaction = undefined
        }
        return true
    })

    block.outputs = block.outputs.filter(output => {
        if (!include.outputs.has(output)) return false
        if (output.transaction && !include.transactions.has(output.transaction)) {
            output.transaction = undefined
        }
        return true
    })
}


export function filterBlockBatch(requests: RangeRequest<DataRequest>[], blocks: Block[]): void {
    for (let block of blocks) {
        let dataRequest = getRequestAt(requests, block.header.height) || NO_DATA_REQUEST
        filterBlock(block, dataRequest)
    }
}


const NO_DATA_REQUEST: DataRequest = {}
