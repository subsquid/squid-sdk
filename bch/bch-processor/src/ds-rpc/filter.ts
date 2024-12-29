import {weakMemo} from '@subsquid/util-internal'
import {EntityFilter, FilterBuilder} from '@subsquid/util-internal-processor-tools'
import {Block, Transaction} from '../mapping/entities.js'
import {DataRequest} from '../interfaces/data-request.js'


function buildTransactionFilter(dataRequest: DataRequest): EntityFilter<Transaction, {
}> {
    let items = new EntityFilter()
    for (let req of dataRequest.transactions || []) {
        let {
            // address, tokenId
            ...relations} = req
        let filter = new FilterBuilder<Transaction>()
        // filter.propIn('address', address)
        // filter.propIn('tokenId', tokenId)
        items.add(filter, relations)
    }
    return items
}


const getItemFilter = weakMemo((dataRequest: DataRequest) => {
    return {
        transactions: buildTransactionFilter(dataRequest),
    }
})


class IncludeSet {
    transactions = new Set<Transaction>()
    addTransaction(tx?: Transaction): void {
        if (tx) this.transactions.add(tx)
    }
}


export function filterBlock(block: Block, dataRequest: DataRequest): void {
    let items = getItemFilter(dataRequest)

    let include = new IncludeSet()
    
    if (items.transactions.present()) {
        for (let tx of block.transactions) {
            let rel = items.transactions.match(tx)
            if (rel == null) continue
            include.addTransaction(tx)
        }
    }

    block.transactions = block.transactions.filter(tx => {
        if (!include.transactions.has(tx)) return false
        return true
    })
}
